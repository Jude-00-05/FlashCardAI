import type { PropsWithChildren } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    const dot = cursorDotRef.current;
    const glow = cursorGlowRef.current;
    if (!dot || !glow) return;

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let glowX = targetX;
    let glowY = targetY;

    document.documentElement.classList.add('cursor-dot-enabled');

    const animate = () => {
      glowX += (targetX - glowX) * 0.18;
      glowY += (targetY - glowY) * 0.18;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
      raf = window.requestAnimationFrame(animate);
    };

    const onMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.classList.add('is-visible');
      glow.classList.add('is-visible');
    };

    window.addEventListener('mousemove', onMove);
    raf = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.classList.remove('cursor-dot-enabled');
    };
  }, []);

  if (isAuthRoute) {
    return (
      <div className="saas-shell">
        <div ref={cursorGlowRef} className="saas-cursor-glow" aria-hidden="true" />
        <div ref={cursorDotRef} className="saas-cursor-dot" aria-hidden="true" />
        {children}
      </div>
    );
  }

  return (
    <div className="saas-shell">
      <div ref={cursorGlowRef} className="saas-cursor-glow" aria-hidden="true" />
      <div ref={cursorDotRef} className="saas-cursor-dot" aria-hidden="true" />
      <div className="saas-rgb-el" aria-hidden="true" />
      <div className="saas-orb saas-orb-a" />
      <div className="saas-orb saas-orb-b" />

      <Navbar theme={theme} onToggleTheme={handleThemeToggle} />

      <div className="saas-container py-10">
        <main key={location.pathname} className="saas-page space-y-10">
          {children}
        </main>
      </div>
    </div>
  );
}
