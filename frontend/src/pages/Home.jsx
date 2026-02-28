import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LockKeyhole, EyeOff, FileText } from 'lucide-react';
import './Home.css';
import { motion } from 'framer-motion';

const Home = ({ account, role, onConnect }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (account && role) {
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'investigator') {
                navigate('/investigator');
            } else {
                navigate('/submit');
            }
        }
    }, [account, role, navigate]);

    const handleActionClick = () => {
        if (!account) {
            onConnect();
        }
    };

    return (
        <div className="home-container">
            <motion.div
                className="hero-section"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className="hero-badge">
                    <ShieldAlert size={16} /> Beta Network Active
                </div>
                <h1 className="hero-title">
                    Uncompromised <span className="gradient-text">Whistleblower</span> Protection
                </h1>
                <p className="hero-subtitle">
                    Submit highly sensitive encrypted evidence backed by Polygon blockchain technology and decentralized IPFS storage. Speak the truth without revealing your identity.
                </p>

                <div className="hero-actions">
                    <button className="btn-primary" onClick={handleActionClick}>
                        {account ? 'Submit Evidence' : 'Connect Wallet to Start'}
                        <ArrowRight size={20} />
                    </button>
                </div>
            </motion.div>

            <motion.div
                className="features-grid"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <div className="feature-card glass-panel">
                    <div className="feature-icon-wrapper">
                        <LockKeyhole size={32} />
                    </div>
                    <h3 className="feature-title">End-to-End Encryption</h3>
                    <p className="feature-desc">Your evidence is heavily encrypted locally on your machine before leaving your browser. Only verified individuals can decrypt it.</p>
                </div>

                <div className="feature-card glass-panel">
                    <div className="feature-icon-wrapper">
                        <EyeOff size={32} />
                    </div>
                    <h3 className="feature-title">Total Anonymity</h3>
                    <p className="feature-desc">Since we leverage MetaMask and public blockchain routing, zero personal identity information is tied to your submissions.</p>
                </div>

                <div className="feature-card glass-panel">
                    <div className="feature-icon-wrapper">
                        <FileText size={32} />
                    </div>
                    <h3 className="feature-title">Immutable Ledger</h3>
                    <p className="feature-desc">File hashes are pinned permanently to the Polygon blockchain. Your evidence can never be tampered with, deleted, or altered.</p>
                </div>
            </motion.div>
        </div >
    );
};

export default Home;
