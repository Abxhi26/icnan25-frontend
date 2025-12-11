import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const idRef = useRef(null);

    useEffect(() => {
        // autofocus identifier input on mount
        if (idRef.current) idRef.current.focus();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Keep signature as before — passing role (if your auth accepts it)
            await login(identifier, password, role);
            if (role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            setError('Invalid login credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-background">
            <div className="login-card">
                <h1 className="brand">ICNAN'25</h1>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="tab-switch" role="tablist" aria-label="Login role switch">
                        <button
                            type="button"
                            className={role === 'admin' ? 'active' : ''}
                            onClick={() => setRole('admin')}
                            aria-pressed={role === 'admin'}
                        >
                            Admin
                        </button>
                        <button
                            type="button"
                            className={role === 'staff' ? 'active' : ''}
                            onClick={() => setRole('staff')}
                            aria-pressed={role === 'staff'}
                        >
                            Staff
                        </button>
                    </div>

                    <label className="field">
                        <span className="label-text">{role === 'admin' ? 'Admin Email or Staff ID' : 'Staff Email or ID'}</span>
                        <input
                            ref={idRef}
                            autoFocus
                            type="text"
                            placeholder="Email or Staff ID"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            aria-label="Email or Staff ID"
                        />
                    </label>

                    <label className="field">
                        <span className="label-text">Password</span>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-label="Password"
                        />
                    </label>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Signing in…' : 'Login'}
                    </button>
                </form>

                {error && <div className="error" role="alert">{error}</div>}

                <div className="login-foot">
                    <small>Use admin credentials seeded in DB. Contact the operations team if you need help.</small>
                </div>
            </div>
        </div>
    );
}
