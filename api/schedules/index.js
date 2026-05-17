import { getDB } from '../_lib/db.js';
import { cors } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDB();
  const { route, date, bus_type } = req.query || {};

  try {
    let schedules;

    if (route && route !== 'all' && date && bus_type && bus_type !== 'all') {
      schedules = await sql`
        SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
               u.name AS driver_name,
               (b.total_seats - COALESCE(booked.count, 0)) AS available_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.status != 'cancelled' AND s.route = ${route} AND s.departure_date = ${date} AND b.bus_type = ${bus_type}
        ORDER BY s.departure_date ASC, s.departure_time ASC
      `;
    } else if (route && route !== 'all' && date) {
      schedules = await sql`
        SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
               u.name AS driver_name,
               (b.total_seats - COALESCE(booked.count, 0)) AS available_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.status != 'cancelled' AND s.route = ${route} AND s.departure_date = ${date}
        ORDER BY s.departure_date ASC, s.departure_time ASC
      `;
    } else if (route && route !== 'all') {
      schedules = await sql`
        SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
               u.name AS driver_name,
               (b.total_seats - COALESCE(booked.count, 0)) AS available_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.status != 'cancelled' AND s.route = ${route}
        ORDER BY s.departure_date ASC, s.departure_time ASC
      `;
    } else if (date) {
      schedules = await sql`
        SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
               u.name AS driver_name,
               (b.total_seats - COALESCE(booked.count, 0)) AS available_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.status != 'cancelled' AND s.departure_date = ${date}
        ORDER BY s.departure_date ASC, s.departure_time ASC
      `;
    } else {
      schedules = await sql`
        SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats,
               u.name AS driver_name,
               (b.total_seats - COALESCE(booked.count, 0)) AS available_seats
        FROM schedules s
        JOIN buses b ON s.bus_id = b.id
        JOIN drivers d ON s.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
        WHERE s.status != 'cancelled'
        ORDER BY s.departure_date ASC, s.departure_time ASC
      `;
    }

    return res.status(200).json({ schedules });
  } catch (err) {
    console.error('Schedules error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
