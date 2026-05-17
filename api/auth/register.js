import { getDB } from '../_lib/db.js';
import { cors, generateToken } from '../_lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(422).json({ error: 'Name, email, and password are required' });
  if (password.length < 6) return res.status(422).json({ error: 'Password must be at least 6 characters' });

  const sql = getDB();

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email is already registered' });

    const hashed = bcrypt.hashSync(password, 10);
    const result = await sql`
      INSERT INTO users (name, email, phone, password, role)
      VALUES (${name}, ${email}, ${phone || ''}, ${hashed}, 'passenger')
      RETURNING id
    `;
    const userId = result[0].id;

    const token = generateToken(userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await sql`INSERT INTO user_tokens (user_id, token, expires_at) VALUES (${userId}, ${token}, ${expiresAt})`;

    const user = { id: userId, name, email, phone: phone || '', role: 'passenger' };
    return res.status(201).json({ user, token, expires_at: expiresAt });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
