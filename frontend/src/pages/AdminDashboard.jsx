import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, CheckCircle, ShieldAlert, AlertCircle, Clock, Link as LinkIcon, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { signAuthMessage } from '../utils/auth';
import './AdminDashboard.css';

const AdminDashboard = ({ account }) => {
    const [stats, setStats] = useState({ totalCases: 0, revealedCases: 0 });
    const [cases, setCases] = useState([]);
    const [investigators, setInvestigators] = useState([]);
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const API_URL = 'http://localhost:5000/api/admin';

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

            toast.loading('Verifying Admin privileges on backend...', { id: authToast });
            await axios.post(`${API_URL}/verify-wallet`, signatureData);

            toast.success('Zero-Knowledge Match Verified. Terminal Unlocked.', { id: authToast });
            setIsAuthenticated(true);
            fetchData();
        } catch (error) {
            console.error('Auth error:', error);
            toast.error(error.response?.data?.error || 'Authentication Failed', { id: authToast });
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch sequentially to prevent Supabase free-tier rate limiting/Cloudflare HTML errors
            const statsRes = await axios.get(`${API_URL}/stats`);
            const casesRes = await axios.get(`${API_URL}/cases`);
            const invRes = await axios.get(`${API_URL}/investigators`);
            const reqRes = await axios.get(`${API_URL}/requests`);
            setStats({
                totalCases: statsRes.data.totalCases || 0,
                revealedCases: statsRes.data.revealedCases || 0
            });
            setCases(casesRes.data || []);
            setInvestigators(invRes.data || []);
            setRequests(reqRes.data || []);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            toast.error('Failed to load administrative data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveRequest = async (request) => {
        const toastId = toast.loading('Authenticating via Admin Private Key... Decrypting Share...');
        try {
            // Simulated: Admin securely decrypts their SSS Share locally and re-encrypts it using the Investigator's Public Key.
            const reEncryptedShare = `re-encrypted_share_for_${request.investigators.wallet_address}`;

            await axios.post(`${API_URL}/approve-request`, {
                request_id: request.id,
                case_id: request.case_id,
                admin_address: account, // identifying this admin
                encrypted_share_for_investigator: reEncryptedShare
            });

            toast.success('Share transferred reliably. 1 vote cast.', { id: toastId });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Approval failed.', { id: toastId });
            console.error(error);
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (!account) {
        return (
            <div className="admin-container">
                <div className="empty-state">
                    <ShieldAlert size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h3>Admin Authentication Required</h3>
                    <p>Connect your wallet to securely access the administrative terminal.</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="admin-container">
                <div className="empty-state">
                    <ShieldAlert size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h3>Cryptographic Authorization</h3>
                    <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)' }}>
                        Confirm your identity as an Administrator by signing a cryptographic payload. This proves ownership of the private key matching the public ledger.
                    </p>
                    <button className="submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={handleAuthenticate}>
                        <Lock size={18} /> Sign & Unlock Terminal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">System Administration</h1>
                    <p className="admin-subtitle">Oversight of network, cryptographic access controls, and category routing.</p>
                </div>
            </div>

            <div className="stats-grid">
                <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-icon-wrapper"><FileText size={24} /></div>
                    <div>
                        <h3 className="stat-title">Total Submissions</h3>
                        <p className="stat-value">{stats.totalCases}</p>
                    </div>
                </motion.div>

                <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="stat-icon-wrapper" style={{ color: '#ffab00' }}><AlertCircle size={24} /></div>
                    <div>
                        <h3 className="stat-title">Access Requests</h3>
                        <p className="stat-value">{requests.filter(r => r.status === 'pending').length}</p>
                    </div>
                </motion.div>

                <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="stat-icon-wrapper" style={{ color: 'var(--success)' }}><Users size={24} /></div>
                    <div>
                        <h3 className="stat-title">Total Investigators</h3>
                        <p className="stat-value">{investigators.length}</p>
                    </div>
                </motion.div>
            </div>

            <div className="dual-panel">
                <div className="panel-section">
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Active SSS Access Requests (Require 2/3)</h2>
                    {requests.length === 0 ? (
                        <div className="empty-state">
                            <p>No investigator access requests pending.</p>
                        </div>
                    ) : (
                        <div className="cases-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Case Title</th>
                                        <th>Investigator Info</th>
                                        <th>Approvals</th>
                                        <th>Key Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r, idx) => (
                                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * idx }}>
                                            <td>
                                                <strong>{r.cases?.title || 'Unknown'}</strong><br />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Case: {r.case_id.substring(0, 8)}...</span>
                                                {r.cases?.ipfs_cid && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '8px' }}>CID: {r.cases.ipfs_cid.substring(0, 6)}...</span>}
                                            </td>
                                            <td>
                                                <span style={{ color: 'var(--primary)' }}>{r.investigators?.name || r.investigators?.wallet_address.substring(0, 6) + '...'}</span><br />
                                                <span style={{ fontSize: '0.8rem', color: '#ffab00' }}>Loyalty Score: {r.investigators?.loyalty_score || 0}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {[1, 2, 3].map((num) => (
                                                        <div key={num} style={{
                                                            width: '12px', height: '12px', borderRadius: '50%',
                                                            background: num <= r.approvals_count ? 'var(--success)' : 'rgba(255,255,255,0.1)'
                                                        }}></div>
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.approvals_count}/3 Met</span>
                                            </td>
                                            <td>
                                                {r.status === 'approved' ? (
                                                    <span style={{ color: 'var(--success)' }}><CheckCircle size={16} style={{ verticalAlign: 'middle' }} /> Transferred</span>
                                                ) : (
                                                    <button onClick={() => handleApproveRequest(r)} className="approve-btn">
                                                        <Lock size={14} style={{ marginRight: '6px' }} /> Release Share
                                                    </button>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <h2 style={{ marginBottom: '1.5rem', marginTop: '2.5rem', fontSize: '1.5rem' }}>Global Evidence Ledger</h2>
            <div className="cases-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Case ID</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Evidence Routing (IPFS)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map((c, idx) => (
                            <motion.tr key={c.case_id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * idx }}>
                                <td style={{ fontWeight: 600 }}>#{String(c.case_id).substring(0, 8)}</td>
                                <td><span className="category-badge">{c.category || 'Uncategorized'}</span></td>
                                <td>
                                    <span className={`status-badge status-${c.status === 'resolved' ? 'success' : c.status === 'investigating' ? 'warning' : 'pending'}`}>
                                        {c.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                        <LinkIcon size={14} />
                                        {c.ipfs_cid ? c.ipfs_cid.substring(0, 10) + '... (Encrypted)' : 'Syncing...'}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
