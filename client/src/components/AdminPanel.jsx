import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Utensils, 
    Star, 
    Settings, 
    CreditCard, 
    User, 
    HelpCircle, 
    LogOut, 
    Search, 
    Bell,
    ChevronDown,
    Menu,
    X
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import CouponsTab from './CouponsTab';
import StatsCards from './StatsCards';
import LeadsChart from './LeadsChart';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const MENU_ITEMS = [
    { id: 'leads', label: 'Overview', icon: LayoutDashboard },
    { id: 'leads-list', label: 'Leads', icon: User },
    { id: 'coupons', label: 'Coupons', icon: CreditCard },
];

export default function AdminPanel({ onUnauthorized }) {
    const [activeTab, setActiveTab] = useState('leads');
    const [coupons, setCoupons] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        // Fetch coupons
        axios.get('/api/coupon', { headers: authHeaders() })
            .then(r => setCoupons(r.data))
            .catch(() => {});
            
        // Fetch new leads count (today)
        const today = new Date().toISOString().split('T')[0];
        axios.get(`/api/lead?startDate=${today}`, { headers: authHeaders() })
            .then(r => setNotificationCount(r.data.total))
            .catch(() => {});
    }, []);

    const refreshCoupons = () => {
        axios.get('/api/coupon', { headers: authHeaders() })
            .then(r => setCoupons(r.data))
            .catch(() => {});
    };

    return (
        <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            
            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <Link to="/" className="sidebar-brand">
                    <div className="sidebar-brand-mark">CT</div>
                    COUPONTASK
                </Link>
                <button className="sidebar-close-mobile" onClick={() => setIsSidebarOpen(false)}>
                    <X size={20} />
                </button>


                <div className="sidebar-section">
                    <div className="sidebar-section-label">MENU</div>
                    <nav className="sidebar-nav">
                        {MENU_ITEMS.map(t => {
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.id}
                                    className={`sidebar-nav-item ${activeTab === t.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(t.id);
                                        setIsSidebarOpen(false);
                                    }}
                                >
                                    <Icon size={20} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>


                <div className="sidebar-footer">
                    <button className="sidebar-logout" onClick={onUnauthorized}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                {/* Top Bar */}
                <header className="top-bar">
                    <div className="top-bar-inner">
                        <div className="top-bar-left-group">
                            <button className="mobile-toggle" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={20} />
                            </button>
                        </div>

                        <div className="top-bar-right-aligned">
                            <div className="top-bar-search-wrapper">
                                <Search size={16} className="search-icon-inner" />
                                <input 
                                    type="text" 
                                    placeholder="Type here..." 
                                    className="top-bar-input" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="top-bar-actions">
                                <div className="action-item user-action" title="Admin User">
                                    <User size={16} />
                                    <span>Admin</span>
                                </div>
                                <div className="action-item" title="Settings">
                                    <Settings size={16} />
                                </div>
                                <div className="action-item notification-item" title={`${notificationCount} New Leads Today`}>
                                    <Bell size={16} />
                                    {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>



                <div className="admin-content">
                    {activeTab === 'leads' ? (
                        <>
                            <h1 className="admin-page-title">Analytics Overview</h1>
                            
                            {/* Stats & Charts Grid */}
                            <StatsCards />

                            {/* Recent Leads Preview */}
                            <div className="dashboard-card col-12" style={{ marginTop: '2rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Recent Leads</h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Latest conversion activity across all coupons</p>
                                </div>
                                <AdminDashboard
                                    coupons={coupons}
                                    onUnauthorized={onUnauthorized}
                                    externalSearch={searchTerm}
                                />
                            </div>
                        </>
                    ) : activeTab === 'leads-list' ? (
                        <>
                            <h1 className="admin-page-title">Lead Management</h1>
                            <div className="dashboard-card col-12">
                                <AdminDashboard
                                    coupons={coupons}
                                    onUnauthorized={onUnauthorized}
                                    externalSearch={searchTerm}
                                />
                            </div>
                        </>
                    ) : activeTab === 'coupons' ? (
                        <>
                            <h1 className="admin-page-title">Coupon Management</h1>
                            <div className="dashboard-card col-12">
                                <CouponsTab
                                    onUnauthorized={onUnauthorized}
                                    onSaved={refreshCoupons}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="dashboard-card col-12">
                            <h1 className="admin-page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                            <p style={{ color: 'var(--text-secondary)' }}>This section is coming soon.</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

