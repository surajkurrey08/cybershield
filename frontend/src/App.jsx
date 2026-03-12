import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth }    from './context/AuthContext';
import { SocketProvider }           from './context/SocketContext';
import { ThemeProvider }            from './context/ThemeContext';
import Sidebar    from './components/Layout/Sidebar';
import AuthPage   from './components/Auth/AuthPage';
import Dashboard  from './components/Dashboard/Dashboard';
import Network    from './components/Network/Network';
import RealCapture from './components/Network/RealCapture';
import Alerts     from './components/Alerts/Alerts';
import Logs       from './components/Logs/Logs';
import GeoMap     from './components/Dashboard/GeoMap';
import IPBlock    from './components/IPBlock/IPBlock';
import Rules      from './components/Rules/Rules';
import Users      from './components/Users/Users';
import './styles/global.css';
import './styles/components.css';
import './App.css';

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Routes>
          <Route path="/"          element={<Dashboard/>}   />
          <Route path="/network"   element={<Network/>}     />
          <Route path="/capture"   element={<RealCapture/>} />
          <Route path="/alerts"    element={<Alerts/>}      />
          <Route path="/logs"      element={<Logs/>}        />
          <Route path="/geomap"    element={<GeoMap/>}      />
          <Route path="/ipblock"   element={<IPBlock/>}     />
          <Route path="/rules"     element={<Rules/>}       />
          <Route path="/users"     element={<Users/>}       />
          <Route path="*"          element={<Navigate to="/" replace/>}/>
        </Routes>
      </div>
    </div>
  );
}

function AppGate() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-primary)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>🛡️</div>
        <div style={{fontFamily:'var(--font-display)',color:'var(--accent-cyan)',letterSpacing:4,fontSize:14}}>INITIALIZING...</div>
      </div>
    </div>
  );
  return user ? <SocketProvider><AppLayout/></SocketProvider> : <AuthPage/>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppGate/>
          <Toaster position="bottom-right" toastOptions={{
            style:{ background:'var(--bg-card)',color:'var(--text-primary)',border:'1px solid var(--border-color)',fontFamily:'Share Tech Mono',fontSize:12 }
          }}/>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
