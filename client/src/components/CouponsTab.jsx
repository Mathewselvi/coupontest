import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Tag, Clock, RefreshCw, TriangleAlert } from 'lucide-react';
import CouponModal from './CouponModal';
import { useToast } from '../context/ToastContext';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

function StatusBadge({ coupon }) {
    const expired = new Date() > new Date(coupon.expiryDate);
    const exhausted = coupon.currentUses >= coupon.maxUses;
    if (!coupon.isActive) return <span className="cpn-badge cpn-inactive">Inactive</span>;
    if (expired) return <span className="cpn-badge cpn-expired">Expired</span>;
    if (exhausted) return <span className="cpn-badge cpn-exhausted">Exhausted</span>;
    return <span className="cpn-badge cpn-active">Active</span>;
}

function DeleteConfirmModal({ coupon, onConfirm, onCancel, loading }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onCancel();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="del-confirm-box" onClick={e => e.stopPropagation()}>
                <div className="del-confirm-icon">
                    <TriangleAlert size={22} />
                </div>
                <h3 className="del-confirm-title">Delete Coupon</h3>
                <p className="del-confirm-msg">
                    You're about to permanently delete the coupon <strong>{coupon.code}</strong>.
                    This action cannot be undone.
                </p>
                <div className="del-confirm-actions">
                    <button className="del-btn-cancel" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button className="del-btn-confirm" onClick={onConfirm} disabled={loading}>
                        {loading ? <Loader2 size={14} className="spinner" /> : <Trash2 size={14} />}
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function UsageBar({ current, max }) {
    const pct = Math.min((current / max) * 100, 100);
    const color = pct >= 90 ? '#dc2626' : pct >= 60 ? '#f59e0b' : '#10b981';
    return (
        <div className="usage-wrap">
            <span className="usage-text" style={{ color: pct >= 90 ? '#dc2626' : 'inherit' }}>
                {current} / {max}
            </span>
            <div className="usage-track">
                <div className="usage-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

function CouponCard({ coupon, onEdit, onDelete, deleting }) {
    const expired = new Date() > new Date(coupon.expiryDate);
    const exhausted = coupon.currentUses >= coupon.maxUses;
    const inactive = !coupon.isActive || expired || exhausted;
    const isPercentage = coupon.discountType === 'percentage';

    const borderColor = inactive ? '#d1d5db'
        : expired ? '#fca5a5'
        : '#a5b4fc';

    return (
        <div className={`cpn-card ${inactive ? 'cpn-card-dim' : ''}`}>

            <div className="cpn-card-body">
                <div className="cpn-card-header">
                    <div style={{ flex: 1 }}>
                        <div className="cpn-card-code">{coupon.code}</div>
                        <div className="cpn-card-sub">
                            {isPercentage ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} flat`}
                            {coupon.minOrderValue > 0 && ` · min ₹${coupon.minOrderValue.toLocaleString('en-IN')}`}
                        </div>
                    </div>
                    <StatusBadge coupon={coupon} />
                </div>

                <div className="cpn-meta-grid">
                    <div className="cpn-meta-item">
                        <Clock size={12} />
                        <span>{new Date(coupon.expiryDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="cpn-meta-item">
                        <Tag size={12} />
                        <span>{coupon.applicableTo.join(', ')}</span>
                    </div>
                </div>

                <UsageBar current={coupon.currentUses} max={coupon.maxUses} />

                <div className="cpn-card-actions">
                    <button className="cpn-btn cpn-btn-edit" onClick={() => onEdit(coupon)}>
                        <Pencil size={13} /> Edit
                    </button>
                    <button
                        className="cpn-btn cpn-btn-del"
                        onClick={() => onDelete(coupon)}
                        disabled={deleting === coupon._id}
                    >
                        {deleting === coupon._id
                            ? <Loader2 size={13} className="spinner" />
                            : <><Trash2 size={13} /> Delete</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CouponsTab({ onUnauthorized }) {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const showToast = useToast();

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/coupon', { headers: authHeaders() });
            setCoupons(res.data);
        } catch (err) {
            if (err.response?.status === 401) { onUnauthorized?.(); return; }
            setError('Failed to load coupons.');
        } finally {
            setLoading(false);
        }
    }, [onUnauthorized]);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/coupon/${confirmDelete._id}`, { headers: authHeaders() });
            showToast(`Coupon ${confirmDelete.code} deleted`);
            setConfirmDelete(null);
            fetchCoupons();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete coupon', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const active = coupons.filter(c => c.isActive && new Date() <= new Date(c.expiryDate) && c.currentUses < c.maxUses);
    const inactive = coupons.filter(c => !c.isActive || new Date() > new Date(c.expiryDate) || c.currentUses >= c.maxUses);

    return (
        <div>
            {/* Header */}
            <div className="cpn-header">
                <div>
                    <h2 className="cpn-title">Coupon Management</h2>
                    <p className="cpn-subtitle">
                        <span className="cpn-count cpn-count-active">{active.length} active</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>·</span>
                        <span className="cpn-count cpn-count-total">{coupons.length} total</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="cpn-btn-refresh" onClick={fetchCoupons} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                    <button className="cpn-btn-add" onClick={() => setModal('create')}>
                        <Plus size={16} /> Add Coupon
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="cpn-loading">
                    <Loader2 size={32} className="spinner" color="var(--primary)" />
                    <span>Loading coupons…</span>
                </div>
            ) : error ? (
                <div className="message error" style={{ padding: '1.25rem' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            ) : coupons.length === 0 ? (
                <div className="cpn-empty">
                    <div className="cpn-empty-icon"><Tag size={32} /></div>
                    <p>No coupons yet.</p>
                    <button className="cpn-btn-add" onClick={() => setModal('create')}>
                        <Plus size={15} /> Create your first coupon
                    </button>
                </div>
            ) : (
                <>
                    {active.length > 0 && (
                        <>
                            <div className="cpn-section-label">🟢 Active</div>
                            <div className="cpn-grid">
                                {active.map(c => (
                                    <CouponCard
                                        key={c._id}
                                        coupon={c}
                                        onEdit={setModal}
                                        onDelete={setConfirmDelete}
                                        deleting={deleting ? confirmDelete?._id : null}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                    {inactive.length > 0 && (
                        <>
                            <div className="cpn-section-label" style={{ marginTop: '1.5rem' }}>⚪ Inactive / Expired</div>
                            <div className="cpn-grid">
                                {inactive.map(c => (
                                    <CouponCard
                                        key={c._id}
                                        coupon={c}
                                        onEdit={setModal}
                                        onDelete={setConfirmDelete}
                                        deleting={deleting ? confirmDelete?._id : null}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {modal && (
                <CouponModal
                    coupon={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); fetchCoupons(); }}
                />
            )}

            {confirmDelete && (
                <DeleteConfirmModal
                    coupon={confirmDelete}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDelete(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
}
