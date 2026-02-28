import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Submit from './pages/Submit';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import InvestigatorDashboard from './pages/InvestigatorDashboard';
import './App.css';
import { connectWallet, checkConnection, listenToAccountChanges } from './utils/ethereum';

function App() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    checkConnection(setAccount);
    listenToAccountChanges(setAccount);
  }, []);

  useEffect(() => {
    if (account) {
      fetch(`http://localhost:5000/api/auth/role?address=${account}`)
        .then(res => res.json())
        .then(data => setRole(data.role))
        .catch(err => console.error("Failed to check role:", err));
    } else {
      setRole(null);
    }
  }, [account]);

  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet(setAccount);
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    import('./utils/ethereum').then(m => m.disconnectWallet(setAccount));
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar account={account} role={role} onConnect={handleConnect} isConnecting={isConnecting} onDisconnect={handleDisconnect} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home account={account} role={role} onConnect={handleConnect} />} />
            <Route path="/submit" element={<Submit account={account} />} />
            <Route path="/dashboard" element={<Dashboard account={account} />} />
            <Route path="/admin" element={role === 'admin' ? <AdminDashboard account={account} /> : <Home account={account} role={role} onConnect={handleConnect} />} />
            <Route path="/investigator" element={role === 'investigator' ? <InvestigatorDashboard account={account} /> : <Home account={account} role={role} onConnect={handleConnect} />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          },
          success: { iconTheme: { primary: '#00e676', secondary: '#050505' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#050505' } }
        }}
      />
    </Router>
  );
}

export default App;
