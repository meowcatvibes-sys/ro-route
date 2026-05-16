import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schedulesAPI, bookingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Bus, MapPin, Clock, Calendar, Armchair,
  Snowflake, Sun, ArrowRight, User, CreditCard, CheckCircle
} from 'lucide-react';
import './TripDetail.css';

// Generate seat layout: 11 rows x 4 seats (2-2) + back row of 5
function generateSeats() {
  const seats = [];
  const cols = ['A', 'B', '', 'C', 'D']; // aisle in middle
  for (let row = 1; row <= 10; row++) {
    for (const col of cols) {
      if (col === '') { seats.push({ id: `aisle-${row}`, type: 'aisle' }); continue; }
      seats.push({ id: `${row}${col}`, type: 'seat', label: `${row}${col}` });
    }
  }
  // Back row: 5 seats
  ['A', 'B', 'C', 'D', 'E'].forEach(col => {
    seats.push({ id: `11${col}`, type: 'seat', label: `11${col}` });
  });
  return seats;
}

const ALL_SEATS = generateSeats();

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    try {
      const res = await schedulesAPI.show(id);
      setSchedule(res.data.schedule);
    } catch {
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const bookedSeatIds = schedule?.booked_seats?.map(s => s.seat_number) || [];

  const handleBook = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedSeat) { setError('Please select a seat'); return; }

    setBooking(true);
    setError('');
    try {
      const res = await bookingsAPI.create({
        schedule_id: parseInt(id),
        seat_number: selectedSeat,
        payment_method: paymentMethod,
      });
      setBookingResult(res.data.booking);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return (
    <div className="page-loader"><div className="spinner spinner--lg"></div><p>Loading trip...</p></div>
  );

  if (bookingResult) return (
    <div className="booking-success animate-fade-in-up">
      <div className="booking-success__card">
        <div className="booking-success__icon"><CheckCircle size={56} /></div>
        <h1>Booking Confirmed!</h1>
        <p className="booking-success__ref">Ref: <strong>{bookingResult.booking_ref}</strong></p>
        <div className="booking-success__details">
          <div><span>Route</span><strong>{bookingResult.route === 'roxas_to_manila' ? 'Roxas → Manila' : 'Manila → Roxas'}</strong></div>
          <div><span>Date</span><strong>{bookingResult.departure_date}</strong></div>
          <div><span>Time</span><strong>{formatTime(bookingResult.departure_time)}</strong></div>
          <div><span>Bus</span><strong>{bookingResult.bus_name}</strong></div>
          <div><span>Seat</span><strong>{bookingResult.seat_number}</strong></div>
          <div><span>Fare</span><strong>₱{parseFloat(bookingResult.amount_paid).toLocaleString()}</strong></div>
          <div><span>Payment</span><strong>{bookingResult.payment_method.toUpperCase()}</strong></div>
          <div><span>Status</span><strong className="text-success">{bookingResult.payment_status}</strong></div>
        </div>
        <div className="booking-success__actions">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/my-bookings')}>
            View My Bookings
          </button>
          <button className="btn btn--ghost btn--lg" onClick={() => navigate('/schedules')}>
            Book Another Trip
          </button>
        </div>
      </div>
    </div>
  );

  if (!schedule) return (
    <div className="page-loader"><p>Trip not found</p></div>
  );

  return (
    <div className="trip-detail">
      <div className="trip-detail__container">
        {/* Trip Info */}
        <div className="trip-detail__info animate-fade-in-up">
          <div className="trip-detail__route-header">
            <div className="trip-detail__route">
              <MapPin size={20} />
              <h1>
                {schedule.route === 'roxas_to_manila' ? 'Roxas City' : 'Manila'}
                <ArrowRight size={20} className="trip-detail__arrow" />
                {schedule.route === 'roxas_to_manila' ? 'Manila' : 'Roxas City'}
              </h1>
            </div>
            <div className="trip-detail__badge">
              {schedule.bus_type === 'aircon' ? <Snowflake size={14} /> : <Sun size={14} />}
              {schedule.bus_type === 'aircon' ? 'Aircon' : 'Non-Aircon'}
            </div>
          </div>

          <div className="trip-detail__meta">
            <div className="trip-meta-item">
              <Calendar size={16} /><div><span>Date</span><strong>{schedule.departure_date}</strong></div>
            </div>
            <div className="trip-meta-item">
              <Clock size={16} /><div><span>Departure</span><strong>{formatTime(schedule.departure_time)}</strong></div>
            </div>
            <div className="trip-meta-item">
              <Clock size={16} /><div><span>Arrival</span><strong>{formatTime(schedule.estimated_arrival)}</strong></div>
            </div>
            <div className="trip-meta-item">
              <Bus size={16} /><div><span>Bus</span><strong>{schedule.bus_name}</strong></div>
            </div>
            <div className="trip-meta-item">
              <User size={16} /><div><span>Driver</span><strong>{schedule.driver_name}</strong></div>
            </div>
            <div className="trip-meta-item">
              <Armchair size={16} /><div><span>Available</span><strong>{schedule.available_seats} / {schedule.total_seats}</strong></div>
            </div>
          </div>
        </div>

        <div className="trip-detail__grid">
          {/* Seat Map */}
          <div className="seat-map animate-fade-in-up delay-200">
            <h2>Select Your Seat</h2>
            <div className="seat-map__legend">
              <div className="seat-legend"><div className="seat-sample seat-sample--available"></div><span>Available</span></div>
              <div className="seat-legend"><div className="seat-sample seat-sample--selected"></div><span>Selected</span></div>
              <div className="seat-legend"><div className="seat-sample seat-sample--taken"></div><span>Taken</span></div>
            </div>

            <div className="seat-map__bus">
              <div className="seat-map__front">
                <div className="seat-map__driver"><Bus size={18} /> Driver</div>
              </div>
              <div className="seat-map__grid">
                {ALL_SEATS.map((seat) => {
                  if (seat.type === 'aisle') return <div key={seat.id} className="seat-aisle"></div>;
                  const isTaken = bookedSeatIds.includes(seat.label);
                  const isSelected = selectedSeat === seat.label;
                  return (
                    <button
                      key={seat.id}
                      className={`seat ${isTaken ? 'seat--taken' : ''} ${isSelected ? 'seat--selected' : ''}`}
                      disabled={isTaken}
                      onClick={() => setSelectedSeat(isSelected ? null : seat.label)}
                      title={isTaken ? 'Taken' : seat.label}
                    >
                      {seat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking Panel */}
          <div className="booking-panel animate-fade-in-up delay-300">
            <h2>Booking Summary</h2>

            <div className="booking-panel__summary">
              <div className="booking-panel__row">
                <span>Route</span>
                <strong>{schedule.route === 'roxas_to_manila' ? 'Roxas → Manila' : 'Manila → Roxas'}</strong>
              </div>
              <div className="booking-panel__row">
                <span>Date & Time</span>
                <strong>{schedule.departure_date} · {formatTime(schedule.departure_time)}</strong>
              </div>
              <div className="booking-panel__row">
                <span>Bus</span>
                <strong>{schedule.bus_name}</strong>
              </div>
              <div className="booking-panel__row highlight">
                <span>Seat</span>
                <strong>{selectedSeat || '—'}</strong>
              </div>
              <div className="booking-panel__divider"></div>
              <div className="booking-panel__row total">
                <span>Total Fare</span>
                <strong>₱{parseFloat(schedule.fare).toLocaleString()}</strong>
              </div>
            </div>

            <div className="booking-panel__payment">
              <label>Payment Method</label>
              <div className="payment-options">
                {['gcash', 'maya', 'cash'].map(m => (
                  <button
                    key={m}
                    className={`payment-option ${paymentMethod === m ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(m)}
                  >
                    <CreditCard size={16} />
                    {m === 'gcash' ? 'GCash' : m === 'maya' ? 'Maya' : 'Cash (at terminal)'}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="auth-error animate-fade-in" style={{ marginTop: 12 }}><span>{error}</span></div>}

            <button
              className="btn btn--primary btn--full btn--lg"
              disabled={!selectedSeat || booking}
              onClick={handleBook}
            >
              {booking ? <div className="spinner" /> : `Book Seat ${selectedSeat || ''} — ₱${parseFloat(schedule.fare).toLocaleString()}`}
            </button>

            {!isAuthenticated && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12 }}>
                You need to <a href="/login" style={{ color: 'var(--primary)' }}>log in</a> to book a trip.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
