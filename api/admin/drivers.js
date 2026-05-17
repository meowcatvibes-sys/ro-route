import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;

  const sql = getDB();

  try {
    if (req.method === 'GET') {
      const drivers = await sql`
        SELECT d.*, u.name, u.email, u.phone
        FROM drivers d JOIN users u ON d.user_id = u.id
        WHERE d.deleted_at IS NULL ORDER BY d.id ASC
      `;
      return res.status(200).json({ drivers });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action || 'create';

      if (action === 'create') {
        const hashed = bcrypt.hashSync(body.password || 'driver123', 10);
        const userResult = await sql`
          INSERT INTO users (name, email, phone, password, role)
          VALUES (${body.name}, ${body.email}, ${body.phone || ''}, ${hashed}, 'driver')
          RETURNING id
        `;
        const userId = userResult[0].id;
        const driverResult = await sql`
          INSERT INTO drivers (user_id, license_number, license_expiry, status)
          VALUES (${userId}, ${body.license_number}, ${body.license_expiry}, ${body.status || 'active'})
          RETURNING id
        `;
        return res.status(201).json({ message: 'Driver created', id: driverResult[0].id });
      }

      if (action === 'update') {
        await sql`UPDATE users SET name=${body.name}, email=${body.email}, phone=${body.phone || ''}, updated_at=NOW() WHERE id = (SELECT user_id FROM drivers WHERE id=${body.id})`;
        await sql`UPDATE drivers SET license_number=${body.license_number}, license_expiry=${body.license_expiry}, status=${body.status}, updated_at=NOW() WHERE id=${body.id}`;
        return res.status(200).json({ message: 'Driver updated' });
      }

      if (action === 'delete') {
        await sql`UPDATE drivers SET deleted_at = NOW() WHERE id = ${body.id}`;
        const driver = await sql`SELECT user_id FROM drivers WHERE id = ${body.id}`;
        if (driver.length > 0) {
          await sql`UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ${driver[0].user_id}`;
        }
        return res.status(200).json({ message: 'Driver archived' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Drivers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
