import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        navigate('/');
      } else {
        await register(username, password);
        setSuccess('Account created! Please log in.');
        setMode('login');
        setUsername(''); setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="bg-orb orb1" /><div className="bg-orb orb2" /><div className="bg-orb orb3" />
      </div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">🏫</div>
          <h1 className="login-title">SmartNav</h1>
          <p className="login-subtitle">JIIT Noida — Smart Campus Navigation System</p>
        </div>

        <div className="tab-switch">
          <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Login</button>
          <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Register</button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error   && <div className="alert alert-error">❌ {error}</div>}
          {success && <div className="alert alert-success">✅ {success}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter username" required autoComplete="username" />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter password" required autoComplete="current-password" />
          </div>

          <button id="auth-submit-btn" type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : mode === 'login' ? '🔐 Login' : '📝 Create Account'}
          </button>
        </form>

        <div className="login-hint">
          <p>Demo Accounts:</p>
          <div className="demo-accounts">
            <div className="demo-account" onClick={() => { setUsername('admin'); setPassword('admin123'); setMode('login'); }}>
              <span className="demo-role admin-role">ADMIN</span>
              <span>admin / admin123</span>
            </div>
            <div className="demo-account" onClick={() => { setUsername('student'); setPassword('user123'); setMode('login'); }}>
              <span className="demo-role user-role">USER</span>
              <span>student / user123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
