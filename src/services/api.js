import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
    api.post('/auth/login', { email, password }),

  register: (data) =>
    api.post('/auth/register', data),

  me: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};

// ── Schedules ─────────────────────────────────────────
export const schedulesAPI = {
  list: (params) =>
    api.get('/schedules/index', { params }),

  show: (id) =>
    api.get('/schedules/show', { params: { id } }),
};

// ── Bookings ──────────────────────────────────────────
export const bookingsAPI = {
  list: (params) =>
    api.get('/bookings/index', { params }),

  show: (id) =>
    api.get('/bookings/show', { params: { id } }),

  create: (data) =>
    api.post('/bookings/store', data),

  cancel: (id) =>
    api.post('/bookings/cancel', { id }),
};

// ── Admin ─────────────────────────────────────────────
export const adminAPI = {
  dashboard: () =>
    api.get('/admin/dashboard'),

  // Buses
  getBuses: () =>
    api.get('/admin/buses'),
  saveBus: (data) =>
    api.post('/admin/buses', data),

  // Drivers
  getDrivers: () =>
    api.get('/admin/drivers'),
  saveDriver: (data) =>
    api.post('/admin/drivers', data),

  // Schedules
  getSchedules: () =>
    api.get('/admin/schedules'),
  saveSchedule: (data) =>
    api.post('/admin/schedules', data),

  // Users
  getUsers: (params) =>
    api.get('/admin/users', { params }),

  // Announcements
  getAnnouncements: () =>
    api.get('/announcements/index'),
  saveAnnouncement: (data) =>
    api.post('/announcements/index', data),

  // Reports
  getReports: (range) =>
    api.get('/admin/reports', { params: { range } }),
};

// ── Driver ────────────────────────────────────────────
export const driverAPI = {
  getTrips: (type) =>
    api.get('/driver/trips', { params: { type } }),

  updateStatus: (scheduleId, status) =>
    api.post('/driver/trips', { schedule_id: scheduleId, status }),

  getManifest: (scheduleId) =>
    api.get('/driver/manifest', { params: { schedule_id: scheduleId } }),
};

// ── Public ────────────────────────────────────────────
export const publicAPI = {
  announcements: () =>
    api.get('/announcements/index'),
};

export default api;
