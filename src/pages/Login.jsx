import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(identifier, password, role);
            if (role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        } catch (err) {
            setError('Invalid login credentials.');
        }
    };

    return (
        <div className="login-background">
            <div className="login-card">
                <h2>Smart Entry System Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="tab-switch">
                        <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin</button>
                        <button type="button" className={role === 'staff' ? 'active' : ''} onClick={() => setRole('staff')}>Staff</button>
                    </div>
                    <label>
                        {role === 'admin' ? 'Admin Email or Staff ID' : 'Staff Email or ID'}
                        <input
                            autoFocus
                            type="text"
                            placeholder="Email or Staff ID"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" className="login-btn">Login</button>
                </form>
                {error && <div className="error">{error}</div>}
            </div>
        </div>
    );
}
