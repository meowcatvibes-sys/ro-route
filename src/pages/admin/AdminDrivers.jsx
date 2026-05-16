import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, X, UserCog } from 'lucide-react';
import { useToast } from '../../components/Toast';
import './AdminCrud.css';

const EMPTY = { name: '', email: '', phone: '', password: 'driver123', license_number: '', license_expiry: '', status: 'active' };

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const { toast, confirm } = useToast();

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try { const r = await adminAPI.getDrivers(); setDrivers(r.data.drivers); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (d) => { setForm({ ...d, password: '' }); setEditing(d.id); setModal(true); };

  const handleSave = async () => {
    try {
      await adminAPI.saveDriver({ ...form, action: editing ? 'update' : 'create', id: editing });
      setModal(false);
      toast.success(editing ? 'Driver updated successfully!' : 'Driver added successfully!');
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save driver'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this driver? This also removes their user account.');
    if (!ok) return;
    try { await adminAPI.saveDriver({ action: 'delete', id }); toast.success('Driver deleted successfully!'); fetch(); }
    catch (e) { toast.error('Failed to delete driver'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div><h1>Driver Management</h1><p>{drivers.length} registered drivers</p></div>
        <button className="btn btn--primary" onClick={openNew}><Plus size={18} /> Add Driver</button>
      </div>

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>License</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.email}</td>
                  <td>{d.phone}</td>
                  <td><code>{d.license_number}</code></td>
                  <td>{d.license_expiry}</td>
                  <td><span className={`status-badge status-badge--${d.status}`}>{d.status}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(d)}><Pencil size={14} /></button>
                    <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(d.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editing ? 'Edit Driver' : 'Add New Driver'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-row">
                <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                {!editing && <div className="form-group"><label>Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>}
              </div>
              <div className="form-row">
                <div className="form-group"><label>License Number</label><input value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} /></div>
                <div className="form-group"><label>License Expiry</label><input type="date" value={form.license_expiry} onChange={e => setForm({...form, license_expiry: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
