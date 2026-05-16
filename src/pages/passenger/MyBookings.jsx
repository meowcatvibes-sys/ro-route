import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { Bus, Calendar, Clock, MapPin, ArrowRight, Ticket, XCircle, Eye } from 'lucide-react';
import { useToast } from '../../components/Toast';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, confirm } = useToast();

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await bookingsAPI.list();
      setBookings(res.data.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const ok = await confirm('Are you sure you want to cancel this booking?');
    if (!ok) return;
    try {
      await bookingsAPI.cancel(id);
      toast.success('Booking cancelled successfully!');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return (
    <div className="page-loader"><div className="spinner spinner--lg"></div><p>Loading bookings...</p></div>
  );

  return (
    <div className="my-bookings">
      <div className="my-bookings__header animate-fade-in-up">
        <h1>My Bookings</h1>
        <p>View and manage your bus trip reservations</p>
      </div>

      {bookings.length === 0 ? (
        <div className="my-bookings__empty animate-fade-in">
          <Ticket size={48} />
          <h3>No bookings yet</h3>
          <p>Book your first trip and it will appear here.</p>
          <Link to="/schedules" className="btn btn--primary">Browse Schedules</Link>
        </div>
      ) : (
        <div className="my-bookings__list">
          {bookings.map((b, i) => (
            <div key={b.id} className="booking-card animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="booking-card__left">
                <div className="booking-card__route">
                  <MapPin size={16} />
                  <span>{b.route === 'roxas_to_manila' ? 'Roxas City' : 'Manila'}</span>
                  <ArrowRight size={14} />
                  <span>{b.route === 'roxas_to_manila' ? 'Manila' : 'Roxas City'}</span>
                </div>
                <div className="booking-card__meta">
                  <span><Calendar size={14} /> {b.departure_date}</span>
                  <span><Clock size={14} /> {formatTime(b.departure_time)}</span>
                  <span><Bus size={14} /> {b.bus_name}</span>
                </div>
              </div>
              <div className="booking-card__center">
                <div className="booking-card__ref">{b.booking_ref}</div>
                <div className="booking-card__seat">Seat <strong>{b.seat_number}</strong></div>
              </div>
              <div className="booking-card__right">
                <div className="booking-card__fare">₱{parseFloat(b.amount_paid).toLocaleString()}</div>
                <span className={`status-badge status-badge--${b.status}`}>{b.status}</span>
                <div className="booking-card__actions">
                  <Link to={`/my-bookings/${b.id}`} className="btn btn--primary btn--sm">
                    <Eye size={14} /> View Ticket
                  </Link>
                  {b.status === 'confirmed' && (
                    <button className="btn btn--ghost btn--sm" onClick={() => handleCancel(b.id)}>
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
