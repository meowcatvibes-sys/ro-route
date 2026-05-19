import { getDB } from '../db.js';
import { requireAuth } from '../auth.js';

export async function schedulesList(req, res) {
  const sql = getDB();
  const { route, date, bus_type } = req.query || {};
  try {
    let schedules;
    const baseQuery = `SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id`;
    if (route && route !== 'all' && date && bus_type && bus_type !== 'all') {
      schedules = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.status != 'cancelled' AND s.route = ${route} AND s.departure_date = ${date} AND b.bus_type = ${bus_type} ORDER BY s.departure_date ASC, s.departure_time ASC`;
    } else if (route && route !== 'all' && date) {
      schedules = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.status != 'cancelled' AND s.route = ${route} AND s.departure_date = ${date} ORDER BY s.departure_date ASC, s.departure_time ASC`;
    } else if (route && route !== 'all') {
      schedules = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.status != 'cancelled' AND s.route = ${route} ORDER BY s.departure_date ASC, s.departure_time ASC`;
    } else if (date) {
      schedules = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.status != 'cancelled' AND s.departure_date = ${date} ORDER BY s.departure_date ASC, s.departure_time ASC`;
    } else {
      schedules = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name, (b.total_seats - COALESCE(booked.count, 0)) AS available_seats FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id LEFT JOIN (SELECT schedule_id, COUNT(*) AS count FROM bookings WHERE status != 'cancelled' GROUP BY schedule_id) booked ON s.id = booked.schedule_id WHERE s.status != 'cancelled' ORDER BY s.departure_date ASC, s.departure_time ASC`;
    }
    return res.status(200).json({ schedules });
  } catch (err) { console.error('Schedules error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function schedulesShow(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Schedule ID required' });
  const sql = getDB();
  try {
    const schedules = await sql`SELECT s.*, b.bus_name, b.plate_number, b.bus_type, b.total_seats, u.name AS driver_name FROM schedules s JOIN buses b ON s.bus_id = b.id JOIN drivers d ON s.driver_id = d.id JOIN users u ON d.user_id = u.id WHERE s.id = ${id}`;
    if (schedules.length === 0) return res.status(404).json({ error: 'Schedule not found' });
    const schedule = schedules[0];
    const bookedSeats = await sql`SELECT bk.seat_number, bk.user_id, u.name AS passenger_name FROM bookings bk JOIN users u ON bk.user_id = u.id WHERE bk.schedule_id = ${id} AND bk.status != 'cancelled'`;
    schedule.booked_seats = bookedSeats;
    schedule.available_seats = schedule.total_seats - bookedSeats.length;
    return res.status(200).json({ schedule });
  } catch (err) { console.error('Schedule show error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function bookingsList(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;
  const sql = getDB();
  try {
    let bookings;
    if (user.role === 'passenger') {
      bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status, b.bus_name, b.plate_number, b.bus_type FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE bk.user_id = ${user.id} ORDER BY bk.created_at DESC`;
    } else {
      const { status, date } = req.query || {};
      if (status && date) {
        bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status, b.bus_name, b.plate_number, b.bus_type FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE bk.status = ${status} AND s.departure_date = ${date} ORDER BY bk.created_at DESC`;
      } else if (status) {
        bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status, b.bus_name, b.plate_number, b.bus_type FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE bk.status = ${status} ORDER BY bk.created_at DESC`;
      } else if (date) {
        bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status, b.bus_name, b.plate_number, b.bus_type FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id WHERE s.departure_date = ${date} ORDER BY bk.created_at DESC`;
      } else {
        bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status, b.bus_name, b.plate_number, b.bus_type FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id ORDER BY bk.created_at DESC`;
      }
    }
    return res.status(200).json({ bookings });
  } catch (err) { console.error('Bookings list error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function bookingsShow(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Booking ID required' });
  const sql = getDB();
  try {
    const bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, s.status AS trip_status, b.bus_name, b.plate_number, b.bus_type, u.name AS passenger_name, u.email AS passenger_email, u.phone AS passenger_phone FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id JOIN users u ON bk.user_id = u.id WHERE bk.id = ${id}`;
    if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = bookings[0];
    if (user.role === 'passenger' && booking.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    return res.status(200).json({ booking });
  } catch (err) { console.error('Booking show error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function bookingsStore(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res, ['passenger']);
  if (!user) return;
  const { schedule_id, seat_number, payment_method = 'cash' } = req.body || {};
  if (!schedule_id || !seat_number) return res.status(422).json({ error: 'Schedule ID and seat number are required' });
  const sql = getDB();
  try {
    const schedules = await sql`SELECT s.*, b.total_seats FROM schedules s JOIN buses b ON s.bus_id = b.id WHERE s.id = ${schedule_id} AND s.status IN ('scheduled', 'boarding')`;
    if (schedules.length === 0) return res.status(400).json({ error: 'Schedule not available for booking' });
    const schedule = schedules[0];
    const seatCheck = await sql`SELECT id FROM bookings WHERE schedule_id = ${schedule_id} AND seat_number = ${seat_number} AND status != 'cancelled'`;
    if (seatCheck.length > 0) return res.status(409).json({ error: 'Seat is already taken' });
    const bookingRef = 'RR-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + String(Math.floor(Math.random()*9999)+1).padStart(4,'0');
    const paymentStatus = payment_method === 'cash' ? 'pending' : 'paid';
    const result = await sql`INSERT INTO bookings (booking_ref, user_id, schedule_id, seat_number, amount_paid, payment_method, payment_status, status) VALUES (${bookingRef}, ${user.id}, ${schedule_id}, ${seat_number}, ${schedule.fare}, ${payment_method}, ${paymentStatus}, 'confirmed') RETURNING id`;
    const bookingId = result[0].id;
    const bookings = await sql`SELECT bk.*, s.route, s.departure_date, s.departure_time, s.estimated_arrival, b.bus_name, b.plate_number, b.bus_type, u.name AS passenger_name, u.email, u.phone FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id JOIN users u ON bk.user_id = u.id WHERE bk.id = ${bookingId}`;
    return res.status(201).json({ booking: bookings[0], message: 'Booking created successfully' });
  } catch (err) { console.error('Store booking error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function bookingsCancel(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const user = await requireAuth(req, res);
  if (!user) return;
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Booking ID required' });
  const sql = getDB();
  try {
    const bookings = await sql`SELECT * FROM bookings WHERE id = ${id}`;
    if (bookings.length === 0) return res.status(404).json({ error: 'Booking not found' });
    const booking = bookings[0];
    if (user.role === 'passenger' && booking.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
    if (booking.status === 'cancelled') return res.status(400).json({ error: 'Booking is already cancelled' });
    await sql`UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}`;
    return res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (err) { console.error('Cancel booking error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}
