import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, Clock, FileKey, ExternalLink, Activity, CheckCircle, Circle, AlertCircle, MessageSquare, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import CaseModal from '../components/CaseModal';
import './Dashboard.css';

const Dashboard = ({ account }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCaseModal, setActiveCaseModal] = useState(null);

    useEffect(() => {
        if (account) {
            fetchMyReports();
        } else {
            setIsLoading(false);
        }
    }, [account]);

    const fetchMyReports = async () => {
        setIsLoading(true);
        try {
            // Using /api/case because whistleblower routes are mounted there too
            const response = await axios.get(`http://localhost:5000/api/case/cases/${account}`);
            setReports(response.data);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('Failed to load your encrypted submissions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTriggerReveal = async (caseId) => {
        const loadingToast = toast.loading('Releasing evidence to network...');
        try {
            await axios.post('http://localhost:5000/api/case/trigger-reveal', {
                case_id: caseId,
                anon_id: account
            });
            toast.success('Evidence successfully revealed!', { id: loadingToast });
            fetchMyReports(); // Refresh the visible status
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to trigger reveal', { id: loadingToast });
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const truncateHash = (hash) => {
        if (!hash) return '';
        return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
    };

    const getTimelineStages = (status) => {
        const stages = [
            { id: 'submitted', label: 'Submitted securely', completed: false, active: false },
            { id: 'assigned', label: 'Under Review / Assigned', completed: false, active: false },
            { id: 'investigating', label: 'Investigation active', completed: false, active: false },
            { id: 'resolved', label: 'Resolution reached', completed: false, active: false }
        ];

        let currentIndex = 0;
        if (status === 'submitted') currentIndex = 0;
        else if (status === 'assigned' || status === 'waiting_for_authority_approval') currentIndex = 1;
        else if (status === 'investigating') currentIndex = 2;
        else if (status === 'resolved') currentIndex = 3;
        else currentIndex = 0; // Default fallback

        return stages.map((stage, idx) => ({
            ...stage,
            completed: idx < currentIndex,
            active: idx === currentIndex
        }));
    };

    if (!account) {
        return (
            <div className="dashboard-container">
                <div className="empty-state">
                    <AlertCircle size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h3>Wallet Verification Required</h3>
                    <p>Connect your wallet to securely view your anonymous submission timeline.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">My Encrypted Submissions</h1>
                    <p className="dashboard-subtitle">Track the end-to-end lifecycle of your anonymous evidence.</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h3 className="stat-title">My Total Submissions</h3>
                    <p className="stat-value">{reports.length}</p>
                </motion.div>
                <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3 className="stat-title">Network Anonymity</h3>
                    <p className="stat-value" style={{ color: 'var(--success)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={24} /> 100% Protected
                    </p>
                </motion.div>
            </div>

            {isLoading ? (
                <div className="empty-state">
                    <div className="loader" style={{ margin: '0 auto', marginBottom: '1rem' }}></div>
                    Decrypting context from blockchain...
                </div>
            ) : reports.length === 0 ? (
                <div className="empty-state">
                    <h3>No Evidence Found</h3>
                    <p>You haven't submitted any anonymous reports yet.</p>
                </div>
            ) : (
                <div className="submissions-list">
                    {reports.map((report, idx) => (
                        <motion.div
                            key={report.case_id || idx}
                            className="timeline-card"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * idx }}
                        >
                            <div className="timeline-card-header">
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{report.title || 'Encrypted Evidence Submission'}</h3>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', gap: '1rem' }}>
                                        <span><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />{formatDate(report.created_at)}</span>
                                        <span><FileKey size={12} style={{ display: 'inline', marginRight: '4px' }} />{truncateHash(report.file_hash)}</span>
                                        <span style={{ color: report.reveal_status === 'revealed' ? 'var(--success)' : '#00f0ff' }}>
                                            <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {report.reveal_mode === 'trigger' ? 'Manual Trigger' : report.reveal_mode === 'time_based' ? 'Timed Reveal' : 'Immediate Reveal'} ({report.reveal_status})
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <span className={`report-status status-pending`}>
                                        ID: #{String(report.case_id).substring(0, 8)}
                                    </span>
                                    <button
                                        className="view-btn"
                                        style={{ backgroundColor: 'rgba(0, 240, 255, 0.1)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                                        onClick={() => setActiveCaseModal(report)}
                                    >
                                        <MessageSquare size={14} /> Open Timeline & Chat
                                    </button>

                                    {report.reveal_mode === 'trigger' && report.reveal_status !== 'revealed' && (
                                        <button
                                            className="view-btn"
                                            style={{ backgroundColor: 'rgba(255, 50, 100, 0.1)', color: '#ff3264', border: '1px solid #ff3264', padding: '0.4rem 0.8rem', borderRadius: '6px', marginTop: '4px' }}
                                            onClick={() => handleTriggerReveal(report.case_id)}
                                        >
                                            <Eye size={14} /> Pull Trigger to Reveal
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="timeline-visualization">
                                {getTimelineStages(report.status).map((stage, sIdx) => (
                                    <div key={sIdx} className={`timeline-step ${stage.completed ? 'completed' : ''} ${stage.active ? 'active' : ''}`}>
                                        <div className="timeline-icon">
                                            {stage.completed ? <CheckCircle size={20} color="var(--success)" /> :
                                                stage.active ? <Activity size={20} color="var(--primary)" /> :
                                                    <Circle size={20} color="rgba(255,255,255,0.2)" />}
                                        </div>
                                        <div className="timeline-content">
                                            <p>{stage.label}</p>
                                        </div>
                                        {sIdx < 3 && <div className="timeline-connector"></div>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            <CaseModal
                isOpen={!!activeCaseModal}
                onClose={() => setActiveCaseModal(null)}
                caseData={activeCaseModal}
                account={account}
                role="whistleblower"
                aesKey={activeCaseModal ? localStorage.getItem(`case_key_${activeCaseModal.case_id}`) : null}
            />
        </div>
    );
};

export default Dashboard;
