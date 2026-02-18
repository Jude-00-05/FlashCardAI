import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'flashcard-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : null;
}

export default function App({ children }: PropsWithChildren) {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  const [savedTheme, setSavedTheme] = useState<Theme | null>(() => getSavedTheme());
  const [systemTheme, setSystemTheme] = useState<Theme>(() => getSystemTheme());

  const theme = useMemo<Theme>(() => savedTheme ?? systemTheme, [savedTheme, systemTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (savedTheme) {
      window.localStorage.setItem(THEME_STORAGE_KEY, savedTheme);
      return;
    }

    window.localStorage.removeItem(THEME_STORAGE_KEY);
  }, [savedTheme]);

  function handleThemeToggle() {
    setSavedTheme(prev => {
      const current = prev ?? systemTheme;
      return current === 'dark' ? 'light' : 'dark';
    });
  }

  if (isAuthRoute) {
    return <div className="saas-shell">{children}</div>;
  }

  return (
    <div className="saas-shell">
      <div className="saas-orb saas-orb-a" />
      <div className="saas-orb saas-orb-b" />

      <Navbar theme={theme} onToggleTheme={handleThemeToggle} />

      <section className="saas-container relative z-10 pt-8">
        <div className="saas-surface p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="saas-kicker">Learning Platform</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Build. Review. Retain.</h2>
              <p className="mt-4 text-sm text-slate-500 sm:text-base">
                Structured flashcard workflows with deterministic generation, spaced repetition, and clean progress
                tracking.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <article className="saas-surface-soft rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Modes</p>
                <p className="mt-2 text-xl font-semibold">Create + Study</p>
              </article>
              <article className="saas-surface-soft rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Engine</p>
                <p className="mt-2 text-xl font-semibold">SM-2 Ready</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div className="saas-container grid gap-10 py-10 xl:grid-cols-[minmax(0,1fr)_280px]">
        <main key={location.pathname} className="saas-page space-y-10">
          {children}
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-4">
            <div className="saas-surface p-6">
              <p className="saas-kicker">Focus</p>
              <h3 className="mt-3 text-lg font-semibold">Study Rhythm</h3>
              <p className="mt-3 text-sm text-slate-500">
                Daily short sessions outperform cramming. Keep a steady due-card routine.
              </p>
            </div>

            <div className="saas-surface-soft rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Workflow</p>
              <ol className="mt-3 space-y-2 text-sm text-slate-500">
                <li>1. Import or create cards</li>
                <li>2. Review due queue</li>
                <li>3. Track performance</li>
              </ol>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
