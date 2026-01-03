// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-lg font-semibold text-brand-500">
          Flashcard Builder
        </Link>
        <span className="text-sm text-gray-500">Build · Study · Track</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link to="/create" className="px-3 py-1 rounded bg-brand-500 text-white">
          Create
        </Link>
        <Link to="/analytics" className="text-gray-600 hover:text-gray-900">
          Analytics
        </Link>
        <Link to="/auth" className="text-gray-600 hover:text-gray-900">
          Sign in
        </Link>
      </div>
    </header>
  );
}
