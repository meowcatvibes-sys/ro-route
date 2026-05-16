import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Shield, Calendar, Camera, Save, CheckCircle } from 'lucide-react';
import '../driver/DriverDashboard.css';

export default function UserProfile() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getRoleLabel = (role) => {
    const labels = { passenger: 'Passenger', admin: 'Administrator', driver: 'Driver' };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = { passenger: '#2563EB', admin: '#6366F1', driver: '#059669' };
    return colors[role] || '#64748b';
  };

  if (!user) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  const roleColor = getRoleColor(user.role);

  return (
    <div className="driver-dashboard" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="driver-dashboard__header">
        <h1>My Profile</h1>
        <p>View your account information</p>
      </div>

      {saved && (
        <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(5,150,105,0.1)', borderRadius: '10px', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 500 }}>
          <CheckCircle size={18} /> Profile updated successfully!
        </div>
      )}

      {/* Profile Card */}
      <div className="current-trip animate-fade-in-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.5rem 0 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '2rem', fontWeight: 700, flexShrink: 0,
          }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.35rem' }}>{user.name}</h2>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.25rem 0.75rem', borderRadius: '20px',
                background: `${roleColor}15`, color: roleColor,
                fontSize: '0.8rem', fontWeight: 600,
              }}
            >
              <Shield size={13} /> {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Mail size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Phone size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.phone || 'Not provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Shield size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Role</div>
              <div style={{ fontWeight: 600, color: roleColor }}>{getRoleLabel(user.role)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatDate(user.created_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
