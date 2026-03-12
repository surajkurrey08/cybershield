# 🛡️ CyberShield v2.0 — Cyber Attack Detection System

Full-stack MERN application with real-time threat detection, authentication, geo-mapping, and live network monitoring.

---

## 🚀 Quick Start

### Step 1 — Backend Setup
```bash
cd backend
npm install
npm run seed     # Creates default users in MongoDB
npm run dev      # Starts on port 5000
```

### Step 2 — Frontend Setup
```bash
cd frontend
npm install
npm start        # Starts on port 3000
```

### Step 3 — Open Browser
```
http://localhost:3000
```

**Default Login:** `admin` / `Admin@1234`

---

## 📋 Features

### ✅ Authentication System
- JWT-based login/register
- Bcrypt password hashing
- Role-based access: **Admin**, **Analyst**, **Viewer**
- Session persistence (7 days)
- Activity logging per user

### ✅ Real-Time Dashboard
- Live stats: packets analyzed, threats blocked, critical count
- Area chart: bandwidth (inbound/outbound)
- Bar chart: attack rate per cycle
- Pie chart: attack type distribution
- Line chart: active connections
- Recent attacks table with severity badges

### ✅ Network Traffic Analysis
- Live packet table (50 most recent)
- Protocol distribution bars (TCP/UDP/HTTP/HTTPS/etc)
- Real-time bandwidth area chart
- Connection stats (active, new, closed)

### ✅ 📡 Real Network Capture (NEW)
- Reads actual OS network interfaces via Node.js `os` module
- Real memory usage with animated progress bar
- Real CPU info, hostname, uptime, load averages
- Real bandwidth measurement from `/sys/class/net/` (Linux)
- Active connection count via `ss` or `netstat`
- Live bandwidth history chart (RX/TX KB/s)
- Guide to enable full packet capture with libpcap

### ✅ Threat Alerts
- Real-time alert notifications (toast popups)
- Priority-sorted: critical first
- Acknowledge / Dismiss per alert
- Severity filter (critical/high/medium/low)
- Status filter (active/acknowledged)
- Critical alert banner with pulse animation

### ✅ Attack Logs
- Full searchable/filterable table
- Filter by IP, type, severity
- Pagination (20 per page)
- **CSV Export** with timestamp
- Session summary (critical/high/medium/low counts)

### ✅ Geo-Location Map
- World map with Leaflet.js (Dark/Light tiles)
- Color-coded attack pins by severity
- Click popup: IP, country, city, attack type, time
- Top 10 attack source countries with flags
- Country bar chart
- Dark map in dark mode, normal map in light mode

### ✅ IP Firewall
- Manual IP blocking with reason, severity, notes
- **Auto-blocking**: IPs with 3+ critical/high attacks are auto-blocked
- Unblock / Delete IPs
- Real-time Socket.io updates (no page refresh needed)
- Block history with who blocked and when

### ✅ Detection Rules
- 10 built-in rules with toggle on/off
- **Custom Rule Builder**:
  - Name, description, type, severity
  - Payload keyword matching
  - Port-based detection
  - Request rate threshold
  - Failed login threshold
- Rules persist in MongoDB

### ✅ User Management (Admin Only)
- Create users with roles
- Change user roles (admin/analyst/viewer)
- Activate / Deactivate accounts
- Delete users
- View per-user activity log (logins, actions, IPs)

### ✅ Dark / Light Theme
- Toggle button in sidebar (☀️/🌙)
- CSS variables for every color
- Persists in localStorage
- Geo map tiles switch automatically

### ✅ Mobile Responsive
- Hamburger menu on mobile
- Collapsible sidebar
- Responsive grids (4 col → 2 col → 1 col)
- Tables with horizontal scroll

---

## 🔧 Detection Rules

| Rule ID   | Name              | Severity | Detects |
|-----------|-------------------|----------|---------|
| RULE_001  | SQL Injection      | Critical | OR 1=1, UNION SELECT, DROP TABLE |
| RULE_002  | XSS Attack         | High     | `<script>`, `onerror=`, `javascript:` |
| RULE_003  | DDoS Flood         | Critical | Request rate > 1000/s |
| RULE_004  | Port Scan          | Medium   | 10+ ports scanned |
| RULE_005  | Brute Force        | High     | 5+ failed logins |
| RULE_006  | Dir Traversal      | High     | `../../../`, `%2e%2e%2f` |
| RULE_007  | Cmd Injection      | Critical | `; ls`, `&& cat`, `$(id)` |
| RULE_008  | Suspicious Port    | Low      | Ports 22,23,3389,3306,27017 |
| RULE_009  | CSRF               | Medium   | CSRF flag or suspicious referer |
| RULE_010  | Malware Signature  | Critical | EICAR, MZ header, shellcode |

---

## 🔌 Real Network Capture — Full Setup

For production deep packet inspection:

```bash
# Linux
sudo apt-get install libpcap-dev
cd backend && npm install cap
sudo node server.js

# macOS  
brew install libpcap
cd backend && npm install cap
sudo node server.js

# Set interface in .env
NET_INTERFACE=eth0
CAPTURE_MODE=live
```

Current version reads:
- `/proc/net/dev` — real byte counts
- `/sys/class/net/<iface>/statistics/` — interface stats
- `ss -s` — real connection counts
- `os.networkInterfaces()` — real IPs/MACs
- `os.totalmem()`, `os.freemem()` — real memory
- `os.loadavg()` — real CPU load

---

## 📁 Project Structure

```
cybershield-v2/
├── backend/
│   ├── models/         Attack, Alert, User, BlockedIP, CustomRule
│   ├── routes/         auth, attacks, alerts, stats, users, ipblock, customrules, netcapture
│   ├── middleware/     auth.js (JWT protect + role guard)
│   ├── utils/          ruleEngine, trafficSimulator, realCapture, logger, seedData
│   ├── server.js       Express + Socket.io + MongoDB + Cron
│   └── .env
└── frontend/
    └── src/
        ├── components/
        │   ├── Auth/         AuthPage + Auth.css
        │   ├── Layout/       Sidebar + Header
        │   ├── Dashboard/    Dashboard + GeoMap
        │   ├── Alerts/       Alerts
        │   ├── Logs/         Logs
        │   ├── Network/      Network + RealCapture
        │   ├── IPBlock/      IPBlock
        │   ├── Rules/        Rules (built-in + custom builder)
        │   └── Users/        Users (admin panel)
        ├── context/        AuthContext, SocketContext, ThemeContext
        └── styles/         global.css (theme vars), components.css
```

---

## 🌐 API Routes

| Method | Route                          | Auth  | Description |
|--------|-------------------------------|-------|-------------|
| POST   | /api/auth/login                | Public | Login |
| POST   | /api/auth/register             | Public | Register |
| GET    | /api/auth/me                   | User  | Get current user |
| GET    | /api/attacks                   | User  | List attacks |
| GET    | /api/attacks/geo               | User  | Geo data for map |
| GET    | /api/alerts                    | User  | List alerts |
| PATCH  | /api/alerts/:id/acknowledge    | User  | Acknowledge alert |
| GET    | /api/stats/summary             | User  | Dashboard stats |
| GET    | /api/ipblock                   | User  | List blocked IPs |
| POST   | /api/ipblock                   | Analyst+ | Block IP |
| PATCH  | /api/ipblock/:id/unblock       | Admin | Unblock IP |
| GET    | /api/customrules               | User  | List custom rules |
| POST   | /api/customrules               | Analyst+ | Create rule |
| GET    | /api/users                     | Admin | List users |
| POST   | /api/users                     | Admin | Create user |
| PATCH  | /api/users/:id                 | Admin | Update user |
| DELETE | /api/users/:id                 | Admin | Delete user |

---

## ⚡ Socket.io Events

| Event          | Direction | Data |
|---------------|-----------|------|
| new_alert      | Server → Client | Alert object |
| attack_detected| Server → Client | Attack object with geo |
| traffic_update | Server → Client | Packets + bandwidth |
| stats_update   | Server → Client | Counters |
| system_stats   | Server → Client | OS stats, interfaces, bandwidth |
| ip_blocked     | Server → Client | BlockedIP object |
| ip_unblocked   | Server → Client | BlockedIP object |
| alert_updated  | Server → Client | Updated alert |

---

## 🔑 Default Users (after npm run seed)

| Username | Password    | Role    |
|----------|------------|---------|
| admin    | Admin@1234 | Admin   |
| analyst  | Analyst@123| Analyst |
| viewer   | Viewer@123 | Viewer  |

---

Built with: **React 18, Express, MongoDB, Socket.io, Recharts, Leaflet, JWT, bcrypt**
