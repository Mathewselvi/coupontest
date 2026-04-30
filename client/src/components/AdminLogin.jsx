import { useState } from 'react';
import axios from 'axios';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLogin({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/admin/login', { password });
            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                onLogin();
            }
        } catch {
            setError('Invalid password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <div className="glass-panel login-container">
                <div className="login-icon-wrap">
                    <Lock size={28} />
                </div>
                <h2 className="form-title">Admin Access</h2>
                <p className="form-subtitle">Enter the master password to view leads</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter password (admin123)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="message error" style={{ marginBottom: '1rem' }}>{error}</div>}
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : 'Login to Dashboard'}
                    </button>
                </form>
            </div>
        </div>
    );
}
