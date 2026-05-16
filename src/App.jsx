import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './routes/ProtectedRoute';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';
import DriverLayout from './components/layout/DriverLayout';

// Public Pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Announcements from './pages/public/Announcements';

// Passenger Pages
import Schedules from './pages/passenger/Schedules';
import TripDetail from './pages/passenger/TripDetail';
import MyBookings from './pages/passenger/MyBookings';
import BookingDetail from './pages/passenger/BookingDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBuses from './pages/admin/AdminBuses';
import AdminDrivers from './pages/admin/AdminDrivers';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminBookings from './pages/admin/AdminBookings';
import AdminReports from './pages/admin/AdminReports';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminUsers from './pages/admin/AdminUsers';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverTrips from './pages/driver/DriverTrips';
import DriverHistory from './pages/driver/DriverHistory';

// Shared Pages
import UserProfile from './pages/shared/UserProfile';

// Placeholder
import ComingSoon from './pages/ComingSoon';

import './App.css';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/schedules" element={<PublicLayout><Schedules /></PublicLayout>} />
          <Route path="/schedules/:id" element={<PublicLayout><TripDetail /></PublicLayout>} />
          <Route path="/announcements" element={<PublicLayout><Announcements /></PublicLayout>} />

          {/* Passenger */}
          <Route path="/my-bookings" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <PublicLayout><MyBookings /></PublicLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-bookings/:id" element={
            <ProtectedRoute allowedRoles={['passenger']}>
              <PublicLayout><BookingDetail /></PublicLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['passenger', 'admin', 'driver']}>
              <PublicLayout><UserProfile /></PublicLayout>
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="schedules" element={<AdminSchedules />} />
            <Route path="buses" element={<AdminBuses />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Driver */}
          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<DriverDashboard />} />
            <Route path="trips" element={<DriverTrips />} />
            <Route path="history" element={<DriverHistory />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<PublicLayout><ComingSoon /></PublicLayout>} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
