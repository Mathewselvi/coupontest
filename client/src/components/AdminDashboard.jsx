import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Loader2, Search, X, AlertCircle, Trash2, TriangleAlert, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import LeadModal from './LeadModal';
import Pagination from './Pagination';
import { useToast } from '../context/ToastContext';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const LIMIT = 10;

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function DeleteConfirmModal({ lead, onConfirm, onCancel, loading }) {
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
                <h3 className="del-confirm-title">Delete Lead</h3>
                <p className="del-confirm-msg">
                    You're about to permanently delete the lead for{' '}
                    <strong>{lead.name}</strong>. This action cannot be undone.
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

export default function AdminDashboard({ coupons, onUnauthorized, externalSearch }) {
    const [leads, setLeads] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const [confirmLead, setConfirmLead] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const showToast = useToast();

    const [search, setSearch] = useState('');
    const [couponFilter, setCouponFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const debouncedSearch = useDebounce(externalSearch !== undefined ? externalSearch : search, 400);
    const abortRef = useRef(null);

    const fetchLeads = useCallback(async (p = 1) => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page: p, limit: LIMIT });
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (couponFilter) params.set('couponId', couponFilter);
            if (typeFilter) params.set('requirementType', typeFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await axios.get(`/api/lead?${params}`, {
                headers: authHeaders(),
                signal: abortRef.current.signal
            });
            setLeads(res.data.leads);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            if (axios.isCancel(err)) return;
            if (err.response?.status === 401) { onUnauthorized?.(); return; }
            setError('Failed to load leads.');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, couponFilter, typeFilter, startDate, endDate, onUnauthorized]);

    useEffect(() => {
        setPage(1);
        fetchLeads(1);
    }, [fetchLeads]);

    const handlePage = (p) => {
        setPage(p);
        fetchLeads(p);
    };

    const handleDeleteConfirm = async () => {
        if (!confirmLead) return;
        setDeleting(true);
        try {
            await axios.delete(`/api/lead/${confirmLead._id}`, { headers: authHeaders() });
            showToast(`Lead for ${confirmLead.name} deleted`);
            setConfirmLead(null);
            fetchLeads(page);
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to delete lead', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const exportToExcel = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (couponFilter) params.set('couponId', couponFilter);
            if (typeFilter) params.set('requirementType', typeFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await axios.get(`/api/lead/export?${params}`, { headers: authHeaders() });
            const allLeads = res.data.leads;

            const rows = allLeads.map((l, i) => ({
                '#': i + 1,
                'Date': new Date(l.createdAt).toLocaleDateString('en-IN'),
                'Name': l.name,
                'Phone': l.phone,
                'Email': l.email,
                'City': l.city,
                'Requirement Type': l.requirementType,
                'Budget (INR)': l.budget,
                'Coupon Code': l.couponApplied?.code || 'None',
                'Discount (INR)': l.discountAmount,
                'Final Price (INR)': l.finalPrice,
                'Message': l.message || '',
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [
                { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 26 },
                { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Leads');
            XLSX.writeFile(wb, `leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast(`Exported ${rows.length} lead${rows.length !== 1 ? 's' : ''}`);
        } catch {
            showToast('Export failed', 'error');
        } finally {
            setExporting(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCouponFilter('');
        setTypeFilter('');
        setStartDate('');
        setEndDate('');
    };

    const hasFilters = search || couponFilter || typeFilter || startDate || endDate;

    return (
        <div>
            <div className="filters-bar">
                {!externalSearch && externalSearch !== '' && (
                    <div className="search-wrap">
                        <Search size={16} className="search-icon" />
                        <input
                            className="search-input"
                            placeholder="Search name, email or phone…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button className="clear-search" onClick={() => setSearch('')}><X size={14} /></button>}
                    </div>
                )}

                <div className="filter-selects">
                    <select className="filter-select" value={couponFilter} onChange={e => setCouponFilter(e.target.value)}>
                        <option value="">All Coupons</option>
                        <option value="none">No Coupon</option>
                        {coupons.map(c => <option key={c._id} value={c._id}>{c.code}</option>)}
                    </select>

                    <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="">All Types</option>
                        <option value="Service">Service</option>
                        <option value="Product">Product</option>
                        <option value="Consultation">Consultation</option>
                    </select>

                    <input type="date" className="filter-select" value={startDate}
                        onChange={e => setStartDate(e.target.value)} title="From date" />
                    <input type="date" className="filter-select" value={endDate}
                        onChange={e => setEndDate(e.target.value)} title="To date" />

                    {hasFilters && (
                        <button className="btn-clear-filters" onClick={clearFilters}>
                            <X size={14} /> Clear
                        </button>
                    )}

                    <button className="btn-export" onClick={exportToExcel} disabled={exporting} title="Export to Excel">
                        {exporting ? <Loader2 size={14} className="spinner" /> : <Download size={14} />}
                        {exporting ? 'Exporting…' : 'Export'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 size={36} className="spinner" color="var(--primary)" />
                </div>
            ) : error ? (
                <div className="message error" style={{ justifyContent: 'center', padding: '2rem', fontSize: '1rem' }}>
                    <AlertCircle size={18} /> {error}
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '44px' }}>#</th>
                                    <th>Date</th>
                                    <th>Name / Contact</th>
                                    <th>City</th>
                                    <th>Type</th>
                                    <th>Budget</th>
                                    <th>Coupon</th>
                                    <th>Final Price</th>
                                    <th style={{ width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem' }}>
                                            {hasFilters ? 'No leads match your filters.' : 'No leads yet.'}
                                        </td>
                                    </tr>
                                ) : leads.map((lead, idx) => {
                                    const serial = (page - 1) * LIMIT + idx + 1;
                                    return (
                                        <tr
                                            key={lead._id}
                                            className={`lead-row ${lead.budget >= 10000 ? 'lead-high-value' : ''}`}
                                            onClick={() => setSelectedLeadId(lead._id)}
                                            title="Click to view details"
                                        >
                                            <td data-label="#" style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.8rem' }}>
                                                {serial}
                                            </td>
                                            <td data-label="Date" style={{ whiteSpace: 'nowrap' }}>
                                                {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                            <td data-label="Name / Contact">
                                                <div style={{ fontWeight: 500 }}>{lead.name}</div>
                                                <div className="sub-text">{lead.email}</div>
                                                <div className="sub-text">{lead.phone}</div>
                                            </td>
                                            <td data-label="City">{lead.city}</td>
                                            <td data-label="Type">
                                                <span className={`type-badge type-${lead.requirementType.toLowerCase()}`}>
                                                    {lead.requirementType}
                                                </span>
                                            </td>
                                            <td data-label="Budget">₹{lead.budget.toLocaleString('en-IN')}</td>
                                            <td data-label="Coupon">
                                                {lead.couponApplied
                                                    ? <span className="badge success">{lead.couponApplied.code}</span>
                                                    : <span className="badge muted">None</span>}
                                            </td>
                                            <td data-label="Final Price" style={{ fontWeight: 600 }}>
                                                ₹{lead.finalPrice.toLocaleString('en-IN')}
                                            </td>
                                            <td data-label="Delete" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className="lead-del-btn"
                                                    onClick={() => setConfirmLead(lead)}
                                                    title="Delete lead"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onChange={handlePage} />
                </>
            )}

            {selectedLeadId && (
                <LeadModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
            )}

            {confirmLead && (
                <DeleteConfirmModal
                    lead={confirmLead}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmLead(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
}
