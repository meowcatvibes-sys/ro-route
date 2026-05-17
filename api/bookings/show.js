import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Booking ID required' });

  const sql = getDB();

  try {
    const bookings = await sql`
      SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
             b.bus_name, b.plate_number, b.bus_type,
             u.name AS passenger_name, u.email AS passenger_email, u.phone AS passenger_phone
      FROM bookings bk
      JOIN schedules s ON bk.schedule_id = s.id
      JOIN buses b ON s.bus_id = b.id
      JOIN users u ON bk.user_id = u.id
      WHERE bk.id = ${id}
    `;

    if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found' });

    const booking = bookings[0];
    if (user.role === 'passenger' && booking.user_id !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json({ booking });
  } catch (err) {
    console.error('Booking show error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
