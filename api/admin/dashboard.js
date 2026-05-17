import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;

  const sql = getDB();
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [todayBookings] = await sql`SELECT COUNT(*) AS count FROM bookings WHERE DATE(created_at) = ${today}`;
    const [todayRevenue] = await sql`SELECT COALESCE(SUM(amount_paid), 0) AS total FROM bookings WHERE DATE(created_at) = ${today} AND payment_status = 'paid'`;
    const [activeTrips] = await sql`SELECT COUNT(*) AS count FROM schedules WHERE departure_date = ${today} AND status IN ('boarding', 'departed', 'in_transit')`;
    const [totalUsers] = await sql`SELECT COUNT(*) AS count FROM users WHERE role = 'passenger'`;
    const [activeBuses] = await sql`SELECT COUNT(*) AS count FROM buses WHERE status = 'active'`;
    const [activeDrivers] = await sql`SELECT COUNT(*) AS count FROM drivers WHERE status = 'active'`;

    const recentBookings = await sql`
      SELECT bk.*, u.name AS passenger_name, s.route, s.departure_date
      FROM bookings bk JOIN users u ON bk.user_id = u.id JOIN schedules s ON bk.schedule_id = s.id
      ORDER BY bk.created_at DESC LIMIT 10
    `;

    const todayTrips = await sql`
      SELECT s.*, b.bus_name, u.name AS driver_name,
             (b.total_seats - COALESCE(booked.count, 0)) AS available_seats, b.total_seats
      FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      JOIN drivers d ON s.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id
      WHERE s.departure_date = ${today}
      ORDER BY s.departure_time ASC
    `;

    return res.status(200).json({
      stats: {
        today_bookings: parseInt(todayBookings.count),
        today_revenue: parseFloat(todayRevenue.total),
        active_trips: parseInt(activeTrips.count),
        total_users: parseInt(totalUsers.count),
        active_buses: parseInt(activeBuses.count),
        active_drivers: parseInt(activeDrivers.count),
      },
      recent_bookings: recentBookings,
      today_trips: todayTrips,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
