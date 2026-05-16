import { useState, useEffect } from 'react';
import { bookingsAPI } from '../../services/api';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import './AdminCrud.css';

const ROWS_PER_PAGE = 10;

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const r = await bookingsAPI.list(); setBookings(r.data.bookings); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  // Filter + Search
  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.bus_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.passenger_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.seat_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div><h1>Booking Management</h1><p>{filtered.length} of {bookings.length} bookings</p></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="dashboard-card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by ref, bus, passenger, seat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.9rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Route</th><th>Date</th><th>Time</th><th>Bus</th><th>Seat</th><th>Amount</th><th>Payment</th><th>Status</th></tr></thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No bookings found</td></tr>
              ) : (
                paginated.map(b => (
                  <tr key={b.id}>
                    <td><code>{b.booking_ref}</code></td>
                    <td>{b.route === 'roxas_to_manila' ? 'Roxas→MNL' : 'MNL→Roxas'}</td>
                    <td>{b.departure_date}</td>
                    <td>{formatTime(b.departure_time)}</td>
                    <td>{b.bus_name}</td>
                    <td><strong>{b.seat_number}</strong></td>
                    <td>₱{parseFloat(b.amount_paid).toLocaleString()}</td>
                    <td><span className={`status-badge status-badge--${b.payment_status}`}>{b.payment_method} ({b.payment_status})</span></td>
                    <td><span className={`status-badge status-badge--${b.status}`}>{b.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn--ghost btn--sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                Math.max(0, page - 3), Math.min(totalPages, page + 2)
              ).map(p => (
                <button
                  key={p}
                  className={`btn btn--sm ${p === page ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setPage(p)}
                  style={{ minWidth: '36px' }}
                >
                  {p}
                </button>
              ))}
              <button
                className="btn btn--ghost btn--sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
