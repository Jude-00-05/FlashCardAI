// src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/create', label: 'Create / Import' },
  { to: '/analytics', label: 'Analytics' }
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-white border-r">
      <div className="p-4">
        <div className="text-xs text-gray-400 uppercase mb-3">Navigation</div>
        <nav className="flex flex-col gap-1">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded text-sm ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
