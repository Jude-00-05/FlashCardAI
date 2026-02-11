// src/components/Header.tsx
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="app-header flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-xl font-bold tracking-tight text-white transition-colors hover:text-[#1DB954]">
          Flashcard Builder
        </Link>
        <span className="hidden text-sm text-gray-400 md:inline">Build | Study | Track</span>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link to="/create" className="spotify-primary rounded-xl px-4 py-2 font-semibold">
          Create
        </Link>
        <Link to="/analytics" className="rounded-xl px-3 py-2 text-gray-300 transition-all hover:bg-[#1E1E1E] hover:text-white">
          Analytics
        </Link>
        <Link to="/auth" className="rounded-xl px-3 py-2 text-gray-300 transition-all hover:bg-[#1E1E1E] hover:text-white">
          Sign in
        </Link>
      </div>
    </header>
  );
}
