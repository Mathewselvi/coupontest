import { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, Tag, LogOut } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import CouponsTab from './CouponsTab';
import StatsCards from './StatsCards';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const TABS = [
    { id: 'leads', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'coupons', label: 'Coupons', icon: Tag },
];

export default function AdminPanel({ onUnauthorized }) {
    const [activeTab, setActiveTab] = useState('leads');
    const [coupons, setCoupons] = useState([]);

    useEffect(() => {
        axios.get('/api/coupon', { headers: authHeaders() })
            .then(r => setCoupons(r.data))
            .catch(() => {});
    }, []);

    const refreshCoupons = () => {
        axios.get('/api/coupon', { headers: authHeaders() })
            .then(r => setCoupons(r.data))
            .catch(() => {});
    };

    return (
        <div className="admin-panel">
            {/* Page header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Admin Dashboard</h1>
                    <p className="admin-page-sub">Manage leads and promotional coupons</p>
                </div>
            </div>

            {/* Stats */}
            <StatsCards />

            {/* Premium tab bar */}
            <div className="admin-tab-bar">
                {TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            className={`admin-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            <Icon size={16} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content card */}
            <div className="glass-panel admin-tab-content">
                {activeTab === 'leads' && (
                    <AdminDashboard
                        coupons={coupons}
                        onUnauthorized={onUnauthorized}
                    />
                )}
                {activeTab === 'coupons' && (
                    <CouponsTab
                        onUnauthorized={onUnauthorized}
                        onSaved={refreshCoupons}
                    />
                )}
            </div>
        </div>
    );
}
