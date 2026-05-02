import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Loader2, Plus, Pencil, Trash2, AlertCircle, Tag, Clock, RefreshCw, TriangleAlert, Upload, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
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
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef(null);
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

    const exportCoupons = () => {
        if (coupons.length === 0) { showToast('No coupons to export', 'error'); return; }
        const now = new Date();
        const rows = coupons.map((c, i) => {
            const expired = now > new Date(c.expiryDate);
            const exhausted = c.currentUses >= c.maxUses;
            const status = !c.isActive ? 'Inactive' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Active';
            return {
                '#': i + 1,
                'Code': c.code,
                'Discount Type': c.discountType,
                'Discount Value': c.discountValue,
                'Min Order (INR)': c.minOrderValue,
                'Applicable To': c.applicableTo.join(', '),
                'Max Uses': c.maxUses,
                'Current Uses': c.currentUses,
                'Used %': Math.round((c.currentUses / c.maxUses) * 100),
                'Expiry Date': new Date(c.expiryDate),
                'First Time Only': c.isFirstTimeOnly ? 'Yes' : 'No',
                'Active': c.isActive ? 'Yes' : 'No',
                'Status': status,
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 4 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
            { wch: 10 }, { wch: 13 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 12 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Coupons');
        XLSX.writeFile(wb, `coupons_${new Date().toISOString().slice(0, 10)}.xlsx`);
        showToast(`Exported ${rows.length} coupon${rows.length !== 1 ? 's' : ''}`);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        try {
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { cellDates: true });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

            if (rows.length === 0) {
                showToast('No data found in the file', 'error');
                return;
            }

            const parseBool = (val) => {
                if (typeof val === 'boolean') return val;
                if (typeof val === 'number') return val !== 0;
                const s = String(val).toLowerCase().trim();
                return s === 'true' || s === '1' || s === 'yes';
            };

            const toNum = (val, def) => {
                if (val === '' || val === null || val === undefined) return def;
                const n = Number(val);
                return isNaN(n) ? def : n;
            };

            const parseDate = (val) => {
                if (!val && val !== 0) return undefined;
                if (val instanceof Date) return isNaN(val) ? undefined : val.toISOString();
                const s = String(val).trim();
                if (!s) return undefined;
                let d = new Date(s);
                if (!isNaN(d)) return d.toISOString();
                const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (m) {
                    d = new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
                    if (!isNaN(d)) return d.toISOString();
                }
                return s;
            };

            const coupons = rows
                .map(r => ({
                    code: String(r['Code'] || r['code'] || '').toUpperCase().trim(),
                    discountType: String(r['Discount Type'] || r['discountType'] || 'flat').toLowerCase().trim(),
                    discountValue: toNum(r['Discount Value'] ?? r['discountValue'], 0),
                    minOrderValue: toNum(r['Min Order'] ?? r['Min Order (INR)'] ?? r['minOrderValue'], 0),
                    applicableTo: String(r['Applicable To'] || r['applicableTo'] || 'All')
                        .split(',').map(s => s.trim()).filter(Boolean),
                    maxUses: toNum(r['Max Uses'] ?? r['maxUses'], 100),
                    expiryDate: parseDate(r['Expiry Date'] ?? r['expiryDate']),
                    isFirstTimeOnly: parseBool(r['First Time Only'] ?? r['isFirstTimeOnly'] ?? false),
                    isActive: (r['Active'] === '' || r['Active'] === undefined)
                        ? true
                        : parseBool(r['Active']),
                }))
                .filter(c => c.code);

            if (coupons.length === 0) {
                showToast('No valid rows found. Check the Code column.', 'error');
                return;
            }

            const res = await axios.post('/api/coupon/bulk-import', { coupons }, { headers: authHeaders() });
            const { imported, skipped, errors } = res.data;
            const parts = [`Imported ${imported} coupon${imported !== 1 ? 's' : ''}`];
            if (skipped > 0) parts.push(`${skipped} skipped (duplicates)`);
            if (errors.length > 0) parts.push(`${errors.length} failed validation`);
            showToast(parts.join(', '), errors.length > 0 ? 'error' : 'success');
            if (errors.length > 0) console.warn('Coupon import errors:', errors);
            fetchCoupons();
        } catch (err) {
            showToast(err.response?.data?.error || 'Import failed', 'error');
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

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
            <div className="cpn-header">
                <div>
                    <h2 className="cpn-title">Coupon Management</h2>
                    <p className="cpn-subtitle">
                        <span className="cpn-count cpn-count-active">{active.length} active</span>
                        <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>·</span>
                        <span className="cpn-count cpn-count-total">{coupons.length} total</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="cpn-btn-refresh" onClick={fetchCoupons} title="Refresh">
                        <RefreshCw size={15} />
                    </button>
                    <button className="cpn-btn-import" onClick={exportCoupons} title="Export all coupons to Excel">
                        <FileDown size={15} /> Export
                    </button>
                    <label className="cpn-btn-import" title="Import coupons from Excel">
                        {importing ? <Loader2 size={15} className="spinner" /> : <Upload size={15} />}
                        {importing ? 'Importing…' : 'Import'}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                    </label>
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
