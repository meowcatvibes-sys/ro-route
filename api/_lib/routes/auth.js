import { getDB } from '../db.js';
import { generateToken, requireAuth } from '../auth.js';
import bcrypt from 'bcryptjs';

export async function login(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(422).json({ error: 'Email and password are required' });
  const sql = getDB();
  const ip = req.headers['x-forwarded-for'] || '0.0.0.0';
  try {
    await sql`CREATE TABLE IF NOT EXISTS login_attempts (id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL, ip_address VARCHAR(45), success SMALLINT DEFAULT 0, attempted_at TIMESTAMP DEFAULT NOW())`;
    const [attemptResult] = await sql`SELECT COUNT(*) AS attempts FROM login_attempts WHERE email = ${email} AND success = 0 AND attempted_at > NOW() - INTERVAL '15 minutes'`;
    if (attemptResult && parseInt(attemptResult.attempts) >= 5) {
      await sql`INSERT INTO login_attempts (email, ip_address, success) VALUES (${email}, ${ip}, 0)`;
      return res.status(429).json({ error: 'Too many failed login attempts. Please try again after 15 minutes.', locked: true, retry_after: 15 });
    }
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = users[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      await sql`INSERT INTO login_attempts (email, ip_address, success) VALUES (${email}, ${ip}, 0)`;
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await sql`INSERT INTO login_attempts (email, ip_address, success) VALUES (${email}, ${ip}, 1)`;
    await sql`DELETE FROM login_attempts WHERE email = ${email} AND success = 0`;
    await sql`DELETE FROM user_tokens WHERE expires_at < NOW()`;
    const token = generateToken(user.id);
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();
    await sql`INSERT INTO user_tokens (user_id, token, expires_at) VALUES (${user.id}, ${token}, ${expiresAt})`;
    await sql`INSERT INTO audit_logs (user_id, action, description, ip_address) VALUES (${user.id}, 'login', 'User logged in', ${ip})`;
    delete user.password;
    let driverInfo = null;
    if (user.role === 'driver') {
      const drivers = await sql`SELECT * FROM drivers WHERE user_id = ${user.id} AND deleted_at IS NULL`;
      driverInfo = drivers[0] || null;
    }
    return res.status(200).json({ user, driver: driverInfo, token, expires_at: expiresAt });
  } catch (err) { console.error('Login error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function register(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) return res.status(422).json({ error: 'Name, email, and password are required' });
  if (password.length < 6) return res.status(422).json({ error: 'Password must be at least 6 characters' });
  const sql = getDB();
  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email is already registered' });
    const hashed = bcrypt.hashSync(password, 10);
    const result = await sql`INSERT INTO users (name, email, phone, password, role) VALUES (${name}, ${email}, ${phone || ''}, ${hashed}, 'passenger') RETURNING id`;
    const userId = result[0].id;
    const token = generateToken(userId);
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();
    await sql`INSERT INTO user_tokens (user_id, token, expires_at) VALUES (${userId}, ${token}, ${expiresAt})`;
    const user = { id: userId, name, email, phone: phone || '', role: 'passenger' };
    return res.status(201).json({ user, token, expires_at: expiresAt });
  } catch (err) { console.error('Register error:', err); return res.status(500).json({ error: 'Internal server error' }); }
}

export async function me(req, res) {
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

export async function logout(req, res) {
  const header = req.headers.authorization || '';
  const match = header.match(/Bearer\s+(.+)/);
  if (match) {
    const sql = getDB();
    await sql`DELETE FROM user_tokens WHERE token = ${match[1]}`;
  }
  return res.status(200).json({ message: 'Logged out successfully' });
}
