import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookImage, Star } from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/library', label: 'Reference Library', icon: BookImage },
  { to: '/favorites', label: 'Favorites', icon: Star },
];

export default function Layout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-wordmark">
            <span className="logo-monsta">MONSTA</span>
            <span className="logo-md">Media &amp; Design</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="api-status">
            <div className="api-dot" />
            <span>OpenAI API</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
