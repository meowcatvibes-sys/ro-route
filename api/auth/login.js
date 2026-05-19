import { getDB } from '../_lib/db.js';
import { cors, generateToken } from '../_lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(422).json({ error: 'Email and password are required' });

  const sql = getDB();
  const ip = req.headers['x-forwarded-for'] || '0.0.0.0';

  // Brute-force protection
  const maxAttempts = 5;
  const lockoutMinutes = 15;

  try {
    // Ensure login_attempts table exists
    await sql`CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45) DEFAULT NULL,
      success SMALLINT DEFAULT 0,
      attempted_at TIMESTAMP DEFAULT NOW()
    )`;

    const [attemptResult] = await sql`
      SELECT COUNT(*) AS attempts FROM login_attempts
      WHERE email = ${email} AND success = 0 AND attempted_at > NOW() - INTERVAL '15 minutes'
    `;

    if (attemptResult && parseInt(attemptResult.attempts) >= maxAttempts) {
      await sql`INSERT INTO login_attempts (email, ip_address, success) VALUES (${email}, ${ip}, 0)`;
      return res.status(429).json({
        error: `Too many failed login attempts. Please try again after ${lockoutMinutes} minutes.`,
        locked: true,
        retry_after: lockoutMinutes
      });
    }

    // Authenticate user
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = users[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      await sql`INSERT INTO login_attempts (email, ip_address, success) VALUES (${email}, ${ip}, 0)`;
      
      const [failResult] = await sql`
        SELECT COUNT(*) AS attempts FROM login_attempts
        WHERE email = ${email} AND success = 0 AND attempted_at > NOW() - INTERVAL '15 minutes'
      `;
      const remaining = maxAttempts - parseInt(failResult?.attempts || 0);
      
      let msg = 'Invalid email or password';
      if (remaining > 0 && remaining <= 3) msg += `. ${remaining} attempt(s) remaining before lockout.`;
      
      return res.status(401).json({ error: msg, remaining_attempts: Math.max(0, remaining) });
    }

    // Successful login
    await sql`INSERT INTO login_attempts (email, ip_address, success) VALUES (${email}, ${ip}, 1)`;
    await sql`DELETE FROM login_attempts WHERE email = ${email} AND success = 0`;
    await sql`DELETE FROM user_tokens WHERE expires_at < NOW()`;

    const token = generateToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await sql`INSERT INTO user_tokens (user_id, token, expires_at) VALUES (${user.id}, ${token}, ${expiresAt})`;
    await sql`INSERT INTO audit_logs (user_id, action, description, ip_address) VALUES (${user.id}, 'login', 'User logged in', ${ip})`;

    delete user.password;

    // If driver, get driver info
    let driverInfo = null;
    if (user.role === 'driver') {
      const drivers = await sql`SELECT * FROM drivers WHERE user_id = ${user.id} AND deleted_at IS NULL`;
      driverInfo = drivers[0] || null;
    }

    return res.status(200).json({ user, driver: driverInfo, token, expires_at: expiresAt });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
