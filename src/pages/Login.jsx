import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [loginType, setLoginType] = useState('admin'); // 'admin' or 'staff'
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(identifier, password);

        setLoading(false);

        if (result.success) {
            // AuthContext will handle redirect based on role
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>ICNAN'25 Conference</h1>
                    <p>Entry Validation System</p>
                </div>

                {/* Login Type Selector */}
                <div className="login-type-selector">
                    <button
                        type="button"
                        className={`type-btn ${loginType === 'admin' ? 'active' : ''}`}
                        onClick={() => {
                            setLoginType('admin');
                            setIdentifier('');
                            setPassword('');
                            setError('');
                        }}
                    >
                        👨‍💼 Admin Login
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${loginType === 'staff' ? 'active' : ''}`}
                        onClick={() => {
                            setLoginType('staff');
                            setIdentifier('');
                            setPassword('');
                            setError('');
                        }}
                    >
                        👤 Staff Login
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="identifier">
                            {loginType === 'admin' ? 'Email' : 'Registration Number'}
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={loginType === 'admin' ? 'Enter your email' : 'Enter your registration number'}
                            required
                            disabled={loading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="login-footer">
                    {loginType === 'admin' ? (
                        <p className="test-credentials">
                            <strong>Admin:</strong> admin@event.com / admin123
                        </p>
                    ) : (
                        <p className="test-credentials">
                            <strong>Staff:</strong> Use your Registration Number / Password
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
