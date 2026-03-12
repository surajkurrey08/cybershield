const geoip = require('geoip-lite');

const BUILT_IN_RULES = [
  { id:'RULE_001', name:'SQL Injection',      type:'SQL_INJECTION',   severity:'critical',
    check: p => p.payload && ["' OR","UNION SELECT","DROP TABLE","1=1","xp_cmdshell","EXEC(","CAST("].some(x => p.payload.toUpperCase().includes(x.toUpperCase())),
    description:'SQL injection attempt in payload' },
  { id:'RULE_002', name:'XSS Attack',         type:'XSS',             severity:'high',
    check: p => p.payload && ['<script>','javascript:','onerror=','onload=','alert(','document.cookie'].some(x => p.payload.toLowerCase().includes(x)),
    description:'Cross-Site Scripting attempt' },
  { id:'RULE_003', name:'DDoS Flood',         type:'DDOS',            severity:'critical',
    check: p => p.requestRate && p.requestRate > 1000,
    description:'High request rate flood attack' },
  { id:'RULE_004', name:'Port Scan',          type:'PORT_SCAN',       severity:'medium',
    check: p => p.scanFlag || (p.portsScanned && p.portsScanned > 10),
    description:'Port scanning from source IP' },
  { id:'RULE_005', name:'Brute Force',        type:'BRUTE_FORCE',     severity:'high',
    check: p => p.failedLogins && p.failedLogins > 5,
    description:'Multiple failed login attempts' },
  { id:'RULE_006', name:'Dir Traversal',      type:'DIR_TRAVERSAL',   severity:'high',
    check: p => p.payload && ['../../../','..\\..\\','%2e%2e%2f'].some(x => p.payload.includes(x)),
    description:'Directory traversal attempt' },
  { id:'RULE_007', name:'Cmd Injection',      type:'CMD_INJECTION',   severity:'critical',
    check: p => p.payload && ['; ls','&& cat','| whoami','; rm -rf','`id`','$(id)'].some(x => p.payload.includes(x)),
    description:'OS command injection attempt' },
  { id:'RULE_008', name:'Suspicious Port',    type:'SUSPICIOUS_PORT', severity:'low',
    check: p => [22,23,3389,1433,3306,5432,27017,6379,9200].includes(p.port) && p.external,
    description:'Access on sensitive port' },
  { id:'RULE_009', name:'CSRF',               type:'CSRF',            severity:'medium',
    check: p => p.csrfFlag || (p.referer && p.referer.includes('malicious')),
    description:'Cross-Site Request Forgery attempt' },
  { id:'RULE_010', name:'Malware Signature',  type:'MALWARE',         severity:'critical',
    check: p => p.payload && ['4D5A9000','EICAR-TEST','X5O!P%@AP'].some(x => p.payload.includes(x)),
    description:'Malware signature in traffic' },
];

function detectAttack(packet, customRules = []) {
  const allRules = [...BUILT_IN_RULES, ...customRules];
  for (const rule of allRules) {
    try {
      let match = false;
      if (rule.check) {
        match = rule.check(packet);
      } else if (rule.conditions) {
        const c = rule.conditions;
        if (c.payloadContains?.length && packet.payload) {
          match = c.payloadContains.some(p => packet.payload.toLowerCase().includes(p.toLowerCase()));
        }
        if (!match && c.ports?.length) match = c.ports.includes(packet.port) && packet.external;
        if (!match && c.requestRate)   match = packet.requestRate > c.requestRate;
        if (!match && c.failedLogins)  match = packet.failedLogins > c.failedLogins;
        if (!match && c.portsScanned)  match = packet.portsScanned > c.portsScanned;
      }
      if (match) {
        return { type:rule.type, severity:rule.severity, description:rule.description || '', rule:rule.id, ruleName:rule.name };
      }
    } catch(e) {}
  }
  return null;
}

function enrichWithGeo(packet) {
  const geo = geoip.lookup(packet.sourceIP);
  if (geo) {
    packet.country = geo.country || 'Unknown';
    packet.city    = geo.city    || '';
    packet.lat     = geo.ll?.[0] || null;
    packet.lon     = geo.ll?.[1] || null;
  } else {
    packet.country = 'Unknown';
  }
  return packet;
}

function getAllRules() {
  return BUILT_IN_RULES.map(r => ({
    id:r.id, name:r.name, type:r.type, severity:r.severity, description:r.description, isCustom:false
  }));
}

module.exports = { detectAttack, enrichWithGeo, getAllRules };
