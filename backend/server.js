const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const cron       = require('node-cron');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const authRoutes       = require('./routes/auth');
const netCaptureRoutes = require('./routes/netcapture');
const captureRoutes    = require('./routes/capture');
const { getRealSystemStats, getRealNetworkStats, getActiveConnections, getRealBandwidth } = require('./utils/realCapture');
const attackRoutes     = require('./routes/attacks');
const alertRoutes      = require('./routes/alerts');
const statsRoutes      = require('./routes/stats');
const usersRoutes      = require('./routes/users');
const ipblockRoutes    = require('./routes/ipblock');
const customRuleRoutes = require('./routes/customrules');
const { detectAttack, enrichWithGeo } = require('./utils/ruleEngine');
const { simulateTraffic } = require('./utils/trafficSimulator');
const logger = require('./utils/logger');

// ---- CORS Config ----
const allowedOrigins = [
  'http://localhost:3000',
  'https://cybershield-ysnl.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ---- Middleware ----
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json());
app.use(morgan('combined', { stream:{ write: msg => logger.info(msg.trim()) }}));
app.set('io', io);

// ---- Routes ----
app.use('/api/auth',        authRoutes);
app.use('/api/attacks',     attackRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/stats',       statsRoutes);
app.use('/api/users',       usersRoutes);
app.use('/api/ipblock',     ipblockRoutes);
app.use('/api/customrules', customRuleRoutes);
app.use('/api/netcapture', netCaptureRoutes);
app.use('/api/capture',    captureRoutes);

app.get('/api/network/rules', (req, res) => {
  const { getAllRules } = require('./utils/ruleEngine');
  res.json({ success:true, data: getAllRules() });
});
app.get('/api/health', (req, res) => {
  res.json({ status:'ok', timestamp: new Date(), uptime: process.uptime() });
});

// ---- Socket.io ----
io.on('connection', socket => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on('subscribe_alerts',  () => socket.join('alerts_room'));
  socket.on('subscribe_traffic', () => socket.join('traffic_room'));
  socket.on('disconnect', () => logger.info(`Client disconnected: ${socket.id}`));
});

// ---- Auto-block logic ----
const ipAttackCount = {};
async function autoBlockIP(ip, attackType, severity) {
  if (severity !== 'critical' && severity !== 'high') return;
  ipAttackCount[ip] = (ipAttackCount[ip] || 0) + 1;
  if (ipAttackCount[ip] >= 3) {
    try {
      const BlockedIP = require('./models/BlockedIP');
      const exists = await BlockedIP.findOne({ ip, isActive:true });
      if (!exists) {
        const blocked = await BlockedIP.create({
          ip, reason:`Auto-blocked: ${ipAttackCount[ip]} ${attackType} attacks`,
          severity, blockedBy:'system', autoBlocked:true
        });
        io.emit('ip_blocked', blocked);
        logger.info(`Auto-blocked IP: ${ip} (${attackType} x${ipAttackCount[ip]})`);
        ipAttackCount[ip] = 0;
      }
    } catch(e) {}
  }
}

// ---- Live Stats Counter ----
let statsCounter = { total:0, blocked:0, critical:0, warnings:0 };

// ---- Simulation Engine ----
async function startSimulation() {
  let customRules = [];

  // Refresh custom rules every minute
  cron.schedule('*/60 * * * * *', async () => {
    try {
      const CustomRule = require('./models/CustomRule');
      const rules = await CustomRule.find({ isActive:true });
      customRules = rules.map(r => ({ ...r.toObject(), check: null }));
    } catch(e) {}
  });

  cron.schedule('*/3 * * * * *', async () => {
    const traffic = simulateTraffic();
    io.to('traffic_room').emit('traffic_update', traffic);

    for (const packet of traffic.packets) {
      const enriched = enrichWithGeo(packet);
      const result   = detectAttack(enriched, customRules);

      if (result) {
        statsCounter.blocked++;
        if (result.severity === 'critical') statsCounter.critical++;
        else if (result.severity === 'high' || result.severity === 'medium') statsCounter.warnings++;

        const alertPayload = {
          id: uuidv4(), type: result.type, severity: result.severity,
          sourceIP: enriched.sourceIP, destIP: enriched.destIP,
          port: enriched.port, protocol: enriched.protocol,
          description: result.description, ruleTriggered: result.rule,
          country: enriched.country, city: enriched.city,
          lat: enriched.lat, lon: enriched.lon,
          timestamp: new Date(), status:'active'
        };

        if (mongoose.connection.readyState === 1) {
          try {
            const Attack    = require('./models/Attack');
            const Alert     = require('./models/Alert');
            const BlockedIP = require('./models/BlockedIP');
            const isBlocked = await BlockedIP.findOne({ ip:enriched.sourceIP, isActive:true });

            await new Attack({
              sourceIP:enriched.sourceIP, destIP:enriched.destIP,
              port:enriched.port, protocol:enriched.protocol,
              attackType:result.type, severity:result.severity,
              payload:enriched.payload, country:enriched.country,
              city:enriched.city, lat:enriched.lat, lon:enriched.lon,
              size:enriched.size, blocked:!!isBlocked
            }).save();

            await new Alert(alertPayload).save();
            await autoBlockIP(enriched.sourceIP, result.type, result.severity);
          } catch(e) {}
        }

        io.to('alerts_room').emit('new_alert', alertPayload);
        io.emit('attack_detected', alertPayload);
      }
    }

    statsCounter.total += traffic.packets.length;
    io.emit('stats_update', { ...statsCounter, timestamp: new Date() });
  });

  logger.info('🔍 Simulation engine started');
  
  // Broadcast real system stats every 5 seconds
  cron.schedule('*/5 * * * * *', () => {
    try {
      const sysstats = getRealSystemStats();
      const netfaces = getRealNetworkStats();
      const bw       = getRealBandwidth('eth0') || getRealBandwidth('lo');
      const conns    = getActiveConnections();
      io.emit('system_stats', { ...sysstats, networkInterfaces: netfaces, bandwidth: bw, activeConnections: conns, timestamp: new Date() });
    } catch(e) {}
  });
}

// ---- MongoDB Connect ----
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { logger.info('✅ MongoDB Connected'); startSimulation(); })
  .catch(err => { logger.error('MongoDB error:', err.message); logger.warn('⚠️  Running without DB'); startSimulation(); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`🛡️  CyberShield v2 running on port ${PORT}`));

module.exports = { app, io };
