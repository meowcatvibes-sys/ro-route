import { login, register, me, logout } from './_lib/routes/auth.js';
import { schedulesList, schedulesShow, bookingsList, bookingsShow, bookingsStore, bookingsCancel } from './_lib/routes/data.js';
import { dashboard, buses, drivers, schedules, users, reports, announcements, driverTrips, driverManifest } from './_lib/routes/admin.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

const routes = {
  'auth/login': login,
  'auth/register': register,
  'auth/me': me,
  'auth/logout': logout,
  'schedules/index': schedulesList,
  'schedules/show': schedulesShow,
  'bookings/index': bookingsList,
  'bookings/show': bookingsShow,
  'bookings/store': bookingsStore,
  'bookings/cancel': bookingsCancel,
  'admin/dashboard': dashboard,
  'admin/buses': buses,
  'admin/drivers': drivers,
  'admin/schedules': schedules,
  'admin/users': users,
  'admin/reports': reports,
  'announcements/index': announcements,
  'driver/trips': driverTrips,
  'driver/manifest': driverManifest,
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { path } = req.query;
  const routeKey = Array.isArray(path) ? path.join('/') : path;

  const routeHandler = routes[routeKey];
  if (!routeHandler) {
    return res.status(404).json({ error: 'API endpoint not found', path: routeKey });
  }

  try {
    return await routeHandler(req, res);
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
