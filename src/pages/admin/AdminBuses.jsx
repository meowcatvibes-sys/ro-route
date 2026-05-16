import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, X, Bus } from 'lucide-react';
import { useToast } from '../../components/Toast';
import './AdminCrud.css';

const EMPTY = { bus_name: '', plate_number: '', bus_type: 'aircon', total_seats: 45, status: 'active' };

export default function AdminBuses() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const { toast, confirm } = useToast();

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try { const r = await adminAPI.getBuses(); setBuses(r.data.buses); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (b) => { setForm(b); setEditing(b.id); setModal(true); };

  const handleSave = async () => {
    try {
      await adminAPI.saveBus({ ...form, action: editing ? 'update' : 'create', id: editing });
      setModal(false);
      toast.success(editing ? 'Bus updated successfully!' : 'Bus added successfully!');
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save bus'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this bus? This action cannot be undone.');
    if (!ok) return;
    try { await adminAPI.saveBus({ action: 'delete', id }); toast.success('Bus deleted successfully!'); fetch(); }
    catch (e) { toast.error('Failed to delete bus'); }
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div><h1>Bus Management</h1><p>{buses.length} buses in fleet</p></div>
        <button className="btn btn--primary" onClick={openNew}><Plus size={18} /> Add Bus</button>
      </div>

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Plate</th><th>Type</th><th>Seats</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {buses.map(b => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td><strong>{b.bus_name}</strong></td>
                  <td><code>{b.plate_number}</code></td>
                  <td><span className={`status-badge status-badge--${b.bus_type === 'aircon' ? 'confirmed' : 'pending'}`}>{b.bus_type}</span></td>
                  <td>{b.total_seats}</td>
                  <td><span className={`status-badge status-badge--${b.status === 'active' ? 'confirmed' : b.status === 'maintenance' ? 'pending' : 'cancelled'}`}>{b.status}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(b)}><Pencil size={14} /></button>
                    <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(b.id)}><Trash2 size={14} /></button>
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
              <h2>{editing ? 'Edit Bus' : 'Add New Bus'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-group"><label>Bus Name</label><input value={form.bus_name} onChange={e => setForm({...form, bus_name: e.target.value})} placeholder="RR-Bus 01" /></div>
              <div className="form-group"><label>Plate Number</label><input value={form.plate_number} onChange={e => setForm({...form, plate_number: e.target.value})} placeholder="ABC-1234" /></div>
              <div className="form-row">
                <div className="form-group"><label>Type</label>
                  <select value={form.bus_type} onChange={e => setForm({...form, bus_type: e.target.value})}>
                    <option value="aircon">Aircon</option><option value="non_aircon">Non-Aircon</option>
                  </select>
                </div>
                <div className="form-group"><label>Seats</label><input type="number" value={form.total_seats} onChange={e => setForm({...form, total_seats: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="retired">Retired</option>
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
