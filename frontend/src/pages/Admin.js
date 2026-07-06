import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import Loader from '../components/Loader';
import '../styles/Login.css';
import '../styles/Admin.css';
import { useTrackView } from '../hooks/useTrackView';

const API_URL = process.env.REACT_APP_API_URL;

function Admin() {
    useTrackView("Admin");
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
        return localStorage.getItem('adminLoggedIn') === 'true';
    });

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatedIds, setUpdatedIds] = useState({});
    const [editedTimestamps, setEditedTimestamps] = useState({});

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/since-when`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setEvents(data || []);
            setError(null);

            // Pre-fill the editable timestamps
            const stamps = {};
            (data || []).forEach((ev) => {
                stamps[ev.id] = toLocalDatetimeValue(ev.timestamp);
            });
            setEditedTimestamps(stamps);
        } catch (err) {
            console.error('Admin: failed to fetch events', err);
            setError('Failed to load events.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAdminLoggedIn) {
            fetchEvents();
        }
    }, [fetchEvents, isAdminLoggedIn]);

    function toLocalDatetimeValue(ts) {
        const d = new Date(ts);
        // datetime-local expects "YYYY-MM-DDThh:mm"
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function handleTimestampChange(id, value) {
        setEditedTimestamps((prev) => ({ ...prev, [id]: value }));
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error("Please enter credentials!");
            return;
        }
        setLoginLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('token', data.token);
            setIsAdminLoggedIn(true);
            toast.success("Hey Admin!");
        } catch (err) {
            console.error("Admin Login Error:", err);
            toast.error(err.message || "Failed to authenticate.");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminLoggedIn');
        setIsAdminLoggedIn(false);
        toast.info("Bye Admin!");
    };

    async function handleRefresh(id) {
        const newTimestamp = editedTimestamps[id];
        if (!newTimestamp) return;

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Not authenticated. Please log in again.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/since-when/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ timestamp: new Date(newTimestamp).toISOString() }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || `HTTP ${res.status}`);
            }

            // Show success
            setUpdatedIds((prev) => ({ ...prev, [id]: true }));
            setTimeout(() => {
                setUpdatedIds((prev) => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }, 2200);

            // Refresh list
            fetchEvents();
        } catch (err) {
            console.error('Admin: failed to update event', err);
            alert('Failed to update event: ' + err.message);
        }
    }

    if (!isAdminLoggedIn) {
        return (
            <div className="loginpage">
                <div className="login-container">
                    <h2>Admin Login</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <VscEyeClosed /> : <VscEye />}
                            </span>
                        </div>
                        <button type="submit" disabled={loginLoading}>
                            Login
                        </button>
                    </form>
                    {loginLoading && <Loader />}
                    <p className="p1"><Link to="/">Go Back</Link></p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <nav className="admin-navbar">
                <div className="logo" aria-hidden="true"></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={handleLogout} className="admin-refresh-btn" style={{ background: '#ef4444' }}>
                        Log Out
                    </button>
                    <Link to="/" className="admin-home" aria-label="Home">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                </div>
            </nav>

            <div className="admin-content">
                <h1>Admin</h1>

                <div className="admin-section">
                    <h2>⏳ Since When</h2>

                    {loading && <div className="admin-loading">Loading events…</div>}
                    {error && <div className="admin-error">{error}</div>}

                    {!loading && !error && events.map((ev) => (
                        <div key={ev.id} className="admin-event-row">
                            <span className="admin-event-icon">{ev.icon || '⏳'}</span>

                            <div className="admin-event-info">
                                <span className="admin-event-title">{ev.title}</span>
                                {ev.subtitle && (
                                    <span className="admin-event-subtitle">{ev.subtitle}</span>
                                )}
                            </div>

                            <input
                                type="datetime-local"
                                className="admin-event-input"
                                value={editedTimestamps[ev.id] || ''}
                                onChange={(e) => handleTimestampChange(ev.id, e.target.value)}
                            />

                            <div className="admin-event-actions">
                                <button
                                    className="admin-refresh-btn"
                                    onClick={() => handleRefresh(ev.id)}
                                    disabled={!!updatedIds[ev.id]}
                                >
                                    Refresh
                                </button>
                                {updatedIds[ev.id] && (
                                    <span className="admin-success">✓ Updated</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Admin;
