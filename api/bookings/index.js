import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const sql = getDB();

  try {
    let bookings;

    if (user.role === 'passenger') {
      bookings = await sql`
        SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
               b.bus_name, b.plate_number, b.bus_type
        FROM bookings bk
        JOIN schedules s ON bk.schedule_id = s.id
        JOIN buses b ON s.bus_id = b.id
        WHERE bk.user_id = ${user.id}
        ORDER BY bk.created_at DESC
      `;
    } else {
      const { status, date } = req.query || {};
      if (status && date) {
        bookings = await sql`
          SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
                 b.bus_name, b.plate_number, b.bus_type
          FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id
          WHERE bk.status = ${status} AND s.departure_date = ${date} ORDER BY bk.created_at DESC
        `;
      } else if (status) {
        bookings = await sql`
          SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
                 b.bus_name, b.plate_number, b.bus_type
          FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id
          WHERE bk.status = ${status} ORDER BY bk.created_at DESC
        `;
      } else if (date) {
        bookings = await sql`
          SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
                 b.bus_name, b.plate_number, b.bus_type
          FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id
          WHERE s.departure_date = ${date} ORDER BY bk.created_at DESC
        `;
      } else {
        bookings = await sql`
          SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status,
                 b.bus_name, b.plate_number, b.bus_type
          FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id
          ORDER BY bk.created_at DESC
        `;
      }
    }

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Bookings list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
