import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ShieldCheck, Wallet, ChevronRight, LogOut } from 'lucide-react';
import { formatAddress, disconnectWallet } from '../utils/ethereum';
import './Navbar.css';

const Navbar = ({ account, role, onConnect, isConnecting, onDisconnect }) => {
    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/" className="logo-container">
                    <ShieldCheck size={32} strokeWidth={2.5} className="logo-icon" />
                    <span className="gradient-text">Guardian</span>
                </Link>
                <div className="nav-links">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        Home
                    </NavLink>
                    {(!role || role === 'whistleblower') && (
                        <>
                            <NavLink to="/submit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                Submit Evidence
                            </NavLink>
                            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                Dashboard
                            </NavLink>
                        </>
                    )}
                    {role === 'investigator' && (
                        <NavLink to="/investigator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Investigator DB
                        </NavLink>
                    )}
                    {role === 'admin' && (
                        <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Admin DB
                        </NavLink>
                    )}
                </div>
            </div>

            <div className="nav-right">
                {account ? (
                    <div className="connected-btn" title="Connected Wallet" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="status-dot tooltip"></span>
                        {formatAddress(account)}
                        <LogOut
                            size={16}
                            style={{ cursor: 'pointer', marginLeft: '5px' }}
                            onClick={onDisconnect}
                        />
                    </div>
                ) : (
                    <button
                        className="connect-btn"
                        onClick={onConnect}
                        disabled={isConnecting}
                    >
                        <Wallet size={18} />
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
