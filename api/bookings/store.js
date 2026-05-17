import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireAuth(req, res, ['passenger']);
  if (!user) return;

  const { schedule_id, seat_number, payment_method = 'cash' } = req.body || {};
  if (!schedule_id || !seat_number) return res.status(422).json({ error: 'Schedule ID and seat number are required' });

  const sql = getDB();

  try {
    const schedules = await sql`
      SELECT s.*, b.total_seats FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      WHERE s.id = ${schedule_id} AND s.status IN ('scheduled', 'boarding')
    `;
    if (schedules.length === 0) return res.status(400).json({ error: 'Schedule not available for booking' });

    const schedule = schedules[0];

    const seatCheck = await sql`
      SELECT id FROM bookings WHERE schedule_id = ${schedule_id} AND seat_number = ${seat_number} AND status != 'cancelled'
    `;
    if (seatCheck.length > 0) return res.status(409).json({ error: 'Seat is already taken' });

    const bookingRef = 'RR-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const paymentStatus = payment_method === 'cash' ? 'pending' : 'paid';

    const result = await sql`
      INSERT INTO bookings (booking_ref, user_id, schedule_id, seat_number, amount_paid, payment_method, payment_status, status)
      VALUES (${bookingRef}, ${user.id}, ${schedule_id}, ${seat_number}, ${schedule.fare}, ${payment_method}, ${paymentStatus}, 'confirmed')
      RETURNING id
    `;

    const bookingId = result[0].id;

    const bookings = await sql`
      SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival,
             b.bus_name, b.plate_number, b.bus_type, u.name AS passenger_name, u.email, u.phone
      FROM bookings bk
      JOIN schedules s ON bk.schedule_id = s.id
      JOIN buses b ON s.bus_id = b.id
      JOIN users u ON bk.user_id = u.id
      WHERE bk.id = ${bookingId}
    `;

    return res.status(201).json({ booking: bookings[0], message: 'Booking created successfully' });
  } catch (err) {
    console.error('Store booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
