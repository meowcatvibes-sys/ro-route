import { getDB } from '../_lib/db.js';
import { cors } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Schedule ID required' });

  const sql = getDB();

  try {
    const schedules = await sql`
      SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
             u.name AS driver_name
      FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      JOIN drivers d ON s.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE s.id = ${id}
    `;

    if (schedules.length === 0) return res.status(404).json({ error: 'Schedule not found' });

    const schedule = schedules[0];

    const bookedSeats = await sql`
      SELECT bk.seat_number, bk.user_id, u.name AS passenger_name
      FROM bookings bk
      JOIN users u ON bk.user_id = u.id
      WHERE bk.schedule_id = ${id} AND bk.status != 'cancelled'
    `;

    schedule.booked_seats = bookedSeats;
    schedule.available_seats = schedule.total_seats - bookedSeats.length;

    return res.status(200).json({ schedule });
  } catch (err) {
    console.error('Schedule show error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
