import { getDB } from './db.js';

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export async function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/Bearer\s+(.+)/);
  if (!match) return null;

  const token = match[1];
  const sql = getDB();

  const rows = await sql`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, u.updated_at
    FROM user_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.token = ${token} AND t.expires_at > NOW()
  `;

  return rows.length > 0 ? rows[0] : null;
}

export async function requireAuth(req, res, allowedRoles = null) {
  const user = await getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return user;
}

export function generateToken(userId) {
  const payload = `${userId}|${Date.now()}|${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  return Buffer.from(payload).toString('base64');
}
