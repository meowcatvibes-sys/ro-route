import { useState, useEffect } from 'react';
import { driverAPI } from '../../services/api';
import { Bus, MapPin, Users, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';
import './DriverDashboard.css';

export default function DriverDashboard() {
  const [currentTrips, setCurrentTrips] = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [manifest, setManifest] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, confirm } = useToast();

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    try {
      const [curr, up] = await Promise.all([
        driverAPI.getTrips('current'),
        driverAPI.getTrips('upcoming'),
      ]);
      setCurrentTrips(curr.data.trips);
      setUpcomingTrips(up.data.trips);
      if (curr.data.trips.length > 0) {
        setActiveTrip(curr.data.trips[0]);
        const m = await driverAPI.getManifest(curr.data.trips[0].id);
        setManifest(m.data.passengers);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const updateStatus = async (scheduleId, status) => {
    const ok = await confirm(`Update trip status to "${status}"?`);
    if (!ok) return;
    try {
      await driverAPI.updateStatus(scheduleId, status);
      toast.success(`Trip status updated to "${status}"!`);
      fetchTrips();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update status'); }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const nextStatus = (current) => {
    const flow = { scheduled: 'boarding', boarding: 'departed', departed: 'in_transit', in_transit: 'arrived' };
    return flow[current] || null;
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="driver-dashboard">
      <div className="driver-dashboard__header">
        <h1>Driver Dashboard</h1>
        <p>Manage your current and upcoming trips</p>
      </div>

      {activeTrip ? (
        <div className="current-trip animate-fade-in-up">
          <div className="current-trip__header">
            <div className="current-trip__badge"><Bus size={16} /><span>Current Trip</span></div>
            <span className={`status-badge status-badge--${activeTrip.status}`}>{activeTrip.status.replace('_', ' ')}</span>
          </div>
          <div className="current-trip__details">
            <div className="current-trip__route">
              <MapPin size={20} className="current-trip__icon" />
              <div>
                <h2>{activeTrip.route === 'roxas_to_manila' ? 'Roxas City → Manila' : 'Manila → Roxas City'}</h2>
                <p>{activeTrip.bus_name} ({activeTrip.bus_type})</p>
              </div>
            </div>
            <div className="current-trip__meta">
              <div className="current-trip__meta-item"><Clock size={16} /><div><span className="label">Departure</span><span className="value">{formatTime(activeTrip.departure_time)}</span></div></div>
              <div className="current-trip__meta-item"><Clock size={16} /><div><span className="label">Arrival</span><span className="value">{formatTime(activeTrip.estimated_arrival)}</span></div></div>
              <div className="current-trip__meta-item"><Users size={16} /><div><span className="label">Passengers</span><span className="value">{activeTrip.passenger_count}/{activeTrip.total_seats}</span></div></div>
            </div>
          </div>
          <div className="current-trip__actions">
            {nextStatus(activeTrip.status) && (
              <button className="btn btn--primary" onClick={() => updateStatus(activeTrip.id, nextStatus(activeTrip.status))}>
                Update to: {nextStatus(activeTrip.status).replace('_', ' ')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="current-trip animate-fade-in-up" style={{ textAlign: 'center', padding: '3rem' }}>
          <Bus size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <h3>No active trip right now</h3>
          <p style={{ color: 'var(--text-muted)' }}>Your upcoming trips are listed below.</p>
        </div>
      )}

      {manifest.length > 0 && (
        <div className="dashboard-card animate-fade-in-up delay-200">
          <div className="dashboard-card__header"><h3>Passenger Manifest ({manifest.length})</h3></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Seat</th><th>Name</th><th>Phone</th><th>Payment</th></tr></thead>
              <tbody>
                {manifest.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.seat_number}</strong></td>
                    <td>{p.passenger_name}</td>
                    <td>{p.passenger_phone}</td>
                    <td><span className={`status-badge status-badge--${p.payment_status}`}>{p.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {upcomingTrips.length > 0 && (
        <div className="dashboard-card animate-fade-in-up delay-300" style={{ marginTop: 'var(--space-xl)' }}>
          <div className="dashboard-card__header"><h3>Upcoming Trips ({upcomingTrips.length})</h3></div>
          <div className="trips-list">
            {upcomingTrips.map((t, i) => (
              <div key={i} className="trip-item">
                <div className="trip-item__time">{formatTime(t.departure_time)}</div>
                <div className="trip-item__info">
                  <p className="trip-item__route">{t.route === 'roxas_to_manila' ? 'Roxas → Manila' : 'Manila → Roxas'}</p>
                  <p className="trip-item__details">{t.bus_name} · {t.departure_date}</p>
                </div>
                <div className="trip-item__seats">{t.passenger_count}/{t.total_seats}</div>
                <span className={`status-badge status-badge--${t.status}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
