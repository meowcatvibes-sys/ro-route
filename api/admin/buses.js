import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await requireAuth(req, res, ['admin']);
  if (!user) return;

  const sql = getDB();

  try {
    if (req.method === 'GET') {
      const buses = await sql`SELECT * FROM buses WHERE deleted_at IS NULL ORDER BY id ASC`;
      return res.status(200).json({ buses });
    }

    if (req.method === 'POST') {
      const { action = 'create', id, bus_name, plate_number, bus_type = 'aircon', total_seats = 45, status = 'active' } = req.body || {};

      if (action === 'create') {
        const result = await sql`
          INSERT INTO buses (bus_name, plate_number, bus_type, total_seats, status)
          VALUES (${bus_name}, ${plate_number}, ${bus_type}, ${total_seats}, ${status})
          RETURNING id
        `;
        return res.status(201).json({ message: 'Bus created', id: result[0].id });
      }

      if (action === 'update') {
        await sql`UPDATE buses SET bus_name=${bus_name}, plate_number=${plate_number}, bus_type=${bus_type}, total_seats=${total_seats}, status=${status}, updated_at=NOW() WHERE id=${id}`;
        return res.status(200).json({ message: 'Bus updated' });
      }

      if (action === 'delete') {
        await sql`UPDATE buses SET deleted_at = NOW() WHERE id = ${id}`;
        return res.status(200).json({ message: 'Bus archived' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Buses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
