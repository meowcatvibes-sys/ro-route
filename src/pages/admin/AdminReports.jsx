import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, CreditCard, MapPin, Bus } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import './AdminCrud.css';
import './AdminReports.css';

const PIE_COLORS = ['#2563EB', '#7C3AED', '#059669', '#F59E0B', '#EF4444'];

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, [range]);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports(range);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner spinner--lg"></div></div>;
  if (!data) return <div className="page-loader"><p>Failed to load reports</p></div>;

  const paymentData = data.payment_breakdown.map(p => ({
    name: p.payment_method === 'gcash' ? 'GCash' : p.payment_method === 'maya' ? 'Maya' : p.payment_method === 'cash' ? 'Cash' : p.payment_method,
    value: parseFloat(p.total),
    count: parseInt(p.count),
  }));

  const routeData = data.route_breakdown.map(r => ({
    name: r.route === 'roxas_to_manila' ? 'Roxas→Manila' : 'Manila→Roxas',
    revenue: parseFloat(r.revenue),
    bookings: parseInt(r.bookings),
  }));

  const dailyData = data.daily_revenue.map(d => ({
    date: d.date?.slice(5), // MM-DD
    revenue: parseFloat(d.revenue),
    bookings: parseInt(d.bookings),
  }));

  return (
    <div className="admin-crud">
      <div className="admin-crud__header">
        <div>
          <h1>Revenue Reports</h1>
          <p>Financial overview and booking analytics</p>
        </div>
        <select className="report-range-select" value={range} onChange={e => setRange(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="report-summary">
        <div className="report-stat animate-fade-in-up">
          <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <span>Total Revenue</span>
            <strong>{formatCurrency(data.totals.total_revenue || 0)}</strong>
          </div>
        </div>
        <div className="report-stat animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <CreditCard size={20} style={{ color: '#7C3AED' }} />
          <div>
            <span>Total Bookings</span>
            <strong>{data.totals.total_bookings}</strong>
          </div>
        </div>
        <div className="report-stat animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <Bus size={20} style={{ color: 'var(--success)' }} />
          <div>
            <span>Avg. per Booking</span>
            <strong>{data.totals.total_bookings > 0 ? formatCurrency(data.totals.total_revenue / data.totals.total_bookings) : '₱0'}</strong>
          </div>
        </div>
        <div className="report-stat animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <MapPin size={20} style={{ color: 'var(--danger)' }} />
          <div>
            <span>Cancelled</span>
            <strong>{data.totals.cancelled}</strong>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Daily Revenue Bar Chart */}
        <div className="dashboard-card chart-card animate-fade-in-up delay-300">
          <div className="dashboard-card__header"><h3>Daily Revenue</h3></div>
          <div className="chart-container">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="date" fontSize={12} stroke="var(--text-muted)" />
                  <YAxis fontSize={12} stroke="var(--text-muted)" />
                  <Tooltip
                    formatter={(v) => [`₱${v.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                  />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">No revenue data for this period</p>
            )}
          </div>
        </div>

        {/* Payment Method Pie Chart */}
        <div className="dashboard-card chart-card animate-fade-in-up delay-400">
          <div className="dashboard-card__header"><h3>Payment Methods</h3></div>
          <div className="chart-container">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                    dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    fontSize={12}
                  >
                    {paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`₱${v.toLocaleString()}`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">No payment data</p>
            )}
          </div>
        </div>

        {/* Route Revenue */}
        <div className="dashboard-card chart-card animate-fade-in-up delay-500">
          <div className="dashboard-card__header"><h3>Revenue by Route</h3></div>
          <div className="chart-container">
            {routeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={routeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis type="number" fontSize={12} stroke="var(--text-muted)" />
                  <YAxis type="category" dataKey="name" fontSize={12} stroke="var(--text-muted)" width={100} />
                  <Tooltip formatter={(v) => [`₱${v.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                  />
                  <Bar dataKey="revenue" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">No route data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
