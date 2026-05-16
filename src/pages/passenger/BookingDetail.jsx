import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { formatTime, formatCurrency, formatRouteLabel } from '../../utils/helpers';
import {
  Bus, MapPin, Calendar, Clock, Armchair,
  CreditCard, Printer, Download, ArrowLeft, CheckCircle, XCircle
} from 'lucide-react';
import { useToast } from '../../components/Toast';
import './BookingDetail.css';

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef(null);
  const { toast, confirm } = useToast();

  useEffect(() => { fetchBooking(); }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await bookingsAPI.show(id);
      setBooking(res.data.booking);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const ok = await confirm('Cancel this booking? This action cannot be undone.');
    if (!ok) return;
    try {
      await bookingsAPI.cancel(booking.id);
      toast.success('Booking cancelled successfully!');
      fetchBooking();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const handlePrint = () => {
    const printContent = ticketRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>E-Ticket - ${booking.booking_ref}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; }
            .ticket { max-width: 500px; margin: 0 auto; border: 2px solid #1e293b; border-radius: 16px; overflow: hidden; }
            .ticket-header { background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 24px; text-align: center; }
            .ticket-header h1 { font-size: 24px; margin-bottom: 4px; }
            .ticket-header p { opacity: 0.7; font-size: 14px; }
            .ticket-body { padding: 24px; }
            .ticket-route { display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 18px; font-weight: 700; padding: 16px; margin-bottom: 16px; background: #f8fafc; border-radius: 8px; }
            .ticket-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
            .ticket-field { }
            .ticket-field span { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
            .ticket-field strong { font-size: 15px; color: #0f172a; }
            .ticket-qr { text-align: center; padding: 20px; border-top: 2px dashed #e2e8f0; }
            .ticket-qr p { font-size: 12px; color: #64748b; margin-top: 8px; }
            .ticket-ref { text-align: center; font-family: monospace; font-size: 18px; font-weight: 700; color: #2563eb; margin: 12px 0; }
            .ticket-footer { text-align: center; padding: 12px; background: #f8fafc; font-size: 11px; color: #94a3b8; }
            .status-ok { color: #059669; font-weight: 600; }
            .status-cancel { color: #dc2626; font-weight: 600; }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
        <script>setTimeout(()=>window.print(),200);</script>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <div className="page-loader"><div className="spinner spinner--lg"></div><p>Loading booking...</p></div>
  );

  if (!booking) return (
    <div className="page-loader"><p>Booking not found</p></div>
  );

  const qrData = JSON.stringify({
    ref: booking.booking_ref,
    passenger: booking.passenger_name,
    route: booking.route,
    date: booking.departure_date,
    seat: booking.seat_number,
    status: booking.status,
  });

  return (
    <div className="booking-detail">
      <div className="booking-detail__actions-top">
        <Link to="/my-bookings" className="btn btn--ghost"><ArrowLeft size={18} /> Back to Bookings</Link>
        <div className="booking-detail__action-btns">
          {booking.status === 'confirmed' && (
            <button className="btn btn--ghost btn--danger" onClick={handleCancel}><XCircle size={16} /> Cancel Booking</button>
          )}
          <button className="btn btn--primary" onClick={handlePrint}><Printer size={16} /> Print E-Ticket</button>
        </div>
      </div>

      {/* E-Ticket */}
      <div className="eticket-wrapper animate-fade-in-up">
        <div className="eticket" ref={ticketRef}>
          <div className="ticket">
            <div className="ticket-header">
              <h1>🚌 Ro-Route</h1>
              <p>Roxas–Manila Integrated Travel Portal</p>
            </div>
            <div className="ticket-body">
              <div className="ticket-route">
                {booking.route === 'roxas_to_manila' ? 'Roxas City' : 'Manila'}
                &nbsp; → &nbsp;
                {booking.route === 'roxas_to_manila' ? 'Manila' : 'Roxas City'}
              </div>

              <div className="ticket-ref">{booking.booking_ref}</div>

              <div className="ticket-grid">
                <div className="ticket-field">
                  <span>Passenger</span>
                  <strong>{booking.passenger_name}</strong>
                </div>
                <div className="ticket-field">
                  <span>Date</span>
                  <strong>{booking.departure_date}</strong>
                </div>
                <div className="ticket-field">
                  <span>Departure</span>
                  <strong>{formatTime(booking.departure_time)}</strong>
                </div>
                <div className="ticket-field">
                  <span>Arrival</span>
                  <strong>{formatTime(booking.estimated_arrival)}</strong>
                </div>
                <div className="ticket-field">
                  <span>Bus</span>
                  <strong>{booking.bus_name} ({booking.bus_type})</strong>
                </div>
                <div className="ticket-field">
                  <span>Seat Number</span>
                  <strong style={{ fontSize: '1.4rem' }}>{booking.seat_number}</strong>
                </div>
                <div className="ticket-field">
                  <span>Fare Paid</span>
                  <strong>{formatCurrency(booking.amount_paid)}</strong>
                </div>
                <div className="ticket-field">
                  <span>Payment</span>
                  <strong>{booking.payment_method?.toUpperCase()}</strong>
                </div>
                <div className="ticket-field">
                  <span>Status</span>
                  <strong className={booking.status === 'cancelled' ? 'status-cancel' : 'status-ok'}>
                    {booking.status?.toUpperCase()}
                  </strong>
                </div>
                <div className="ticket-field">
                  <span>Payment Status</span>
                  <strong className={booking.payment_status === 'paid' ? 'status-ok' : 'status-cancel'}>
                    {booking.payment_status?.toUpperCase()}
                  </strong>
                </div>
              </div>

              <div className="ticket-qr">
                <QRCodeSVG value={qrData} size={160} level="H" includeMargin />
                <p>Scan QR code at terminal for verification</p>
              </div>
            </div>
            <div className="ticket-footer">
              Ro-Route Travel Portal &bull; Capstone Project 2026 &bull; Present this ticket at the terminal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
