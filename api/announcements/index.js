import { getDB } from '../_lib/db.js';
import { cors, requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDB();

  try {
    if (req.method === 'GET') {
      const announcements = await sql`
        SELECT a.*, u.name AS author_name
        FROM announcements a JOIN users u ON a.admin_id = u.id
        WHERE a.is_active = 1 AND a.deleted_at IS NULL
        ORDER BY a.created_at DESC
      `;
      return res.status(200).json({ announcements });
    }

    if (req.method === 'POST') {
      const user = await requireAuth(req, res, ['admin']);
      if (!user) return;

      const body = req.body || {};
      const action = body.action || 'create';

      if (action === 'create') {
        const result = await sql`
          INSERT INTO announcements (admin_id, title, content, is_active)
          VALUES (${user.id}, ${body.title}, ${body.content}, ${body.is_active ?? 1})
          RETURNING id
        `;
        return res.status(201).json({ message: 'Announcement created', id: result[0].id });
      }

      if (action === 'update') {
        await sql`UPDATE announcements SET title=${body.title}, content=${body.content}, is_active=${body.is_active}, updated_at=NOW() WHERE id=${body.id}`;
        return res.status(200).json({ message: 'Announcement updated' });
      }

      if (action === 'delete') {
        await sql`UPDATE announcements SET deleted_at = NOW() WHERE id = ${body.id}`;
        return res.status(200).json({ message: 'Announcement archived' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Announcements error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
