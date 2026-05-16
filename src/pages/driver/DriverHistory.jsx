import { useState, useEffect } from 'react';
import { driverAPI } from '../../services/api';
import { Bus, MapPin, Clock, Users, Calendar, CheckCircle, XCircle, History } from 'lucide-react';
import './DriverDashboard.css';

export default function DriverHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const r = await driverAPI.getTrips('history');
      setTrips(r.data.trips);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="driver-dashboard">
      <div className="driver-dashboard__header">
        <h1>Trip History</h1>
        <p>Your completed and cancelled trips</p>
      </div>

      {trips.length === 0 ? (
        <div className="current-trip animate-fade-in-up" style={{ textAlign: 'center', padding: '3rem' }}>
          <History size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>No trip history yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Completed and cancelled trips will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trips.map((t, i) => (
            <div key={i} className="current-trip animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="current-trip__header">
                <div className="current-trip__badge">
                  {t.status === 'arrived' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span>{t.bus_name}</span>
                </div>
                <span className={`status-badge status-badge--${t.status === 'arrived' ? 'confirmed' : 'cancelled'}`}>
                  {t.status === 'arrived' ? 'Completed' : 'Cancelled'}
                </span>
              </div>
              <div className="current-trip__details">
                <div className="current-trip__route">
                  <MapPin size={20} className="current-trip__icon" />
                  <div>
                    <h2 style={{ fontSize: '1.1rem' }}>{t.route === 'roxas_to_manila' ? 'Roxas City → Manila' : 'Manila → Roxas City'}</h2>
                    <p>{t.plate_number} · {t.bus_type}</p>
                  </div>
                </div>
                <div className="current-trip__meta">
                  <div className="current-trip__meta-item"><Calendar size={16} /><div><span className="label">Date</span><span className="value">{formatDate(t.departure_date)}</span></div></div>
                  <div className="current-trip__meta-item"><Clock size={16} /><div><span className="label">Departure</span><span className="value">{formatTime(t.departure_time)}</span></div></div>
                  <div className="current-trip__meta-item"><Users size={16} /><div><span className="label">Passengers</span><span className="value">{t.passenger_count}/{t.total_seats}</span></div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
