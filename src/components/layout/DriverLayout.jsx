import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bus, LayoutDashboard, MapPin, ClipboardList,
  History, User, LogOut, Menu
} from 'lucide-react';
import { useState } from 'react';
import './DriverLayout.css';

const navItems = [
  { to: '/driver/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/driver/trips', icon: MapPin, label: 'My Trips' },
  { to: '/driver/history', icon: History, label: 'Trip History' },
  { to: '/driver/profile', icon: User, label: 'Profile' },
];

export default function DriverLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="driver-layout">
      {mobileOpen && (
        <div className="driver-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`driver-sidebar ${mobileOpen ? 'driver-sidebar--open' : ''}`}>
        <div className="driver-sidebar__header">
          <div className="driver-sidebar__logo">
            <div className="driver-sidebar__logo-icon">
              <Bus size={20} />
            </div>
            <div>
              <span className="driver-sidebar__brand">Ro-Route</span>
              <span className="driver-sidebar__role">Driver Panel</span>
            </div>
          </div>
        </div>

        <nav className="driver-sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `driver-sidebar__link ${isActive ? 'driver-sidebar__link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="driver-sidebar__footer">
          <div className="driver-sidebar__user">
            <div className="driver-sidebar__avatar">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <p className="driver-sidebar__user-name">{user?.name}</p>
              <p className="driver-sidebar__user-role">Driver</p>
            </div>
          </div>
          <button className="driver-sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="driver-main">
        <header className="driver-topbar">
          <button className="driver-topbar__menu" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div style={{ flex: 1 }} />
          <span className="driver-topbar__greeting">
            Welcome, <strong>{user?.name}</strong>
          </span>
        </header>
        <div className="driver-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
