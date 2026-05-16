import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bus, Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/schedules');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__left">
        <div className="auth-page__left-content">
          <Bus size={40} />
          <h2>Join Ro-Route</h2>
          <p>Create your account and start booking bus trips between Roxas City and Manila.</p>
          <ul className="auth-page__benefits">
            <li>✓ Book tickets online 24/7</li>
            <li>✓ Choose your preferred seat</li>
            <li>✓ Get digital e-tickets</li>
            <li>✓ Track your trip in real-time</li>
          </ul>
        </div>
      </div>

      <div className="auth-page__right">
        <div className="auth-card animate-fade-in-up">
          <div className="auth-card__header">
            <Link to="/" className="auth-card__logo">
              <div className="auth-card__logo-icon"><Bus size={20} /></div>
              <span>Ro-Route</span>
            </Link>
            <h1>Create Account</h1>
            <p>Fill in your details to get started</p>
          </div>

          {error && (
            <div className="auth-error animate-fade-in">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="form-input-wrapper">
                <User size={18} className="form-input-icon" />
                <input
                  id="name" name="name" type="text"
                  placeholder="Juan Dela Cruz"
                  value={form.name} onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="form-input-wrapper">
                <Mail size={18} className="form-input-icon" />
                <input
                  id="reg-email" name="email" type="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="form-input-wrapper">
                <Phone size={18} className="form-input-icon" />
                <input
                  id="phone" name="phone" type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={form.phone} onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="form-input-icon" />
                  <input
                    id="reg-password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={form.password} onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm</label>
                <div className="form-input-wrapper">
                  <Lock size={18} className="form-input-icon" />
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={form.confirmPassword} onChange={handleChange}
                  />
                  <button type="button" className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
