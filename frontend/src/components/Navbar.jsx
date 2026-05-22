import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">🏫</div>
        <div className="brand-text">
          <span className="brand-name">SmartNav</span>
          <span className="brand-sub">JIIT Noida</span>
        </div>
      </div>

      <div className="navbar-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">🗺️</span> Navigate
        </Link>
        {isAdmin && (
          <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>
            <span className="nav-icon">⚙️</span> Admin
          </Link>
        )}
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{user?.username}</span>
            <span className={`user-role role-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
