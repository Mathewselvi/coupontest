import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const REQ_TYPES = ['Service', 'Product', 'Consultation'];

const empty = {
    code: '', discountType: 'percentage', discountValue: '', minOrderValue: 0,
    applicableTo: ['All'], maxUses: 100, expiryDate: '', isFirstTimeOnly: false, isActive: true
};

export default function CouponModal({ coupon, onClose, onSaved }) {
    const [form, setForm] = useState(empty);
    const [saving, setSaving] = useState(false);
    const showToast = useToast();
    const isEdit = !!coupon;

    useEffect(() => {
        if (coupon) {
            setForm({
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderValue: coupon.minOrderValue,
                applicableTo: coupon.applicableTo,
                maxUses: coupon.maxUses,
                expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : '',
                isFirstTimeOnly: coupon.isFirstTimeOnly,
                isActive: coupon.isActive
            });
        }
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [coupon, onClose]);

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const toggleApplicable = (type) => {
        if (type === 'All') { set('applicableTo', ['All']); return; }
        setForm(prev => {
            const without = prev.applicableTo.filter(t => t !== 'All' && t !== type);
            const adding = !prev.applicableTo.includes(type);
            const next = adding ? [...without, type] : without;
            return { ...prev, applicableTo: next.length ? next : ['All'] };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = { ...form, discountValue: Number(form.discountValue), minOrderValue: Number(form.minOrderValue), maxUses: Number(form.maxUses) };
        try {
            if (isEdit) {
                const { code, ...updatePayload } = payload;
                await axios.put(`/api/coupon/${coupon._id}`, updatePayload, { headers: authHeaders() });
                showToast('Coupon updated successfully');
            } else {
                await axios.post('/api/coupon', payload, { headers: authHeaders() });
                showToast('Coupon created successfully');
            }
            onSaved();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to save coupon', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{isEdit ? 'Edit Coupon' : 'Add New Coupon'}</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Row 1 */}
                    <div className="cm-row">
                        <div className="form-group">
                            <label className="form-label">Coupon Code *</label>
                            <input className="form-input" value={form.code}
                                onChange={e => set('code', e.target.value.toUpperCase())}
                                required disabled={isEdit} placeholder="e.g. SAVE10"
                                style={isEdit ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Discount Type *</label>
                            <select className="form-select" value={form.discountType}
                                onChange={e => set('discountType', e.target.value)}>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat (₹)</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="cm-row">
                        <div className="form-group">
                            <label className="form-label">
                                Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                            </label>
                            <input type="number" className="form-input" value={form.discountValue}
                                min="0" onChange={e => set('discountValue', e.target.value)}
                                required placeholder="e.g. 10" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Min Order Value (₹)</label>
                            <input type="number" className="form-input" value={form.minOrderValue}
                                min="0" onChange={e => set('minOrderValue', e.target.value)} placeholder="0" />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="cm-row">
                        <div className="form-group">
                            <label className="form-label">Max Uses</label>
                            <input type="number" className="form-input" value={form.maxUses}
                                min="1" onChange={e => set('maxUses', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Expiry Date *</label>
                            <input type="date" className="form-input" value={form.expiryDate}
                                onChange={e => set('expiryDate', e.target.value)} required />
                        </div>
                    </div>

                    {/* Applicable To */}
                    <div className="form-group">
                        <label className="form-label">Applicable To</label>
                        <div className="cm-check-group">
                            {['All', ...REQ_TYPES].map(t => (
                                <label key={t} className="cm-check-label">
                                    <input
                                        type="checkbox"
                                        className="cm-checkbox"
                                        checked={form.applicableTo.includes(t)}
                                        onChange={() => toggleApplicable(t)}
                                    />
                                    <span>{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Toggles row */}
                    <div className="cm-toggle-row">
                        <label className="cm-check-label">
                            <input type="checkbox" className="cm-checkbox"
                                checked={form.isFirstTimeOnly}
                                onChange={e => set('isFirstTimeOnly', e.target.checked)} />
                            <span>First-time users only</span>
                        </label>
                        <label className="cm-check-label">
                            <input type="checkbox" className="cm-checkbox"
                                checked={form.isActive}
                                onChange={e => set('isActive', e.target.checked)} />
                            <span>Active</span>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="cm-footer">
                        <button type="button" className="cm-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="cm-btn-save" disabled={saving}>
                            {saving
                                ? <><Loader2 size={15} className="spinner" /> Saving…</>
                                : (isEdit ? 'Save Changes' : 'Create Coupon')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
