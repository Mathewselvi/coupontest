import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, AlertCircle, Tag, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';

const API_BASE = '/api';

const BUDGET_OPTIONS = [
    { label: '₹500', value: 500 },
    { label: '₹1,000', value: 1000 },
    { label: '₹2,000', value: 2000 },
    { label: '₹5,000', value: 5000 },
    { label: '₹10,000', value: 10000 },
    { label: '₹25,000', value: 25000 },
    { label: '₹50,000', value: 50000 },
    { label: '₹1,00,000', value: 100000 },
];

export default function LeadForm() {
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', city: '',
        requirementType: '', budget: '', message: '', couponCode: ''
    });

    const [couponState, setCouponState] = useState({
        isValidating: false, isApplied: false,
        discountAmount: 0, finalPrice: 0, error: '', success: ''
    });

    const [submitState, setSubmitState] = useState({
        isSubmitting: false, isSuccess: false, error: ''
    });

    const [showOffers, setShowOffers] = useState(false);
    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(false);

    const canFetch = formData.email && formData.requirementType && formData.budget;

    useEffect(() => {
        setShowOffers(false);
        setOffers([]);
    }, [formData.email, formData.requirementType, formData.budget]);

    const fetchOffers = async () => {
        if (!canFetch) return;
        setOffersLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/coupon/available`, {
                params: {
                    email: formData.email,
                    requirementType: formData.requirementType,
                    budget: Number(formData.budget)
                }
            });
            setOffers(res.data);
        } catch {
            setOffers([]);
        } finally {
            setOffersLoading(false);
        }
    };

    const toggleOffers = () => {
        if (!showOffers) fetchOffers();
        setShowOffers(o => !o);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (['budget', 'requirementType', 'email'].includes(name) && couponState.isApplied) {
            setCouponState({
                isValidating: false, isApplied: false,
                discountAmount: 0, finalPrice: 0,
                error: 'Coupon removed — form details changed', success: ''
            });
        }
    };

    const doValidate = async (code) => {
        if (!code) {
            setCouponState(prev => ({ ...prev, error: 'Please enter a coupon code' }));
            return;
        }
        if (!formData.budget || !formData.requirementType || !formData.email) {
            setCouponState(prev => ({ ...prev, error: 'Please fill Email, Requirement Type, and Budget first' }));
            return;
        }
        setCouponState(prev => ({ ...prev, isValidating: true, error: '', success: '' }));
        try {
            const response = await axios.post(`${API_BASE}/coupon/validate`, {
                couponCode: code,
                budget: Number(formData.budget),
                requirementType: formData.requirementType,
                email: formData.email
            });
            setCouponState({
                isValidating: false, isApplied: true,
                discountAmount: response.data.discountAmount,
                finalPrice: response.data.finalPrice,
                error: '', success: 'Coupon applied!'
            });
        } catch (error) {
            setCouponState({
                isValidating: false, isApplied: false,
                discountAmount: 0, finalPrice: 0,
                error: error.response?.data?.error || 'Failed to validate coupon',
                success: ''
            });
        }
    };

    const validateCoupon = (e) => {
        e.preventDefault();
        doValidate(formData.couponCode);
    };

    const applyOffer = (code) => {
        setFormData(prev => ({ ...prev, couponCode: code }));
        setShowOffers(false);
        doValidate(code);
    };

    const removeCoupon = () => {
        setFormData(prev => ({ ...prev, couponCode: '' }));
        setCouponState({ isValidating: false, isApplied: false, discountAmount: 0, finalPrice: 0, error: '', success: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitState({ isSubmitting: true, isSuccess: false, error: '' });
        try {
            await axios.post(`${API_BASE}/lead/submit`, {
                ...formData,
                budget: Number(formData.budget)
            });
            setSubmitState({ isSubmitting: false, isSuccess: true, error: '' });
            setTimeout(() => {
                setFormData({ name: '', phone: '', email: '', city: '', requirementType: '', budget: '', message: '', couponCode: '' });
                setCouponState({ isValidating: false, isApplied: false, discountAmount: 0, finalPrice: 0, error: '', success: '' });
                setSubmitState({ isSubmitting: false, isSuccess: false, error: '' });
            }, 4000);
        } catch (error) {
            setSubmitState({
                isSubmitting: false, isSuccess: false,
                error: error.response?.data?.error || 'Failed to submit form'
            });
        }
    };

    if (submitState.isSuccess) {
        return (
            <div className="glass-panel lead-form-container" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                <CheckCircle size={48} color="var(--accent-green)" style={{ marginBottom: '1rem' }} strokeWidth={1.5} />
                <h2 className="form-title" style={{ marginBottom: '0.5rem' }}>You're all set!</h2>
                <p className="form-subtitle" style={{ marginBottom: 0 }}>
                    We've got your request and will be in touch shortly.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel lead-form-container">
            <h2 className="form-title">Get a quote</h2>
            <p className="form-subtitle">Fill in your details. Have a promo code? Apply it to see your savings.</p>

            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <input type="text" name="name" className="form-input" required
                            value={formData.name} onChange={handleInputChange} placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input type="tel" name="phone" className="form-input" required pattern="[0-9]{10}"
                            value={formData.phone} onChange={handleInputChange} placeholder="10-digit number" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input type="email" name="email" className="form-input" required
                            value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">City *</label>
                        <select name="city" className="form-select" required value={formData.city} onChange={handleInputChange}>
                            <option value="">Select City</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Chennai">Chennai</option>
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Pune">Pune</option>
                            <option value="Kolkata">Kolkata</option>
                            <option value="Ahmedabad">Ahmedabad</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Requirement Type *</label>
                        <select name="requirementType" className="form-select" required value={formData.requirementType} onChange={handleInputChange}>
                            <option value="">Select Type</option>
                            <option value="Service">Service</option>
                            <option value="Product">Product</option>
                            <option value="Consultation">Consultation</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Budget Range *</label>
                        <select name="budget" className="form-select" required value={formData.budget} onChange={handleInputChange}>
                            <option value="">Select Budget</option>
                            {BUDGET_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Message (Optional)</label>
                    <textarea name="message" className="form-textarea"
                        value={formData.message} onChange={handleInputChange}
                        placeholder="Tell us more about your requirements..." />
                </div>

                <div className="coupon-section">
                    <label className="form-label">
                        <Tag size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Have a promo code?
                    </label>

                    <div className="coupon-input-group">
                        <input type="text" name="couponCode" className="form-input"
                            value={formData.couponCode} onChange={handleInputChange}
                            placeholder="Enter code (e.g. SAVE10)"
                            disabled={couponState.isApplied} />
                        {couponState.isApplied ? (
                            <button type="button" className="btn-remove" onClick={removeCoupon}>Remove</button>
                        ) : (
                            <button type="button" className="btn-apply" onClick={validateCoupon} disabled={couponState.isValidating}>
                                {couponState.isValidating ? <Loader2 size={16} className="spinner" /> : 'Apply'}
                            </button>
                        )}
                    </div>

                    {!couponState.isApplied && (
                        <button type="button" className="offers-toggle" onClick={toggleOffers}>
                            <Sparkles size={13} />
                            {showOffers ? 'Hide offers' : 'View available offers'}
                            {showOffers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                    )}

                    {showOffers && (
                        <div className="offers-panel">
                            {!canFetch ? (
                                <p className="offers-hint">
                                    Fill in your <strong>Email</strong>, <strong>Requirement Type</strong> and <strong>Budget</strong> above to see offers available for you.
                                </p>
                            ) : offersLoading ? (
                                <div className="offers-loading">
                                    <Loader2 size={18} className="spinner" color="var(--primary)" />
                                    <span>Finding offers…</span>
                                </div>
                            ) : offers.length === 0 ? (
                                <p className="offers-hint">No offers available for your current selection.</p>
                            ) : (
                                <>
                                    <p className="offers-label">{offers.length} offer{offers.length > 1 ? 's' : ''} available</p>
                                    <div className="offers-list">
                                        {offers.map(offer => {
                                            const discount = offer.discountType === 'percentage'
                                                ? `${offer.discountValue}% off`
                                                : `₹${offer.discountValue} flat off`;
                                            const minOrder = offer.minOrderValue > 0
                                                ? ` · min ₹${offer.minOrderValue.toLocaleString('en-IN')}`
                                                : '';
                                            const scope = offer.applicableTo.includes('All')
                                                ? 'All types'
                                                : offer.applicableTo.join(', ');
                                            return (
                                                <div key={offer._id} className="offer-item" onClick={() => applyOffer(offer.code)}>
                                                    <div className="offer-left">
                                                        <span className="offer-code">{offer.code}</span>
                                                        <span className="offer-desc">{discount}{minOrder}</span>
                                                        <div className="offer-tags">
                                                            <span className="offer-tag">{scope}</span>
                                                            {offer.isFirstTimeOnly && (
                                                                <span className="offer-tag offer-tag-new">New users only</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button type="button" className="offer-apply-btn">Apply</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {couponState.error && (
                        <div className="message error"><AlertCircle size={14} /> {couponState.error}</div>
                    )}
                    {couponState.success && (
                        <div className="message success"><CheckCircle size={14} /> {couponState.success}</div>
                    )}

                    {formData.budget && (
                        <div className="price-summary">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>₹{Number(formData.budget).toLocaleString('en-IN')}</span>
                            </div>
                            {couponState.isApplied && (
                                <div className="price-row discount-text">
                                    <span>Discount</span>
                                    <span>− ₹{couponState.discountAmount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="price-row total">
                                <span>Total</span>
                                <span>₹{(couponState.isApplied ? couponState.finalPrice : Number(formData.budget)).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {submitState.error && (
                    <div className="message error" style={{ marginBottom: '1rem', justifyContent: 'center' }}>
                        <AlertCircle size={16} /> {submitState.error}
                    </div>
                )}

                <button type="submit" className="btn-submit" disabled={submitState.isSubmitting}>
                    {submitState.isSubmitting
                        ? <><Loader2 className="spinner" size={20} /> Submitting...</>
                        : <>Submit Request <ArrowRight size={18} /></>}
                </button>
            </form>
        </div>
    );
}
