import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bus, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const map = {
      admin: '/admin/dashboard',
      driver: '/driver/dashboard',
      passenger: '/my-bookings',
    };
    return map[user.role] || '/';
  };

  const getRoleBadge = () => {
    if (!user) return null;
    const colors = {
      admin: 'badge--admin',
      driver: 'badge--driver',
      passenger: 'badge--passenger',
    };
    return (
      <span className={`nav-role-badge ${colors[user.role]}`}>
        {user.role}
      </span>
    );
  };

  // Don't show navbar on admin/driver panels (they have sidebars)
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDriverRoute = location.pathname.startsWith('/driver');
  if (isAdminRoute || isDriverRoute) return null;

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <Bus size={24} />
          </div>
          <div className="navbar__logo-text">
            <span className="navbar__brand">Ro-Route</span>
            <span className="navbar__tagline">Roxas–Manila</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar__links">
          <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/schedules" className={`navbar__link ${location.pathname === '/schedules' ? 'active' : ''}`}>
            Schedules
          </Link>
          <Link to="/announcements" className={`navbar__link ${location.pathname === '/announcements' ? 'active' : ''}`}>
            Announcements
          </Link>
        </div>

        {/* Right Side */}
        <div className="navbar__actions">
          {isAuthenticated ? (
            <div className="navbar__user" ref={dropdownRef}>
              <button
                className="navbar__user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="navbar__avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="navbar__username">{user.name}</span>
                {getRoleBadge()}
                <ChevronDown size={16} className={`navbar__chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="navbar__dropdown animate-fade-in-down">
                  <div className="navbar__dropdown-header">
                    <p className="navbar__dropdown-name">{user.name}</p>
                    <p className="navbar__dropdown-email">{user.email}</p>
                  </div>
                  <div className="navbar__dropdown-divider"></div>
                  <Link to={getDashboardLink()} className="navbar__dropdown-item">
                    <User size={16} />
                    Dashboard
                  </Link>
                  <Link to="/profile" className="navbar__dropdown-item">
                    <User size={16} />
                    Profile
                  </Link>
                  <div className="navbar__dropdown-divider"></div>
                  <button onClick={handleLogout} className="navbar__dropdown-item navbar__dropdown-item--danger">
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__auth-btns">
              <Link to="/login" className="btn btn--ghost">
                Log In
              </Link>
              <Link to="/register" className="btn btn--primary">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar__mobile animate-fade-in-down">
          <Link to="/" className="navbar__mobile-link">Home</Link>
          <Link to="/schedules" className="navbar__mobile-link">Schedules</Link>
          <Link to="/announcements" className="navbar__mobile-link">Announcements</Link>
          <div className="navbar__mobile-divider"></div>
          {isAuthenticated ? (
            <>
              <Link to={getDashboardLink()} className="navbar__mobile-link">Dashboard</Link>
              <Link to="/profile" className="navbar__mobile-link">Profile</Link>
              <button onClick={handleLogout} className="navbar__mobile-link navbar__mobile-link--danger">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__mobile-link">Log In</Link>
              <Link to="/register" className="navbar__mobile-link navbar__mobile-link--primary">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
