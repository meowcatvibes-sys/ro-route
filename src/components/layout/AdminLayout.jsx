import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bus, LayoutDashboard, Calendar, Users, Truck,
  BookOpen, BarChart3, Megaphone, LogOut, ChevronLeft, Menu
} from 'lucide-react';
import { useState } from 'react';
import './AdminLayout.css';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/admin/buses', icon: Truck, label: 'Buses' },
  { to: '/admin/drivers', icon: Users, label: 'Drivers' },
  { to: '/admin/bookings', icon: BookOpen, label: 'Bookings' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`admin-layout ${collapsed ? 'admin-layout--collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="admin-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">
            <div className="admin-sidebar__logo-icon">
              <Bus size={20} />
            </div>
            {!collapsed && (
              <div className="admin-sidebar__logo-text">
                <span className="admin-sidebar__brand">Ro-Route</span>
                <span className="admin-sidebar__role">Admin Panel</span>
              </div>
            )}
          </div>
          <button
            className="admin-sidebar__toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          {!collapsed && (
            <div className="admin-sidebar__user">
              <div className="admin-sidebar__avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="admin-sidebar__user-name">{user?.name}</p>
                <p className="admin-sidebar__user-role">Administrator</p>
              </div>
            </div>
          )}
          <button className="admin-sidebar__logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-topbar__menu" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="admin-topbar__spacer" />
          <div className="admin-topbar__user">
            <span>Welcome, <strong>{user?.name}</strong></span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
