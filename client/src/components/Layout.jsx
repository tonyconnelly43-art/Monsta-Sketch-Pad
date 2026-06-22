import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookImage, Wand2, Star } from 'lucide-react';
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
          <span className="logo-icon">
            <Wand2 size={22} color="#39ff14" />
          </span>
          <div>
            <div className="logo-name">Monsta</div>
            <div className="logo-sub">Sketch Pad</div>
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
