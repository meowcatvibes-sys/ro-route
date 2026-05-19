import { getDB } from '../db.js';
import { requireAuth } from '../auth.js';
import bcrypt from 'bcryptjs';

export async function dashboard(req, res) {
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
    const recentBookings = await sql`SELECT bk.*, u.name AS passenger_name, s.route, s.departure_date FROM bookings bk JOIN users u ON bk.user_id = u.id JOIN schedules s ON bk.schedule_id = s.id ORDER BY bk.created_at DESC LIMIT 10`;
    const todayTrips = await sql`SELECT s.*, b.bus_name, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats, b.total_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.departure_date = ${today} ORDER BY s.departure_time ASC`;
    return res.status(200).json({ stats: { today_bookings: parseInt(todayBookings.count), today_revenue: parseFloat(todayRevenue.total), active_trips: parseInt(activeTrips.count), total_users: parseInt(totalUsers.count), active_buses: parseInt(activeBuses.count), active_drivers: parseInt(activeDrivers.count) }, recent_bookings: recentBookings, today_trips: todayTrips });
  } catch (err) { console.error('Dashboard error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function buses(req, res) {
  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;
  const sql = getDB();
  try {
    if (req.method === 'GET') {
      const buses = await sql`SELECT * FROM buses WHERE deleted_at IS NULL ORDER BY id ASC`;
      return res.status(200).json({ buses });
    }
    if (req.method === 'POST') {
      const { action = 'create', id, bus_name, plate_number, bus_type = 'aircon', total_seats = 45, status = 'active' } = req.body || {};
      if (action === 'create') { const result = await sql`INSERT INTO buses (bus_name, plate_number, bus_type, total_seats, status) VALUES (${bus_name}, ${plate_number}, ${bus_type}, ${total_seats}, ${status}) RETURNING id`; return res.status(201).json({ message: 'Bus created', id: result[0].id }); }
      if (action === 'update') { await sql`UPDATE buses SET bus_name=${bus_name}, plate_number=${plate_number}, bus_type=${bus_type}, total_seats=${total_seats}, status=${status}, updated_at=NOW() WHERE id=${id}`; return res.status(200).json({ message: 'Bus updated' }); }
      if (action === 'delete') { await sql`UPDATE buses SET deleted_at = NOW() WHERE id = ${id}`; return res.status(200).json({ message: 'Bus archived' }); }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('Buses error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function drivers(req, res) {
  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;
  const sql = getDB();
  try {
    if (req.method === 'GET') {
      const driversList = await sql`SELECT d.*, u.name, u.email, u.phone FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.deleted_at IS NULL ORDER BY d.id ASC`;
      return res.status(200).json({ drivers: driversList });
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action || 'create';
      if (action === 'create') {
        const hashed = bcrypt.hashSync(body.password || 'driver123', 10);
        const userResult = await sql`INSERT INTO users (name, email, phone, password, role) VALUES (${body.name}, ${body.email}, ${body.phone || ''}, ${hashed}, 'driver') RETURNING id`;
        const userId = userResult[0].id;
        const driverResult = await sql`INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES (${userId}, ${body.license_number}, ${body.license_expiry}, ${body.status || 'active'}) RETURNING id`;
        return res.status(201).json({ message: 'Driver created', id: driverResult[0].id });
      }
      if (action === 'update') {
        await sql`UPDATE users SET name=${body.name}, email=${body.email}, phone=${body.phone || ''}, updated_at=NOW() WHERE id = (SELECT user_id FROM drivers WHERE id=${body.id})`;
        await sql`UPDATE drivers SET license_number=${body.license_number}, license_expiry=${body.license_expiry}, status=${body.status}, updated_at=NOW() WHERE id=${body.id}`;
        return res.status(200).json({ message: 'Driver updated' });
      }
      if (action === 'delete') {
        await sql`UPDATE drivers SET deleted_at = NOW() WHERE id = ${body.id}`;
        const driver = await sql`SELECT user_id FROM drivers WHERE id = ${body.id}`;
        if (driver.length > 0) await sql`UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ${driver[0].user_id}`;
        return res.status(200).json({ message: 'Driver archived' });
      }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('Drivers error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function schedules(req, res) {
  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;
  const sql = getDB();
  try {
    if (req.method === 'GET') {
      const list = await sql`SELECT s.*, b.bus_name, b.bus_type, b.total_seats, u.name AS driver_name, COALESCE(booked.count, 0) AS booked_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.deleted_at IS NULL ORDER BY s.departure_date DESC, s.departure_time ASC`;
      return res.status(200).json({ schedules: list });
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action || 'create';
      if (action === 'create') { const result = await sql`INSERT INTO schedules (bus_id, driver_id, route, departure_date, departure_time, estimated_arrival, fare, status) VALUES (${body.bus_id}, ${body.driver_id}, ${body.route}, ${body.departure_date}, ${body.departure_time}, ${body.estimated_arrival || null}, ${body.fare}, ${body.status || 'scheduled'}) RETURNING id`; return res.status(201).json({ message: 'Schedule created', id: result[0].id }); }
      if (action === 'update') { await sql`UPDATE schedules SET bus_id=${body.bus_id}, driver_id=${body.driver_id}, route=${body.route}, departure_date=${body.departure_date}, departure_time=${body.departure_time}, estimated_arrival=${body.estimated_arrival}, fare=${body.fare}, status=${body.status}, updated_at=NOW() WHERE id=${body.id}`; return res.status(200).json({ message: 'Schedule updated' }); }
      if (action === 'delete') { await sql`UPDATE schedules SET deleted_at = NOW() WHERE id = ${body.id}`; return res.status(200).json({ message: 'Schedule archived' }); }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('Admin schedules error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function users(req, res) {
  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;
  const sql = getDB();
  const { role } = req.query || {};
  try {
    let list;
    if (role) { list = await sql`SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE role = ${role} ORDER BY created_at DESC`; }
    else { list = await sql`SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC`; }
    return res.status(200).json({ users: list });
  } catch (err) { console.error('Users error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function reports(req, res) {
  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;
  const sql = getDB();
  const range = parseInt(req.query.range || '7');
  try {
    const dailyRevenue = await sql`SELECT DATE(bk.created_at) AS date, COUNT(*) AS bookings, SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.amount_paid ELSE 0 END) AS revenue FROM bookings bk WHERE bk.created_at >= CURRENT_DATE - make_interval(days => ${range}) GROUP BY DATE(bk.created_at) ORDER BY date ASC`;
    const paymentBreakdown = await sql`SELECT payment_method, COUNT(*) AS count, SUM(amount_paid) AS total FROM bookings WHERE payment_status = 'paid' GROUP BY payment_method`;
    const routeBreakdown = await sql`SELECT s.route, COUNT(bk.id) AS bookings, SUM(bk.amount_paid) AS revenue FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id WHERE bk.payment_status = 'paid' GROUP BY s.route`;
    const [totals] = await sql`SELECT COUNT(*) AS total_bookings, SUM(CASE WHEN payment_status='paid' THEN amount_paid ELSE 0 END) AS total_revenue, SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled FROM bookings`;
    const busTypeBreakdown = await sql`SELECT b.bus_type, COUNT(bk.id) AS bookings, SUM(bk.amount_paid) AS revenue FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE bk.payment_status = 'paid' GROUP BY b.bus_type`;
    return res.status(200).json({ daily_revenue: dailyRevenue, payment_breakdown: paymentBreakdown, route_breakdown: routeBreakdown, bus_type_breakdown: busTypeBreakdown, totals });
  } catch (err) { console.error('Reports error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function announcements(req, res) {
  const sql = getDB();
  try {
    if (req.method === 'GET') {
      const list = await sql`SELECT a.*, u.name AS author_name FROM announcements a JOIN users u ON a.admin_id = u.id WHERE a.is_active = 1 AND a.deleted_at IS NULL ORDER BY a.created_at DESC`;
      return res.status(200).json({ announcements: list });
    }
    if (req.method === 'POST') {
      const user = await requireAuth(req, res, ['admin']);
      if (!user) return;
      const body = req.body || {};
      const action = body.action || 'create';
      if (action === 'create') { const result = await sql`INSERT INTO announcements (admin_id, title, content, is_active) VALUES (${user.id}, ${body.title}, ${body.content}, ${body.is_active ?? 1}) RETURNING id`; return res.status(201).json({ message: 'Announcement created', id: result[0].id }); }
      if (action === 'update') { await sql`UPDATE announcements SET title=${body.title}, content=${body.content}, is_active=${body.is_active}, updated_at=NOW() WHERE id=${body.id}`; return res.status(200).json({ message: 'Announcement updated' }); }
      if (action === 'delete') { await sql`UPDATE announcements SET deleted_at = NOW() WHERE id = ${body.id}`; return res.status(200).json({ message: 'Announcement archived' }); }
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('Announcements error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function driverTrips(req, res) {
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
      if (type === 'current') { trips = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, COALESCE(booked.count, 0) AS passenger_count FROM schedules s JOIN buses b ON s.bus_id = b.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.driver_id = ${driverId} AND s.status IN ('boarding', 'departed', 'in_transit') ORDER BY s.departure_date ASC, s.departure_time ASC`; }
      else if (type === 'history') { trips = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, COALESCE(booked.count, 0) AS passenger_count FROM schedules s JOIN buses b ON s.bus_id = b.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.driver_id = ${driverId} AND s.status IN ('arrived', 'cancelled') ORDER BY s.departure_date ASC, s.departure_time ASC`; }
      else { trips = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, COALESCE(booked.count, 0) AS passenger_count FROM schedules s JOIN buses b ON s.bus_id = b.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.driver_id = ${driverId} AND s.status = 'scheduled' ORDER BY s.departure_date ASC, s.departure_time ASC`; }
      return res.status(200).json({ trips });
    }
    if (req.method === 'POST') {
      const { schedule_id, status: newStatus } = req.body || {};
      const validStatuses = ['boarding', 'departed', 'in_transit', 'arrived'];
      if (!validStatuses.includes(newStatus)) return res.status(400).json({ error: 'Invalid status' });
      const check = await sql`SELECT id FROM schedules WHERE id = ${schedule_id} AND driver_id = ${driverId}`;
      if (check.length === 0) return res.status(403).json({ error: 'Trip not found or not assigned to you' });
      await sql`UPDATE schedules SET status = ${newStatus}, updated_at = NOW() WHERE id = ${schedule_id}`;
      if (newStatus === 'arrived') await sql`UPDATE bookings SET status = 'completed', updated_at = NOW() WHERE schedule_id = ${schedule_id} AND status = 'confirmed'`;
      return res.status(200).json({ message: 'Trip status updated to ' + newStatus });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) { console.error('Driver trips error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function driverManifest(req, res) {
  const user = await requireAuth(req, res, ['driver', 'admin']);
  if (!user) return;
  const { schedule_id } = req.query;
  if (!schedule_id) return res.status(400).json({ error: 'Schedule ID required' });
  const sql = getDB();
  try {
    const passengers = await sql`SELECT bk.seat_number, bk.booking_ref, bk.payment_status, bk.status, u.name AS passenger_name, u.phone AS passenger_phone FROM bookings bk JOIN users u ON bk.user_id = u.id WHERE bk.schedule_id = ${schedule_id} AND bk.status != 'cancelled' ORDER BY bk.seat_number ASC`;
    return res.status(200).json({ passengers });
  } catch (err) { console.error('Manifest error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}
