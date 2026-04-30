import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LeadForm from './components/LeadForm';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { ToastProvider } from './context/ToastContext';
import { Menu, X } from 'lucide-react';
import './index.css';

function NavBar({ isAuthenticated, onLogout }) {
    const location = useLocation();
    const isAdmin = location.pathname === '/admin';
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Close menu on route change
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    return (
        <nav className="navbar" ref={menuRef}>
            <Link to="/" className="nav-brand">coupontest</Link>

            {/* Desktop Links */}
            <div className="nav-links nav-links-desktop">
                <Link to="/" className={!isAdmin ? 'active' : ''}>Home</Link>
                <Link to="/admin" className={isAdmin ? 'active' : ''}>Admin</Link>
                {isAuthenticated && (
                    <a href="#" className="nav-logout" onClick={e => { e.preventDefault(); onLogout(); }}>Logout</a>
                )}
            </div>

            {/* Hamburger button (mobile) */}
            <button
                className="hamburger-btn"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Toggle menu"
            >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="mobile-menu">
                    <Link to="/" className={`mobile-link ${!isAdmin ? 'active' : ''}`}>Home</Link>
                    <Link to="/admin" className={`mobile-link ${isAdmin ? 'active' : ''}`}>Admin</Link>
                    {isAuthenticated && (
                        <a href="#" className="mobile-link logout"
                           onClick={e => { e.preventDefault(); onLogout(); setMenuOpen(false); }}>
                            Logout
                        </a>
                    )}
                </div>
            )}
        </nav>
    );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
    };

    return (
        <ToastProvider>
            <Router>
                <div className="app-container">
                    <NavBar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<LeadForm />} />
                            <Route
                                path="/admin"
                                element={
                                    isAuthenticated
                                        ? <AdminPanel onUnauthorized={handleLogout} />
                                        : <AdminLogin onLogin={() => setIsAuthenticated(true)} />
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ToastProvider>
    );
}

export default App;

