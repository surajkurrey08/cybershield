const { v4: uuidv4 } = require('uuid');

const PROTOCOLS = ['TCP','UDP','HTTP','HTTPS','FTP','SSH','DNS','ICMP'];
const GEO_IPS = [
  { ip:'1.180.0.1',    country:'CN', city:'Beijing',     lat:39.9, lon:116.3 },
  { ip:'5.188.0.1',    country:'RU', city:'Moscow',      lat:55.7, lon:37.6  },
  { ip:'45.33.0.1',    country:'US', city:'Dallas',      lat:32.7, lon:-96.8 },
  { ip:'91.108.0.1',   country:'DE', city:'Frankfurt',   lat:50.1, lon:8.6   },
  { ip:'103.21.0.1',   country:'IN', city:'Mumbai',      lat:19.0, lon:72.8  },
  { ip:'77.88.0.1',    country:'RU', city:'St Petersburg',lat:59.9,lon:30.3  },
  { ip:'223.5.0.1',    country:'CN', city:'Shanghai',    lat:31.2, lon:121.4 },
  { ip:'196.12.0.1',   country:'NG', city:'Lagos',       lat:6.4,  lon:3.4   },
  { ip:'62.182.0.1',   country:'UA', city:'Kyiv',        lat:50.4, lon:30.5  },
  { ip:'185.220.0.1',  country:'NL', city:'Amsterdam',   lat:52.3, lon:4.9   },
  { ip:'159.65.0.1',   country:'SG', city:'Singapore',   lat:1.3,  lon:103.8 },
  { ip:'37.49.0.1',    country:'IR', city:'Tehran',      lat:35.6, lon:51.3  },
];

const ATTACK_PAYLOADS = [
  "' OR 1=1 --", "<script>alert('xss')</script>", "../../../etc/passwd",
  "UNION SELECT * FROM users", "; rm -rf /", "$(whoami)",
  "javascript:alert(1)", "xp_cmdshell('dir')", "EICAR-TEST-SIGNATURE", "; ls -la /var/www"
];
const NORMAL_PAYLOADS = [
  "GET /api/users HTTP/1.1","POST /login HTTP/1.1","GET /dashboard HTTP/1.1",
  "PUT /api/settings HTTP/1.1","GET /static/main.js HTTP/1.1"
];
const COMMON_PORTS    = [80,443,8080,3000,5000,8443];
const SENSITIVE_PORTS = [22,23,3389,1433,3306,5432,27017,6379];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generatePacket() {
  const isAttack       = Math.random() < 0.15;
  const isSensitivePort= Math.random() < 0.1;
  const geoSource      = rnd(GEO_IPS);
  const port           = isSensitivePort ? rnd(SENSITIVE_PORTS) : rnd(COMMON_PORTS);
  const packet = {
    id:        require('uuid').v4(),
    sourceIP:  geoSource.ip,
    destIP:    `192.168.${Math.floor(Math.random()*10)}.${Math.floor(Math.random()*254)+1}`,
    port,
    protocol:  rnd(PROTOCOLS),
    size:      Math.floor(Math.random()*8000)+64,
    country:   geoSource.country,
    city:      geoSource.city,
    lat:       geoSource.lat,
    lon:       geoSource.lon,
    timestamp: new Date(),
    external:  true,
    isAttack
  };
  if (isAttack) {
    const t = Math.floor(Math.random()*5);
    if (t===0) packet.payload       = rnd(ATTACK_PAYLOADS);
    if (t===1) packet.requestRate   = Math.floor(Math.random()*2000)+1001;
    if (t===2) { packet.scanFlag = true; packet.portsScanned = Math.floor(Math.random()*50)+11; }
    if (t===3) packet.failedLogins  = Math.floor(Math.random()*20)+6;
    if (t===4) { packet.payload = rnd(ATTACK_PAYLOADS); }
  } else {
    packet.payload = rnd(NORMAL_PAYLOADS);
  }
  return packet;
}

function simulateTraffic() {
  const count   = Math.floor(Math.random()*8)+3;
  const packets = Array.from({ length: count }, generatePacket);
  const totalBytes = packets.reduce((s,p) => s+p.size, 0);
  return {
    packets,
    timestamp: new Date(),
    bandwidth: {
      inbound:    Math.floor(Math.random()*500)+100,
      outbound:   Math.floor(Math.random()*200)+50,
      totalBytes
    },
    connections: {
      active: Math.floor(Math.random()*500)+100,
      new:    Math.floor(Math.random()*50),
      closed: Math.floor(Math.random()*30)
    }
  };
}

module.exports = { simulateTraffic, generatePacket };
