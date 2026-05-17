import { getDB } from '../_lib/db.js';
import { cors } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const header = req.headers.authorization || '';
  const match = header.match(/Bearer\s+(.+)/);

  if (match) {
    const sql = getDB();
    await sql`DELETE FROM user_tokens WHERE token = ${match[1]}`;
  }

  return res.status(200).json({ message: 'Logged out successfully' });
}
