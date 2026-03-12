import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../context/SocketContext';
import { useTheme }  from '../../context/ThemeContext';
import Header from '../Layout/Header';
import { format } from 'date-fns';
import './GeoMap.css';

const SEV_COLOR = { critical:'#ff2d55', high:'#ff7c00', medium:'#ffd700', low:'#00d4ff' };
const SEV_RADIUS= { critical:10, high:8, medium:6, low:4 };

const FLAG_MAP = { US:'🇺🇸',CN:'🇨🇳',RU:'🇷🇺',DE:'🇩🇪',IN:'🇮🇳',UA:'🇺🇦',NL:'🇳🇱',SG:'🇸🇬',IR:'🇮🇷',NG:'🇳🇬',BR:'🇧🇷',KR:'🇰🇷' };

export default function GeoMap() {
  const { attackHistory } = useSocket();
  const { theme } = useTheme();

  const geoAttacks = useMemo(() =>
    attackHistory.filter(a => a.lat && a.lon).slice(0, 200),
  [attackHistory]);

  const countryCounts = useMemo(() => {
    const c = {};
    attackHistory.forEach(a => { if (a.country) c[a.country] = (c[a.country]||0)+1; });
    return Object.entries(c).sort(([,a],[,b])=>b-a).slice(0,10);
  }, [attackHistory]);

  const critCount  = geoAttacks.filter(a=>a.severity==='critical').length;
  const countries  = new Set(attackHistory.map(a=>a.country).filter(Boolean)).size;

  const tileUrl = theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  return (
    <div className="page">
      <Header title="GEO-LOCATION ATTACK MAP" subtitle={`${geoAttacks.length} attacks mapped — ${countries} source countries`}/>
      <div className="geomap__content">

        <div className="geomap__stats-grid">
          <GeoStat title="MAPPED ATTACKS"  value={geoAttacks.length} color="var(--accent-cyan)"   icon="📍"/>
          <GeoStat title="CRITICAL HITS"   value={critCount}          color="var(--accent-red)"    icon="🔴"/>
          <GeoStat title="SOURCE COUNTRIES"value={countries}           color="var(--accent-purple)" icon="🌍"/>
        </div>

        {/* Map */}
        <div className="cyber-card geomap__map-panel">
          <div className="geomap__map-title">
            <span className="pulse-dot pulse-dot-red"/>
            LIVE ATTACK MAP — REAL TIME GEOLOCATION
          </div>
          <div className="geomap__map-wrap">
            <MapContainer center={[20, 0]} zoom={2} style={{height:'100%',width:'100%'}} zoomControl={true}>
              <TileLayer url={tileUrl} attribution=""/>
              {geoAttacks.map((a, i) => (
                <CircleMarker
                  key={a.id||i}
                  center={[a.lat, a.lon]}
                  radius={SEV_RADIUS[a.severity]||5}
                  fillColor={SEV_COLOR[a.severity]||'#00d4ff'}
                  color={SEV_COLOR[a.severity]||'#00d4ff'}
                  weight={1} opacity={0.9} fillOpacity={0.7}
                >
                  <Popup>
                    <div style={{fontFamily:'Share Tech Mono',fontSize:12,minWidth:160,background:'#0d1f35',color:'#e0f4ff',padding:8,borderRadius:4}}>
                      <div style={{color:SEV_COLOR[a.severity],fontWeight:700,marginBottom:4}}>{a.type?.replace(/_/g,' ')}</div>
                      <div>IP: {a.sourceIP}</div>
                      <div>Country: {a.country} {FLAG_MAP[a.country]||''}</div>
                      <div>City: {a.city||'Unknown'}</div>
                      <div>Severity: <span style={{color:SEV_COLOR[a.severity]}}>{a.severity}</span></div>
                      <div style={{color:'#3d6b8a',marginTop:4}}>{a.timestamp?format(new Date(a.timestamp),'HH:mm:ss'):'-'}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          {/* Legend */}
          <div style={{display:'flex',gap:16,marginTop:12,flexWrap:'wrap'}}>
            {Object.entries(SEV_COLOR).map(([sev,color]) => (
              <div key={sev} style={{display:'flex',alignItems:'center',gap:6,fontFamily:'Share Tech Mono',fontSize:11,color:'var(--text-secondary)'}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:color,boxShadow:`0 0 6px ${color}`}}/>
                {sev.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Country breakdown */}
        <div className="cyber-card geomap__country-panel">
          <div className="geomap__country-title">TOP ATTACK SOURCES BY COUNTRY</div>
          <div className="geomap__country-list">
            {countryCounts.length === 0 ? (
              <div style={{color:'var(--text-muted)',fontFamily:'var(--font-mono)',fontSize:12,textAlign:'center',padding:20}}>Waiting for geo data...</div>
            ) : countryCounts.map(([country, count]) => (
              <div key={country} className="country-row">
                <span className="country-row__flag">{FLAG_MAP[country]||'🏳️'}</span>
                <span className="country-row__name">{country}</span>
                <span className="country-row__count">{count}</span>
                <div style={{width:80,height:4,background:'rgba(26,58,92,0.5)',borderRadius:2,marginLeft:'auto'}}>
                  <div style={{height:'100%',background:'var(--accent-red)',borderRadius:2,width:`${Math.min(100,(count/countryCounts[0][1])*100)}%`,transition:'width 0.5s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function GeoStat({ title, value, color, icon }) {
  return (
    <div className="cyber-card stat-card fade-in-up">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <div className="stat-card__label">{title}</div>
          <div className="stat-card__value" style={{color}}>{value}</div>
        </div>
        <div className="stat-card__icon" style={{filter:`drop-shadow(0 0 6px ${color})`}}>{icon}</div>
      </div>
    </div>
  );
}
