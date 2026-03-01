import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, Clock, Shield, Lock, Activity } from 'lucide-react';
import CryptoJS from 'crypto-js';
import toast from 'react-hot-toast';
import './CaseModal.css';

const CaseModal = ({ isOpen, onClose, caseData, account, role, aesKey }) => {
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'timeline'
    const [timeline, setTimeline] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [newUpdate, setNewUpdate] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    const messagesEndRef = useRef(null);
    const API_URL = 'http://localhost:5000/api/communication';

    useEffect(() => {
        if (isOpen && caseData) {
            fetchData();
            const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
            setIsPolling(true);
            return () => {
                clearInterval(interval);
                setIsPolling(false);
            };
        }
    }, [isOpen, caseData]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchData = async () => {
        try {
            const [timeRes, chatRes] = await Promise.all([
                axios.get(`${API_URL}/timeline/${caseData.case_id || caseData.id}`),
                axios.get(`${API_URL}/chat/${caseData.case_id || caseData.id}`)
            ]);

            setTimeline(timeRes.data || []);

            // Decrypt chat messages if AES key is available
            const decryptedMessages = (chatRes.data || []).map(msg => {
                try {
                    // Try to decrypt only if an AES key is provided AND it's a valid AES encrypted string
                    if (aesKey && msg.encrypted_message) {
                        const bytes = CryptoJS.AES.decrypt(msg.encrypted_message, aesKey);
                        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                        return { ...msg, text: decryptedText || "⚠️ Decryption Failed" };
                    }
                    return { ...msg, text: "🔒 Encrypted Message (Key Required)" };
                } catch (e) {
                    return { ...msg, text: "🔒 Encrypted Message (Key Required)" };
                }
            });
            setMessages(decryptedMessages);
        } catch (error) {
            console.error('Failed to fetch modal data', error);
        }
    };

    const handleSendUpdate = async (e) => {
        e.preventDefault();
        if (!newUpdate.trim()) return;

        try {
            await axios.post(`${API_URL}/timeline`, {
                case_id: caseData.case_id || caseData.id,
                update_text: newUpdate,
                updated_by_wallet: account
            });
            setNewUpdate('');
            fetchData();
            toast.success('Timeline updated securely');
        } catch (error) {
            toast.error('Failed to update timeline');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!aesKey) {
            toast.error('You must decrypt the evidence first to establish a secure chat connection.');
            return;
        }

        try {
            // End-to-End Encrypt the chat message using the Case's specific AES Key
            const encryptedText = CryptoJS.AES.encrypt(newMessage, aesKey).toString();

            await axios.post(`${API_URL}/chat`, {
                case_id: caseData.case_id || caseData.id,
                encrypted_message: encryptedText,
                sender_wallet: account,
                sender_role: role // 'whistleblower' or 'investigator'
            });

            setNewMessage('');
            fetchData();
        } catch (error) {
            toast.error('Failed to send secure message');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}><X size={24} /></button>

                <div className="modal-header">
                    <h2>Case Details: #{String(caseData.case_id || caseData.id).substring(0, 8)}...</h2>
                    <p className="modal-subtitle">E2E Encrypted Communication Channel</p>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        <Lock size={16} /> Anonymous Chat
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                        onClick={() => setActiveTab('timeline')}
                    >
                        <Activity size={16} /> Investigation Timeline
                    </button>
                </div>

                <div className="modal-body">
                    {/* --- CHAT TAB --- */}
                    {activeTab === 'chat' && (
                        <div className="chat-container">
                            {!aesKey && (
                                <div className="encryption-warning">
                                    <Shield size={24} />
                                    <p>Chat is End-to-End Encrypted. <br />Investigators must Decrypt the Evidence first to acquire the P2P key. Whistleblowers have mathematical access by default.</p>
                                </div>
                            )}

                            <div className="chat-messages">
                                {messages.length === 0 ? (
                                    <div className="empty-chat">No messages in this channel yet.</div>
                                ) : (
                                    messages.map(msg => {
                                        const isMine = msg.sender_wallet.toLowerCase() === account.toLowerCase();
                                        return (
                                            <div key={msg.id} className={`chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                                                <div className="chat-role">
                                                    {msg.sender_role.toUpperCase()}
                                                </div>
                                                <div className="chat-bubble">
                                                    {msg.text}
                                                </div>
                                                <div className="chat-time">
                                                    {new Date(msg.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder={aesKey ? "Type an encrypted message..." : "Waiting for Decryption Key..."}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={!aesKey}
                                />
                                <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() || !aesKey}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* --- TIMELINE TAB --- */}
                    {activeTab === 'timeline' && (
                        <div className="timeline-container">
                            <div className="timeline-list">
                                {timeline.length === 0 ? (
                                    <div className="empty-chat">No updates posted yet.</div>
                                ) : (
                                    timeline.map(item => (
                                        <div key={item.id} className="timeline-item">
                                            <div className="timeline-point"></div>
                                            <div className="timeline-content">
                                                <span className="timeline-time"><Clock size={12} /> {new Date(item.created_at).toLocaleString()}</span>
                                                <p className="timeline-text">{item.update_text}</p>
                                                <span className="timeline-wallet">By: {item.updated_by_wallet.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {role === 'investigator' && (
                                <form className="timeline-input-area" onSubmit={handleSendUpdate}>
                                    <textarea
                                        className="timeline-input"
                                        placeholder="Add an official investigation update..."
                                        value={newUpdate}
                                        onChange={(e) => setNewUpdate(e.target.value)}
                                    ></textarea>
                                    <button type="submit" className="timeline-add-btn" disabled={!newUpdate.trim()}>
                                        Post Update
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaseModal;
