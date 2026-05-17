import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['driver', 'admin']);
  if (!user) return;

  const { schedule_id } = req.query;
  if (!schedule_id) return res.status(400).json({ error: 'Schedule ID required' });

  const sql = getDB();

  try {
    const passengers = await sql`
      SELECT bk.seat_number, bk.booking_ref, bk.payment_status, bk.status,
             u.name AS passenger_name, u.phone AS passenger_phone
      FROM bookings bk
      JOIN users u ON bk.user_id = u.id
      WHERE bk.schedule_id = ${schedule_id} AND bk.status != 'cancelled'
      ORDER BY bk.seat_number ASC
    `;

    return res.status(200).json({ passengers });
  } catch (err) {
    console.error('Manifest error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
