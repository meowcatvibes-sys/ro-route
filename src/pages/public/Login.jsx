import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bus, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, Truck, Ticket } from 'lucide-react';
import './Auth.css';

const ROLES = [
  { key: 'passenger', label: 'Passenger', icon: Ticket, color: '#2563EB', bg: 'rgba(37,99,235,0.1)', desc: 'Book trips & manage tickets' },
  { key: 'admin', label: 'Admin', icon: Shield, color: '#6366F1', bg: 'rgba(99,102,241,0.1)', desc: 'Manage terminal operations' },
  { key: 'driver', label: 'Driver', icon: Truck, color: '#059669', bg: 'rgba(5,150,105,0.1)', desc: 'View trips & update status' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('passenger');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentRole = ROLES.find(r => r.key === activeRole);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // Verify role matches
      if (user.role !== activeRole) {
        setError(`This account is registered as "${user.role}", not "${activeRole}". Please select the correct tab.`);
        setLoading(false);
        return;
      }
      const dashMap = {
        admin: '/admin/dashboard',
        driver: '/driver/dashboard',
        passenger: '/schedules',
      };
      navigate(dashMap[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__left" style={{ '--role-color': currentRole.color }}>
        <div className="auth-page__left-content">
          <Bus size={40} />
          <h2>Welcome to Ro-Route</h2>
          <p>Your trusted partner for bus travel between Roxas City and Manila.</p>

          <div className="auth-page__role-info">
            <div className="auth-page__role-icon" style={{ background: currentRole.bg, color: currentRole.color }}>
              <currentRole.icon size={28} />
            </div>
            <div>
              <h3 style={{ color: 'white', margin: '0 0 4px' }}>Logging in as {currentRole.label}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{currentRole.desc}</p>
            </div>
          </div>


        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-card animate-fade-in-up">
          <div className="auth-card__header">
            <Link to="/" className="auth-card__logo">
              <div className="auth-card__logo-icon"><Bus size={20} /></div>
              <span>Ro-Route</span>
            </Link>
            <h1>Log In</h1>
            <p>Select your role and enter your credentials</p>
          </div>

          {/* Role Tabs */}
          <div className="role-tabs">
            {ROLES.map(role => (
              <button
                key={role.key}
                className={`role-tab ${activeRole === role.key ? 'role-tab--active' : ''}`}
                onClick={() => { setActiveRole(role.key); setError(''); }}
                style={activeRole === role.key ? { '--tab-color': role.color, '--tab-bg': role.bg } : {}}
              >
                <role.icon size={18} />
                <span>{role.label}</span>
              </button>
            ))}
          </div>

          {/* Role Indicator */}
          <div className="role-indicator" style={{ background: currentRole.bg, color: currentRole.color }}>
            <currentRole.icon size={16} />
            <span>You are logging in as <strong>{currentRole.label}</strong></span>
          </div>

          {error && (
            <div className="auth-error animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="form-input-wrapper">
                <Mail size={18} className="form-input-icon" />
                <input
                  id="email" name="email" type="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="form-input-wrapper">
                <Lock size={18} className="form-input-icon" />
                <input
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange}
                  autoComplete="current-password"
                />
                <button type="button" className="form-input-toggle"
                  onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn--full btn--lg"
              disabled={loading}
              style={{ background: `linear-gradient(135deg, ${currentRole.color}, ${currentRole.color}dd)`, color: 'white', boxShadow: `0 2px 8px ${currentRole.color}40` }}
            >
              {loading ? <div className="spinner" /> : `Log In as ${currentRole.label}`}
            </button>
          </form>

          <p className="auth-card__footer">
            Don't have an account? <Link to="/register">Sign up as Passenger</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
