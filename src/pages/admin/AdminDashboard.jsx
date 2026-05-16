import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  Users, Bus, Calendar, CreditCard,
  TrendingUp, ArrowUpRight, Clock
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await adminAPI.dashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return (
    <div className="page-loader"><div className="spinner spinner--lg"></div><p>Loading dashboard...</p></div>
  );

  if (!data) return <div className="page-loader"><p>Failed to load dashboard</p></div>;

  const stats = [
    { label: 'Bookings Today', value: data.stats.today_bookings, icon: CreditCard, color: 'var(--primary)' },
    { label: 'Active Trips', value: data.stats.active_trips, icon: Bus, color: 'var(--driver)' },
    { label: 'Registered Users', value: data.stats.total_users, icon: Users, color: '#8B5CF6' },
    { label: 'Revenue Today', value: `₱${data.stats.today_revenue.toLocaleString()}`, icon: TrendingUp, color: 'var(--accent)' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of today's operations</p>
        </div>
        <div className="admin-dashboard__date">
          <Clock size={16} />
          <span>{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="stat-card__icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={22} />
            </div>
            <div className="stat-card__info">
              <p className="stat-card__label">{stat.label}</p>
              <p className="stat-card__value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard__grid">
        {/* Recent Bookings */}
        <div className="dashboard-card animate-fade-in-up delay-300">
          <div className="dashboard-card__header">
            <h3>Recent Bookings</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Seat</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_bookings.map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.booking_ref}</code></td>
                    <td>{b.passenger_name}</td>
                    <td>{b.route === 'roxas_to_manila' ? 'Roxas→MNL' : 'MNL→Roxas'}</td>
                    <td>{b.seat_number}</td>
                    <td>₱{parseFloat(b.amount_paid).toLocaleString()}</td>
                    <td><span className={`status-badge status-badge--${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Trips */}
        <div className="dashboard-card animate-fade-in-up delay-400">
          <div className="dashboard-card__header">
            <h3>Today's Trips</h3>
          </div>
          <div className="trips-list">
            {data.today_trips.length === 0 ? (
              <p style={{ padding: 'var(--space-lg)', color: 'var(--text-muted)', textAlign: 'center' }}>No trips today</p>
            ) : data.today_trips.map((trip, i) => (
              <div key={i} className="trip-item">
                <div className="trip-item__time">{formatTime(trip.departure_time)}</div>
                <div className="trip-item__info">
                  <p className="trip-item__route">{trip.route === 'roxas_to_manila' ? 'Roxas → Manila' : 'Manila → Roxas'}</p>
                  <p className="trip-item__details">{trip.bus_name} · {trip.driver_name}</p>
                </div>
                <div className="trip-item__seats">{trip.total_seats - trip.available_seats}/{trip.total_seats}</div>
                <span className={`status-badge status-badge--${trip.status}`}>{trip.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
