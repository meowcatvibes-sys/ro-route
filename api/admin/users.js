import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;

  const sql = getDB();
  const { role } = req.query || {};

  try {
    let users;
    if (role) {
      users = await sql`SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE role = ${role} ORDER BY created_at DESC`;
    } else {
      users = await sql`SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC`;
    }
    return res.status(200).json({ users });
  } catch (err) {
    console.error('Users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
