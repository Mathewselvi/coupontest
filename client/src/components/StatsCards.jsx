import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, TrendingUp, Tag, IndianRupee } from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const CARD_CONFIG = [
    {
        key: 'totalLeads',
        label: 'Total Leads',
        icon: Users,
        gradient: 'linear-gradient(135deg, #7B2FBE 0%, #9B59D6 100%)',
        light: '#f3ebff',
        iconColor: '#7B2FBE',
        format: v => v,
    },
    {
        key: 'todayLeads',
        label: 'Leads Today',
        icon: TrendingUp,
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        light: '#e8faf2',
        iconColor: '#10b981',
        format: v => v,
    },
    {
        key: 'totalDiscount',
        label: 'Total Discount Given',
        icon: IndianRupee,
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        light: '#fff8ec',
        iconColor: '#f59e0b',
        format: v => `₹${Number(v).toLocaleString('en-IN')}`,
    },
    {
        key: 'mostUsedCoupon',
        label: 'Top Coupon',
        icon: Tag,
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        light: '#eff6ff',
        iconColor: '#3b82f6',
        format: v => v ? `${v.code} (${v.count}×)` : '—',
    },
];

export default function StatsCards() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/admin/stats', { headers: authHeaders() })
            .then(r => setStats(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="stats-grid">
            {CARD_CONFIG.map((cfg, i) => {
                const Icon = cfg.icon;
                const raw = stats?.[cfg.key];
                const value = loading ? null : cfg.format(raw);

                return (
                    <div key={i} className="stat-card-premium">
                        {/* Colored icon circle */}
                        <div className="stat-card-icon-wrap" style={{ background: cfg.light }}>
                            <Icon size={20} style={{ color: cfg.iconColor }} />
                        </div>

                        <div className="stat-card-content">
                            {loading ? (
                                <>
                                    <div className="skel-line skel-val" />
                                    <div className="skel-line skel-lbl" />
                                </>
                            ) : (
                                <>
                                    <div className="stat-card-value">{value}</div>
                                    <div className="stat-card-label">{cfg.label}</div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
