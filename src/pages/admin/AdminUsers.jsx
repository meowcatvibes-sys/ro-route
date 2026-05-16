import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Users, Shield, Ticket, Truck, Search, Filter } from 'lucide-react';
import './AdminCrud.css';

const ROLE_CONFIG = {
  passenger: { icon: Ticket, color: '#2563EB', bg: 'rgba(37,99,235,0.1)', badge: 'confirmed' },
  admin: { icon: Shield, color: '#6366F1', bg: 'rgba(99,102,241,0.1)', badge: 'pending' },
  driver: { icon: Truck, color: '#059669', bg: 'rgba(5,150,105,0.1)', badge: 'scheduled' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchData(); }, [roleFilter]);

  const fetchData = async () => {
    try {
      const r = await adminAPI.getUsers({ role: roleFilter });
      setUsers(r.data.users);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = {
    all: users.length,
    passenger: users.filter(u => u.role === 'passenger').length,
    admin: users.filter(u => u.role === 'admin').length,
    driver: users.filter(u => u.role === 'driver').length,
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} registered users</p>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'All Users', count: roleCounts.all, icon: Users, color: '#64748b', filterVal: '' },
          { label: 'Passengers', count: roleCounts.passenger, icon: Ticket, color: '#2563EB', filterVal: 'passenger' },
          { label: 'Admins', count: roleCounts.admin, icon: Shield, color: '#6366F1', filterVal: 'admin' },
          { label: 'Drivers', count: roleCounts.driver, icon: Truck, color: '#059669', filterVal: 'driver' },
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => { setRoleFilter(item.filterVal); setLoading(true); }}
            className="dashboard-card"
            style={{
              padding: '1.25rem',
              cursor: 'pointer',
              border: roleFilter === item.filterVal ? `2px solid ${item.color}` : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.count}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="dashboard-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.95rem' }}
          />
          {search && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{filtered.length} results</span>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Users size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No users found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const roleConf = ROLE_CONFIG[u.role] || ROLE_CONFIG.passenger;
                  const RoleIcon = roleConf.icon;
                  return (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.25rem 0.75rem', borderRadius: '20px',
                            background: roleConf.bg, color: roleConf.color,
                            fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize',
                          }}
                        >
                          <RoleIcon size={13} /> {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-badge--${u.is_active ? 'confirmed' : 'cancelled'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
