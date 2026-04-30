import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Loader2, User, Phone, Mail, MapPin, Briefcase, IndianRupee, MessageSquare, Tag } from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

function Detail({ icon, label, value, highlight }) {
    return (
        <div className="detail-row">
            <div className="detail-label">
                <span style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', color:'var(--primary)' }}>
                    {icon} {label}
                </span>
            </div>
            <div className={`detail-value${highlight ? ' highlight-val' : ''}`}>
                {value || '—'}
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
                        {/* Detail rows */}
                        <Detail icon={<User size={15} />} label="Full Name" value={lead.name} />
                        <Detail icon={<Phone size={15} />} label="Phone" value={lead.phone} />
                        <Detail icon={<Mail size={15} />} label="Email" value={lead.email} />
                        <Detail icon={<MapPin size={15} />} label="City" value={lead.city} />
                        <Detail icon={<Briefcase size={15} />} label="Requirement" value={lead.requirementType} />
                        <Detail icon={<IndianRupee size={15} />} label="Budget" value={`₹${lead.budget.toLocaleString('en-IN')}`} />

                        {lead.message && (
                            <Detail icon={<MessageSquare size={15} />} label="Message" value={lead.message} />
                        )}

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
