import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const sql = getDB();
  let driverInfo = null;

  if (user.role === 'driver') {
    const drivers = await sql`SELECT * FROM drivers WHERE user_id = ${user.id}`;
    driverInfo = drivers[0] || null;
  }

  return res.status(200).json({ user, driver: driverInfo });
}
