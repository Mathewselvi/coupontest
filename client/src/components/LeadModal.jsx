import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Loader2, User, Phone, Mail, MapPin, Briefcase, IndianRupee, MessageSquare, Tag } from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

function Detail({ icon, label, value, highlight }) {
    return (
        <div className="premium-detail-item">
            <div className="premium-detail-icon">
                {icon}
            </div>
            <div className="premium-detail-content">
                <span className="premium-detail-label">{label}</span>
                <span className={`premium-detail-value ${highlight ? 'highlight-val' : ''}`}>
                    {value || '—'}
                </span>
            </div>
        </div>
    );
}

export default function LeadModal({ leadId, onClose }) {
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/lead/${leadId}`, { headers: authHeaders() })
            .then(r => setLead(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));

        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [leadId, onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Lead Details</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                        <Loader2 size={32} className="spinner" color="var(--primary)" />
                    </div>
                ) : lead ? (
                    <div>
                    <div className="premium-details-grid">
                        <div className="premium-details-section">
                            <Detail icon={<User size={18} />} label="Full Name" value={lead.name} />
                            <Detail icon={<Phone size={18} />} label="Phone Number" value={lead.phone} />
                            <Detail icon={<Mail size={18} />} label="Email Address" value={lead.email} />
                        </div>
                        
                        <div className="premium-details-section">
                            <Detail icon={<MapPin size={18} />} label="Location" value={lead.city} />
                            <Detail icon={<Briefcase size={18} />} label="Service Requirement" value={lead.requirementType} />
                            <Detail icon={<IndianRupee size={18} />} label="Estimated Budget" value={`₹${lead.budget.toLocaleString('en-IN')}`} />
                        </div>

                        {lead.message && (
                            <div className="premium-details-section wide">
                                <Detail icon={<MessageSquare size={18} />} label="Additional Message" value={lead.message} />
                            </div>
                        )}
                    </div>

                        {/* Pricing Summary */}
                        <div style={{
                            marginTop: '1.25rem',
                            background: 'var(--bg)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.88rem', color:'var(--text-secondary)' }}>
                                <span>Subtotal</span>
                                <span>₹{lead.budget.toLocaleString('en-IN')}</span>
                            </div>
                            {lead.discountAmount > 0 && (
                                <>
                                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.88rem' }}>
                                        <span style={{ display:'flex', alignItems:'center', gap:'4px', color:'var(--text-secondary)' }}>
                                            <Tag size={13} /> {lead.couponApplied?.code}
                                        </span>
                                        <span style={{ color:'var(--accent-green)', fontWeight:600 }}>− ₹{lead.discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--text-muted)' }}>
                                        <span>You saved</span>
                                        <span style={{ color:'var(--accent-green)' }}>₹{lead.discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                </>
                            )}
                            <div style={{
                                display:'flex', justifyContent:'space-between',
                                fontSize:'1rem', fontWeight:700, color:'var(--text-primary)',
                                borderTop:'1px solid var(--border)', paddingTop:'0.5rem', marginTop:'0.25rem'
                            }}>
                                <span>Final Price</span>
                                <span style={{ color:'var(--primary)' }}>₹{lead.finalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div style={{ marginTop:'0.75rem', textAlign:'right', fontSize:'0.75rem', color:'var(--text-muted)' }}>
                            Submitted: {new Date(lead.createdAt).toLocaleString('en-IN')}
                        </div>
                    </div>
                ) : (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Lead not found.</p>
                )}
            </div>
        </div>
    );
}
