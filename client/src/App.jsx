import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import LeadForm from './components/LeadForm';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { ToastProvider } from './context/ToastContext';
import { Menu, X, LogOut } from 'lucide-react';

import './index.css';

function NavBar({ isAuthenticated, onLogout }) {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');
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
        <nav className="navbar-premium" ref={menuRef}>
            <div className="nav-inner">
                <Link to="/" className="nav-brand-premium">
                    <div className="brand-mark">CT</div>
                    COUPONTASK
                </Link>

                {/* Desktop Links */}
                <div className="nav-links-premium">
                    <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
                    <Link to="/admin" className={isAdmin ? 'active' : ''}>Admin</Link>
                    {isAuthenticated && (
                        <button className="btn-logout-minimal" onClick={onLogout}>
                            <LogOut size={16} />
                            Logout
                        </button>
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
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && (
                <div className="mobile-menu-premium">
                    <Link to="/" className={`mobile-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                    <Link to="/admin" className={`mobile-link ${isAdmin ? 'active' : ''}`}>Admin</Link>
                    {isAuthenticated && (
                        <button className="mobile-link logout" onClick={onLogout}>
                            Logout
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}


function AppContent({ isAuthenticated, handleLogout, setIsAuthenticated }) {
    const location = useLocation();
    const isAdminView = location.pathname.startsWith('/admin') && isAuthenticated;

    return (
        <div className="app-container">
            {!isAdminView && <NavBar isAuthenticated={isAuthenticated} onLogout={handleLogout} />}
            <main className={isAdminView ? "main-content-full" : "main-content"}>
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
                <AppContent 
                    isAuthenticated={isAuthenticated} 
                    handleLogout={handleLogout} 
                    setIsAuthenticated={setIsAuthenticated} 
                />
            </Router>
        </ToastProvider>
    );
}

export default App;


