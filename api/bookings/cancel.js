import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
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
  } catch (err) {
    console.error('Cancel booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
