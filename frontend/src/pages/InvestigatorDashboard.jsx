import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, Clock, FileKey, Lock, Unlock, Zap, Activity, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import CryptoJS from 'crypto-js';
import secrets from 'secrets.js';
import { signAuthMessage } from '../utils/auth';
import './InvestigatorDashboard.css';

const InvestigatorDashboard = ({ account }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [decryptedData, setDecryptedData] = useState(null);

    const API_URL = 'http://localhost:5000/api/investigator';

    useEffect(() => {
        setIsAuthenticated(false);
        if (account) {
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [account]);

    const handleAuthenticate = async () => {
        const authToast = toast.loading('Waiting for Web3 Signature...');
        try {
            const signatureData = await signAuthMessage(account);

            toast.loading('Verifying signature on backend...', { id: authToast });
            await axios.post(`${API_URL}/verify-wallet`, signatureData);

            toast.success('Zero-Knowledge Match Verified!', { id: authToast });
            setIsAuthenticated(true);
            fetchReports();
        } catch (error) {
            console.error('Auth error:', error);
            toast.error(error.response?.data?.error || 'Authentication Failed', { id: authToast });
        }
    };

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/cases`, {
                params: { investigator_address: account }
            });
            setReports(response.data || []);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('Failed to load category statistics. Ask Admin to assign you a clearance.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestAccess = async (caseId) => {
        const reqToast = toast.loading('Submitting cryptographic access request to Admins...');
        try {
            await axios.post(`${API_URL}/request-access`, {
                case_id: caseId,
                investigator_address: account
            });
            toast.success('Access Request Submitted. Awaiting 2/3 Admin Approvals.', { id: reqToast });
            fetchReports(); // Refresh states
        } catch (error) {
            console.error(error);
            toast.error('Failed to request access.', { id: reqToast });
        }
    };

    const handleUnlockEvidence = async (caseId) => {
        const unlockToast = toast.loading('Contacting nodes... Verifying SSS Shares...');
        try {
            // 1. Fetch Approved Shares
            const response = await axios.get(`${API_URL}/shares`, {
                params: { case_id: caseId, investigator_address: account }
            });

            const { shares, metadata } = response.data;
            if (!shares || shares.length < 2) {
                return toast.error("Not enough Admin Approvals yet. Waiting for threshold (2/3).", { id: unlockToast });
            }

            toast.loading('Threshold Met! Reconstructing AES Key using Shamir Secret Sharing...', { id: unlockToast });

            // 2. Decrypt each share using Investigator's Private Key (Simulated envelope decryption)
            const decryptedSharesStr = shares.map(share => {
                // Extracts the payload inside ENC(RSA/ECC)[payload]_with_pubKey
                const match = share.match(/ENC\(RSA\/ECC\)\[(.*?)\]/);
                return match ? match[1] : share;
            });

            // 3. Reconstruct AES Key
            const hexKey = secrets.combine(decryptedSharesStr.slice(0, 2));
            const reassembledAesKey = secrets.hex2str(hexKey);

            toast.loading(`Success! AES Key Derived. Fetching IPFS Hash: ${metadata.ipfs_cid}...`, { id: unlockToast });

            // 4. Fetch the encrypted file from IPFS directly and run CryptoJS decrypt here
            const encryptedIPFSData = await axios.get(`https://gateway.pinata.cloud/ipfs/${metadata.ipfs_cid}`);

            // Decrypt the payload
            const decryptedFile = CryptoJS.AES.decrypt(encryptedIPFSData.data, reassembledAesKey).toString(CryptoJS.enc.Utf8);

            if (!decryptedFile) {
                throw new Error("Decryption failed. Incorrect AES verification.");
            }

            toast.success('Evidence fully decrypted securely in browser!', { id: unlockToast });

            // Securely display the decrypted data in a custom Modal to completely bypass popup blockers
            setDecryptedData(decryptedFile);

        } catch (error) {
            console.error('Unlock error:', error);
            toast.error(error.response?.data?.error || 'Decryption failed.', { id: unlockToast });
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (!account) {
        return (
            <div className="dashboard-container">
                <div className="empty-state">
                    <h3>Wallet Verification Required</h3>
                    <p>Connect your wallet to securely view intelligence assigned to you.</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="dashboard-container">
                <div className="empty-state">
                    <ShieldAlert size={48} color="#ffab00" style={{ marginBottom: '1rem' }} />
                    <h3>Cryptographic Challenge</h3>
                    <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
                        To ensure you hold the private key for this address, please sign a secure mathematical challenge via MetaMask.
                    </p>
                    <button className="submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={handleAuthenticate}>
                        <Lock size={18} /> Sign & Authenticate
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Investigator Panel</h1>
                    <p className="dashboard-subtitle">Monitoring leaks isolated to your assigned sector only.</p>
                </div>
            </div>

            <div className="reports-grid">
                {isLoading ? (
                    <div className="empty-state">
                        <div className="loader" style={{ margin: '0 auto', marginBottom: '1rem' }}></div>
                        Fetching isolated sector data...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">
                        <h3>No Cases Found</h3>
                        <p>No actionable intelligence reported matching your clearance.</p>
                    </div>
                ) : (
                    reports.map((report, idx) => (
                        <motion.div
                            key={report.case_id || idx}
                            className="report-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * idx }}
                        >
                            <div className="report-header">
                                <span className={`report-status ${report.request_status === 'approved' ? 'status-verified' : 'status-pending'}`}>
                                    Status: {report.request_status === 'none' ? 'Locked' : report.request_status.toUpperCase()}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Case ID: #{String(report.case_id || idx + 1).padEnd(8, '0').substring(0, 8)}
                                </span>
                            </div>

                            <div className="report-body">
                                <h3 className="report-title">{report.title}</h3>

                                <div className="report-meta">
                                    <div className="meta-item">
                                        <Clock size={16} className="meta-icon" />
                                        <span>{formatDate(report.created_at)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <Lock size={16} className="meta-icon" />
                                        <span>Content: Blinded (AES-256)</span>
                                    </div>
                                    <div className="meta-item" style={{ marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                        " {report.description.substring(0, 100)}... "
                                    </div>
                                </div>
                            </div>

                            <div className="report-footer">
                                {report.request_status === 'none' ? (
                                    <button
                                        className="view-btn"
                                        style={{ color: '#ffab00' }}
                                        onClick={() => handleRequestAccess(report.case_id)}
                                    >
                                        <Zap size={14} /> Request Access from Admins
                                    </button>
                                ) : report.request_status === 'pending' ? (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                        <Clock size={14} style={{ marginRight: '6px' }} /> Awaiting Quorum (2/3 Admins)
                                    </span>
                                ) : report.request_status === 'approved' ? (
                                    <button
                                        className="view-btn"
                                        style={{ color: 'var(--success)', border: '1px solid var(--success)', padding: '0.5rem 1rem', borderRadius: '8px' }}
                                        onClick={() => handleUnlockEvidence(report.case_id)}
                                    >
                                        <Unlock size={14} /> Decrypt Evidence Locally
                                    </button>
                                ) : null}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Secure In-App Decryption Modal (Bypasses Popup Blockers) */}
            {decryptedData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(5, 5, 5, 0.95)', zIndex: 1000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>Decrypted Evidence (AES-Restored)</h2>
                        <button
                            onClick={() => setDecryptedData(null)}
                            style={{ background: 'transparent', border: 'none', color: '#ff3366', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            ✕ Close
                        </button>
                    </div>
                    <div style={{
                        width: '100%', maxWidth: '900px', height: '70vh',
                        backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden',
                        boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)'
                    }}>
                        <iframe
                            src={decryptedData}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            title="Decrypted Evidence"
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestigatorDashboard;
