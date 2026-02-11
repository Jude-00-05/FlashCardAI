// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/create', label: 'Create / Import' },
  { to: '/study', label: 'Study' },
  { to: '/analytics', label: 'Analytics' }
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="flex h-full flex-col p-5">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Flashcard AI</p>
          <h1 className="mt-2 text-xl font-bold text-white">Builder</h1>
        </div>

        <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">Navigation</div>

        <nav className="flex flex-col gap-2">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1DB954]/15 text-[#1DB954] ring-1 ring-[#1DB954]/30'
                    : 'text-gray-300 hover:bg-[#1E1E1E] hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-[#2A2A2A] bg-[#151515] p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Tip</p>
          <p className="mt-2 text-sm text-gray-300">
            Press <span className="rounded bg-[#252525] px-1.5 py-0.5 text-xs text-gray-200">Space</span> in
            Study mode to flip cards.
          </p>
        </div>
      </div>
    </aside>
  );
}
