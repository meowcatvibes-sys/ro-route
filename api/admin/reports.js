import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;

  const sql = getDB();
  const range = parseInt(req.query.range || '7');

  try {
    const dailyRevenue = await sql`
      SELECT DATE(bk.created_at) AS date, COUNT(*) AS bookings,
             SUM(CASE WHEN bk.payment_status = 'paid' THEN bk.amount_paid ELSE 0 END) AS revenue
      FROM bookings bk
      WHERE bk.created_at >= CURRENT_DATE - CAST(${range} || ' days' AS INTERVAL)
      GROUP BY DATE(bk.created_at) ORDER BY date ASC
    `;

    const paymentBreakdown = await sql`
      SELECT payment_method, COUNT(*) AS count, SUM(amount_paid) AS total
      FROM bookings WHERE payment_status = 'paid' GROUP BY payment_method
    `;

    const routeBreakdown = await sql`
      SELECT s.route, COUNT(bk.id) AS bookings, SUM(bk.amount_paid) AS revenue
      FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id
      WHERE bk.payment_status = 'paid' GROUP BY s.route
    `;

    const [totals] = await sql`
      SELECT COUNT(*) AS total_bookings,
             SUM(CASE WHEN payment_status='paid' THEN amount_paid ELSE 0 END) AS total_revenue,
             SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM bookings
    `;

    const busTypeBreakdown = await sql`
      SELECT b.bus_type, COUNT(bk.id) AS bookings, SUM(bk.amount_paid) AS revenue
      FROM bookings bk JOIN schedules s ON bk.schedule_id = s.id JOIN buses b ON s.bus_id = b.id
      WHERE bk.payment_status = 'paid' GROUP BY b.bus_type
    `;

    return res.status(200).json({
      daily_revenue: dailyRevenue,
      payment_breakdown: paymentBreakdown,
      route_breakdown: routeBreakdown,
      bus_type_breakdown: busTypeBreakdown,
      totals,
    });
  } catch (err) {
    console.error('Reports error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
