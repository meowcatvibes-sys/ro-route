import { useState, useEffect } from 'react';
import { driverAPI } from '../../services/api';
import { Bus, MapPin, Clock, Users, Calendar } from 'lucide-react';
import './DriverDashboard.css';

export default function DriverTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const r = await driverAPI.getTrips('upcoming');
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
        <h1>My Trips</h1>
        <p>All your upcoming scheduled trips</p>
      </div>

      {trips.length === 0 ? (
        <div className="current-trip animate-fade-in-up" style={{ textAlign: 'center', padding: '3rem' }}>
          <Calendar size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>No upcoming trips</h3>
          <p style={{ color: 'var(--text-muted)' }}>You don't have any scheduled trips at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {trips.map((t, i) => (
            <div key={i} className="current-trip animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="current-trip__header">
                <div className="current-trip__badge"><Bus size={16} /><span>{t.bus_name} ({t.bus_type})</span></div>
                <span className={`status-badge status-badge--${t.status}`}>{t.status}</span>
              </div>
              <div className="current-trip__details">
                <div className="current-trip__route">
                  <MapPin size={20} className="current-trip__icon" />
                  <div>
                    <h2 style={{ fontSize: '1.1rem' }}>{t.route === 'roxas_to_manila' ? 'Roxas City → Manila' : 'Manila → Roxas City'}</h2>
                    <p>{t.plate_number}</p>
                  </div>
                </div>
                <div className="current-trip__meta">
                  <div className="current-trip__meta-item"><Calendar size={16} /><div><span className="label">Date</span><span className="value">{formatDate(t.departure_date)}</span></div></div>
                  <div className="current-trip__meta-item"><Clock size={16} /><div><span className="label">Departure</span><span className="value">{formatTime(t.departure_time)}</span></div></div>
                  <div className="current-trip__meta-item"><Clock size={16} /><div><span className="label">Arrival</span><span className="value">{formatTime(t.estimated_arrival)}</span></div></div>
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
