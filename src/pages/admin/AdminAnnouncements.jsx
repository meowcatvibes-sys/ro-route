import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, X, Megaphone, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../components/Toast';
import './AdminCrud.css';

const EMPTY = { title: '', content: '', is_active: 1 };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const { toast, confirm } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const r = await adminAPI.getAnnouncements();
      setAnnouncements(r.data.announcements);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (a) => {
    setForm({ title: a.title, content: a.content, is_active: a.is_active });
    setEditing(a.id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.warning('Please fill in both title and content.');
      return;
    }
    try {
      await adminAPI.saveAnnouncement({
        ...form,
        action: editing ? 'update' : 'create',
        id: editing,
      });
      setModal(false);
      toast.success(editing ? 'Announcement updated!' : 'Announcement published!');
      fetchData();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save announcement'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this announcement?');
    if (!ok) return;
    try {
      await adminAPI.saveAnnouncement({ action: 'delete', id });
      toast.success('Announcement deleted!');
      fetchData();
    } catch (e) { toast.error('Failed to delete announcement'); }
  };

  const toggleActive = async (a) => {
    try {
      await adminAPI.saveAnnouncement({
        action: 'update',
        id: a.id,
        title: a.title,
        content: a.content,
        is_active: a.is_active ? 0 : 1,
      });
      fetchData();
    } catch (e) { toast.error('Failed to update status'); }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div>
          <h1>Announcement Management</h1>
          <p>{announcements.length} announcements published</p>
        </div>
        <button className="btn btn--primary" onClick={openNew}>
          <Plus size={18} /> New Announcement
        </button>
      </div>

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Content</th>
                <th>Author</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Megaphone size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No announcements yet. Create your first one!</p>
                  </td>
                </tr>
              ) : (
                announcements.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td><strong>{a.title}</strong></td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.content}
                    </td>
                    <td>{a.author_name}</td>
                    <td>
                      <button
                        className={`status-badge status-badge--${a.is_active ? 'confirmed' : 'cancelled'}`}
                        onClick={() => toggleActive(a)}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title={a.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {a.is_active ? <><Eye size={12} /> Active</> : <><EyeOff size={12} /> Inactive</>}
                      </button>
                    </td>
                    <td>{formatDate(a.created_at)}</td>
                    <td className="actions-cell">
                      <button className="btn btn--ghost btn--sm" onClick={() => openEdit(a)}><Pencil size={14} /></button>
                      <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Holiday Schedule Advisory"
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write the announcement details here..."
                  rows={5}
                  style={{ width: '100%', resize: 'vertical', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.is_active}
                  onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}
                >
                  <option value={1}>Active (Visible to public)</option>
                  <option value={0}>Inactive (Hidden)</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSave}>
                {editing ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
