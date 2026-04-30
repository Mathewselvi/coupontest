import { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

export default function LeadsChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/admin/leads-chart', { headers: authHeaders() })
            .then(r => setData(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const total = data.reduce((sum, d) => sum + d.leads, 0);

    return (
        <div className="chart-wrap">
            <div className="chart-header">
                <div>
                    <span className="chart-title">Leads this week</span>
                    <span className="chart-subtitle">Last 7 days</span>
                </div>
                {!loading && <span className="chart-total">{total}</span>}
            </div>
            {loading ? (
                <div className="chart-loading">
                    <Loader2 size={22} className="spinner" color="var(--primary)" />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4338ca" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#a1a1aa' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#a1a1aa' }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#fff',
                                border: '1px solid #e4e4e7',
                                borderRadius: 8,
                                fontSize: 12,
                                padding: '6px 12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                            }}
                            labelStyle={{ color: '#52525b', fontWeight: 600, marginBottom: 2 }}
                            itemStyle={{ color: '#4338ca' }}
                            formatter={(v) => [v, 'Leads']}
                            cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="leads"
                            stroke="#4338ca"
                            strokeWidth={2}
                            fill="url(#leadGrad)"
                            dot={{ fill: '#4338ca', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#4338ca', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
