import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, TrendingUp, Tag, CalendarDays,
    RefreshCw, AlertCircle, Loader2, Award
} from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

const COLORS = ['#5D5FEF', '#8E90FF', '#4BD3FF', '#05A6DD', '#C8C9FF'];

/* ── Mini stat card ── */
function StatMini({ icon: Icon, label, value, sub, iconColor, iconBg }) {
    return (
        <div className="stat-card-premium">
            <div className="stat-card-top">
                <div className="stat-card-icon-wrap" style={{ background: iconBg }}>
                    <Icon size={17} color={iconColor} />
                </div>
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
            {sub && (
                <div style={{ fontSize: '0.6875rem', color: iconColor, fontWeight: 600, marginTop: '2px', opacity: 0.85 }}>
                    {sub}
                </div>
            )}
        </div>
    );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '0.8125rem' }}>
            <div style={{ fontWeight: 600, color: '#2b3674', marginBottom: '2px' }}>{label}</div>
            <div style={{ color: '#5D5FEF', fontWeight: 700 }}>{payload[0].value} lead{payload[0].value !== 1 ? 's' : ''}</div>
        </div>
    );
}

export default function StatsCards() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, chartRes] = await Promise.all([
                axios.get('/api/admin/stats', { headers: authHeaders() }),
                axios.get('/api/admin/leads-chart', { headers: authHeaders() })
            ]);
            setStats(statsRes.data);
            setChartData(chartRes.data);
        } catch (err) {
            console.error('Analytics Fetch Error:', err);
            setError(err.response?.data?.error || 'Failed to load analytics. Check your connection.');
        } finally {

            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ── Loading ── */
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', width: '100%' }}>
                <Loader2 className="spinner" size={36} color="var(--primary)" />
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', textAlign: 'center' }}>
                <AlertCircle size={40} color="var(--danger)" />
                <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.9375rem', maxWidth: 320 }}>{error}</p>
                <button
                    onClick={fetchData}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.5rem 1.25rem', background: 'var(--primary)', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font)'
                    }}
                >
                    <RefreshCw size={14} /> Retry
                </button>
            </div>
        );
    }

    const distribution = stats?.typeDistribution?.length > 0 ? stats.typeDistribution : null;
    const couponMetrics = stats?.couponMetrics || { active: 0, expired: 0, total: 0 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>

            {/* ══ Row 1 — 4 Mini Stat Cards ══ */}
            <div className="stats-grid">
                <StatMini
                    icon={Users}
                    label="Total Leads"
                    value={(stats?.totalLeads || 0).toLocaleString('en-IN')}
                    sub={`${stats?.todayLeads || 0} today`}
                    iconColor="#5D5FEF"
                    iconBg="#eef0fd"
                />
                <StatMini
                    icon={CalendarDays}
                    label="This Week"
                    value={(stats?.lastWeekLeads || 0).toLocaleString('en-IN')}
                    sub="last 7 days"
                    iconColor="#05A6DD"
                    iconBg="#e6f9ff"
                />
                <StatMini
                    icon={TrendingUp}
                    label="Conversion Value"
                    value={`₹${(stats?.totalBudget || 0).toLocaleString('en-IN')}`}
                    sub={`₹${(stats?.totalDiscount || 0).toLocaleString('en-IN')} saved`}
                    iconColor="#05cd99"
                    iconBg="#e6faf4"
                />
                <StatMini
                    icon={Tag}
                    label="Active Coupons"
                    value={(couponMetrics.active).toString()}
                    sub={`of ${couponMetrics.total} total`}
                    iconColor="#ffb547"
                    iconBg="#fff8e6"
                />
            </div>

            {/* ══ Row 2 — Lead Trend + Distribution ══ */}
            <div className="dashboard-grid">

                {/* Lead Trend Area Chart */}
                <div className="dashboard-card col-8">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Lead Trend</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Daily leads — last 7 days</div>
                        </div>
                        <button
                            className="cpn-btn-refresh"
                            onClick={fetchData}
                            title="Refresh"
                            style={{ flexShrink: 0 }}
                        >
                            <RefreshCw size={15} />
                        </button>
                    </div>
                    <ResponsiveContainer width="100%" height={190}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#5D5FEF" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#5D5FEF" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#a3aed0', fontSize: 11 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#a3aed0', fontSize: 11 }}
                                allowDecimals={false}
                                width={28}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="#5D5FEF"
                                strokeWidth={2.5}
                                fill="url(#leadGrad)"
                                dot={false}
                                activeDot={{ r: 4, fill: '#5D5FEF', stroke: 'white', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#5D5FEF' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily lead count</span>
                    </div>
                </div>

                {/* Requirement Distribution Donut */}
                <div className="dashboard-card col-4">
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '2px' }}>Requirements</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>Distribution by type</div>

                    {distribution ? (
                        <>
                            <ResponsiveContainer width="100%" height={148}>
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        innerRadius={44}
                                        outerRadius={60}
                                        paddingAngle={4}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        {distribution.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8125rem' }}
                                        formatter={(v, n) => [v, n]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                                {distribution.map((item, i) => (
                                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: '0.625rem', color: 'var(--text-muted)' }}>
                            <Users size={32} strokeWidth={1.5} />
                            <span style={{ fontSize: '0.8125rem' }}>No lead data yet</span>
                        </div>
                    )}
                </div>

                {/* Top Coupons */}
                <div className="dashboard-card col-6">
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '2px' }}>Top Coupons</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Highest usage performance</div>

                    {stats?.topCoupons?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats.topCoupons.map((item, idx) => {
                                const pct = stats.totalLeads > 0
                                    ? Math.min(Math.round((item.count / stats.totalLeads) * 100), 100)
                                    : 0;
                                return (
                                    <div key={item.code} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '8px',
                                            background: COLORS[idx % COLORS.length],
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '0.65rem', flexShrink: 0
                                        }}>
                                            {item.code.slice(0, 3)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.code}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.5rem' }}>
                                                    {item.count} use{item.count !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div style={{ height: 4, background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${pct}%`, background: COLORS[idx % COLORS.length], borderRadius: '999px', transition: 'width 0.6s ease' }} />
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                                Saved ₹{item.totalDiscount.toLocaleString('en-IN')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '0.625rem', color: 'var(--text-muted)' }}>
                            <Award size={32} strokeWidth={1.5} />
                            <span style={{ fontSize: '0.8125rem' }}>No coupon usage yet</span>
                        </div>
                    )}
                </div>

                {/* Coupon Health */}
                <div className="dashboard-card col-6">
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '2px' }}>Coupon Health</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>System-wide coupon status</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Active',   value: couponMetrics.active,  color: '#15803d', bg: '#dcfce7' },
                            { label: 'Expired',  value: couponMetrics.expired, color: '#dc2626', bg: '#fee2e2' },
                            { label: 'Total',    value: couponMetrics.total,   color: '#5D5FEF', bg: '#eef0fd' },
                        ].map(({ label, value, color, bg }) => (
                            <div key={label} style={{ background: bg, borderRadius: '12px', padding: '1rem 0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.625rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '4px', color, opacity: 0.75 }}>{label}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: 'var(--bg-dashboard)',
                        borderRadius: '10px', padding: '0.875rem 1rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total discount given</span>
                        <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary)' }}>
                            ₹{(stats?.totalDiscount || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
