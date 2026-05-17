import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/roroute-api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('roroute_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('roroute_token');
      localStorage.removeItem('roroute_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login.php', { email, password }),

  register: (data) =>
    api.post('/auth/register.php', data),

  me: () =>
    api.get('/auth/me.php'),

  logout: () =>
    api.post('/auth/logout.php'),
};

// ── Schedules ─────────────────────────────────────────
export const schedulesAPI = {
  list: (params) =>
    api.get('/schedules/index.php', { params }),

  show: (id) =>
    api.get('/schedules/show.php', { params: { id } }),
};

// ── Bookings ──────────────────────────────────────────
export const bookingsAPI = {
  list: (params) =>
    api.get('/bookings/index.php', { params }),

  show: (id) =>
    api.get('/bookings/show.php', { params: { id } }),

  create: (data) =>
    api.post('/bookings/store.php', data),

  cancel: (id) =>
    api.post('/bookings/cancel.php', { id }),
};

// ── Admin ─────────────────────────────────────────────
export const adminAPI = {
  dashboard: () =>
    api.get('/admin/dashboard.php'),

  // Buses
  getBuses: () =>
    api.get('/admin/buses.php'),
  saveBus: (data) =>
    api.post('/admin/buses.php', data),

  // Drivers
  getDrivers: () =>
    api.get('/admin/drivers.php'),
  saveDriver: (data) =>
    api.post('/admin/drivers.php', data),

  // Schedules
  getSchedules: () =>
    api.get('/admin/schedules.php'),
  saveSchedule: (data) =>
    api.post('/admin/schedules.php', data),

  // Users
  getUsers: (params) =>
    api.get('/admin/users.php', { params }),

  // Announcements
  getAnnouncements: () =>
    api.get('/announcements/index.php'),
  saveAnnouncement: (data) =>
    api.post('/announcements/index.php', data),

  // Reports
  getReports: (range) =>
    api.get('/admin/reports.php', { params: { range } }),
};

// ── Driver ────────────────────────────────────────────
export const driverAPI = {
  getTrips: (type) =>
    api.get('/driver/trips.php', { params: { type } }),

  updateStatus: (scheduleId, status) =>
    api.post('/driver/trips.php', { schedule_id: scheduleId, status }),

  getManifest: (scheduleId) =>
    api.get('/driver/manifest.php', { params: { schedule_id: scheduleId } }),
};

// ── Public ────────────────────────────────────────────
export const publicAPI = {
  announcements: () =>
    api.get('/announcements/index.php'),
};

export default api;
