import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner--lg"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their proper dashboard
    const dashboardMap = {
      admin: '/admin/dashboard',
      driver: '/driver/dashboard',
      passenger: '/schedules',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return children;
}
