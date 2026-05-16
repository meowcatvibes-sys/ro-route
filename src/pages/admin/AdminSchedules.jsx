import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import './AdminCrud.css';

const EMPTY = { bus_id: '', driver_id: '', route: 'roxas_to_manila', departure_date: '', departure_time: '', estimated_arrival: '', fare: 850, status: 'scheduled' };

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const { toast, confirm } = useToast();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [s, b, d] = await Promise.all([adminAPI.getSchedules(), adminAPI.getBuses(), adminAPI.getDrivers()]);
      setSchedules(s.data.schedules);
      setBuses(b.data.buses.filter(x => x.status === 'active'));
      setDrivers(d.data.drivers.filter(x => x.status === 'active'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openNew = () => { setForm(EMPTY); setEditing(null); setModal(true); };
  const openEdit = (s) => { setForm(s); setEditing(s.id); setModal(true); };

  const handleSave = async () => {
    try {
      await adminAPI.saveSchedule({ ...form, action: editing ? 'update' : 'create', id: editing });
      setModal(false);
      toast.success(editing ? 'Schedule updated successfully!' : 'Schedule created successfully!');
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to save schedule'); }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this schedule?');
    if (!ok) return;
    try { await adminAPI.saveSchedule({ action: 'delete', id }); toast.success('Schedule deleted!'); fetchAll(); }
    catch (e) { toast.error('Failed to delete schedule'); }
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div><h1>Schedule Management</h1><p>{schedules.length} total schedules</p></div>
        <button className="btn btn--primary" onClick={openNew}><Plus size={18} /> Add Schedule</button>
      </div>

      <div className="dashboard-card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Route</th><th>Date</th><th>Time</th><th>Bus</th><th>Driver</th><th>Fare</th><th>Booked</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.route === 'roxas_to_manila' ? 'Roxas→MNL' : 'MNL→Roxas'}</td>
                  <td>{s.departure_date}</td>
                  <td>{formatTime(s.departure_time)}</td>
                  <td>{s.bus_name}</td>
                  <td>{s.driver_name}</td>
                  <td>₱{parseFloat(s.fare).toLocaleString()}</td>
                  <td>{s.booked_seats}/{s.total_seats}</td>
                  <td><span className={`status-badge status-badge--${s.status}`}>{s.status}</span></td>
                  <td className="actions-cell">
                    <button className="btn btn--ghost btn--sm" onClick={() => openEdit(s)}><Pencil size={14} /></button>
                    <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
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
              <h2>{editing ? 'Edit Schedule' : 'Create Schedule'}</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="modal__body">
              <div className="form-group"><label>Route</label>
                <select value={form.route} onChange={e => setForm({...form, route: e.target.value})}>
                  <option value="roxas_to_manila">Roxas City → Manila</option>
                  <option value="manila_to_roxas">Manila → Roxas City</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Bus</label>
                  <select value={form.bus_id} onChange={e => setForm({...form, bus_id: e.target.value})}>
                    <option value="">Select bus...</option>
                    {buses.map(b => <option key={b.id} value={b.id}>{b.bus_name} ({b.bus_type})</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Driver</label>
                  <select value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})}>
                    <option value="">Select driver...</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Date</label><input type="date" value={form.departure_date} onChange={e => setForm({...form, departure_date: e.target.value})} /></div>
                <div className="form-group"><label>Fare (₱)</label><input type="number" value={form.fare} onChange={e => setForm({...form, fare: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Departure Time</label><input type="time" value={form.departure_time} onChange={e => setForm({...form, departure_time: e.target.value})} /></div>
                <div className="form-group"><label>Est. Arrival</label><input type="time" value={form.estimated_arrival} onChange={e => setForm({...form, estimated_arrival: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="scheduled">Scheduled</option><option value="boarding">Boarding</option>
                  <option value="departed">Departed</option><option value="in_transit">In Transit</option>
                  <option value="arrived">Arrived</option><option value="cancelled">Cancelled</option>
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
