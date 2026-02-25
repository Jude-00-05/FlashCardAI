import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

export default function App({ children }: PropsWithChildren) {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  const cursorDotRef = useRef<HTMLDivElement | null>(null);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add('theme-dark');
    root.style.colorScheme = 'dark';
  }, []);

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

      <Navbar />

      <div className="saas-container py-10">
        <main key={location.pathname} className="saas-page space-y-10">
          {children}
        </main>
      </div>
    </div>
  );
}
