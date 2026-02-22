import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type NavbarProps = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="saas-nav">
      <div className="saas-container py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/dashboard" className="group inline-flex items-center gap-3 no-underline">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-sm font-bold text-blue-700 transition-all group-hover:scale-[1.02] dark:border-slate-700 dark:bg-slate-800/60">
              FB
            </span>
            <span>
              <p className="saas-kicker">Flashcard Builder</p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">Learning Workspace</h1>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && <span className="saas-badge hidden lg:inline-flex">{user.name}</span>}
            <Link to="/create" className="saas-btn-secondary hidden px-3 py-2 text-sm md:inline-flex">
              New Deck
            </Link>
            <button type="button" onClick={onToggleTheme} className="saas-theme-toggle" aria-label="Toggle theme">
              <span className="saas-theme-toggle-thumb" />
              <span className="saas-theme-toggle-text">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
            <button type="button" onClick={logout} className="saas-btn-secondary px-3 py-2 text-sm">
              Logout
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
