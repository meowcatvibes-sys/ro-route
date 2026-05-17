import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;

  const sql = getDB();

  try {
    if (req.method === 'GET') {
      const schedules = await sql`
        SELECT s.*, b.bus_name, b.bus_type, b.total_seats, u.name AS driver_name,
               COALESCE(booked.count, 0) AS booked_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.deleted_at IS NULL
        ORDER BY s.departure_date DESC, s.departure_time ASC
      `;
      return res.status(200).json({ schedules });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action || 'create';

      if (action === 'create') {
        const result = await sql`
          INSERT INTO schedules (bus_id, driver_id, route, departure_date, departure_time, estimated_arrival, fare, status)
          VALUES (${body.bus_id}, ${body.driver_id}, ${body.route}, ${body.departure_date}, ${body.departure_time}, ${body.estimated_arrival || null}, ${body.fare}, ${body.status || 'scheduled'})
          RETURNING id
        `;
        return res.status(201).json({ message: 'Schedule created', id: result[0].id });
      }

      if (action === 'update') {
        await sql`UPDATE schedules SET bus_id=${body.bus_id}, driver_id=${body.driver_id}, route=${body.route}, departure_date=${body.departure_date}, departure_time=${body.departure_time}, estimated_arrival=${body.estimated_arrival}, fare=${body.fare}, status=${body.status}, updated_at=NOW() WHERE id=${body.id}`;
        return res.status(200).json({ message: 'Schedule updated' });
      }

      if (action === 'delete') {
        await sql`UPDATE schedules SET deleted_at = NOW() WHERE id = ${body.id}`;
        return res.status(200).json({ message: 'Schedule archived' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin schedules error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
