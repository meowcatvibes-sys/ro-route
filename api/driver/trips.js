import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['driver']);
  if (!user) return;

  const sql = getDB();

  try {
    const driverRows = await sql`SELECT id FROM drivers WHERE user_id = ${user.id}`;
    if (driverRows.length === 0) return res.status(404).json({ error: 'Driver profile not found' });
    const driverId = driverRows[0].id;

    if (req.method === 'GET') {
      const type = req.query.type || 'upcoming';

      let trips;
      if (type === 'current') {
        trips = await sql`
          SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
                 COALESCE(booked.count, 0) AS passenger_count
          FROM schedules s JOIN buses b ON s.bus_id = b.id
          LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
          WHERE s.driver_id = ${driverId} AND s.status IN ('boarding', 'departed', 'in_transit')
          ORDER BY s.departure_date ASC, s.departure_time ASC
        `;
      } else if (type === 'history') {
        trips = await sql`
          SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
                 COALESCE(booked.count, 0) AS passenger_count
          FROM schedules s JOIN buses b ON s.bus_id = b.id
          LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
          WHERE s.driver_id = ${driverId} AND s.status IN ('arrived', 'cancelled')
          ORDER BY s.departure_date ASC, s.departure_time ASC
        `;
      } else {
        trips = await sql`
          SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
                 COALESCE(booked.count, 0) AS passenger_count
          FROM schedules s JOIN buses b ON s.bus_id = b.id
          LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
          WHERE s.driver_id = ${driverId} AND s.status = 'scheduled'
          ORDER BY s.departure_date ASC, s.departure_time ASC
        `;
      }

      return res.status(200).json({ trips });
    }

    if (req.method === 'POST') {
      const { schedule_id, status: newStatus } = req.body || {};
      const validStatuses = ['boarding', 'departed', 'in_transit', 'arrived'];

      if (!validStatuses.includes(newStatus)) return res.status(400).json({ error: 'Invalid status' });

      const check = await sql`SELECT id FROM schedules WHERE id = ${schedule_id} AND driver_id = ${driverId}`;
      if (check.length === 0) return res.status(403).json({ error: 'Trip not found or not assigned to you' });

      await sql`UPDATE schedules SET status = ${newStatus}, updated_at = NOW() WHERE id = ${schedule_id}`;

      if (newStatus === 'arrived') {
        await sql`UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE schedule_id = ${schedule_id} AND status = 'confirmed'`;
      }

      return res.status(200).json({ message: 'Trip status updated to ' + newStatus });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Driver trips error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
