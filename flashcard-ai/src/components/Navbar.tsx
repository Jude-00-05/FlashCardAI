import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/create', label: 'Create / Import' },
  { to: '/study', label: 'Study' },
  { to: '/analytics', label: 'Analytics' }
];

export default function Navbar() {
  return (
    <header className="saas-nav">
      <div className="saas-container py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="saas-kicker">Flashcard Builder</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Learning Workspace</h1>
          </div>
          <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 lg:inline-flex">
            Client-side AI
          </span>
        </div>

        <nav className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `saas-pill-nav ${
                  isActive ? 'saas-pill-nav-active' : ''
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
