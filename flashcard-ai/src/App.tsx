import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

export default function App({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="saas-shell">
      <div className="saas-orb saas-orb-a" />
      <div className="saas-orb saas-orb-b" />

      <Navbar />

      <div className="saas-container grid gap-8 py-10 xl:grid-cols-[1fr_248px]">
        <main key={location.pathname} className="saas-page space-y-8">
          {children}
        </main>
        <aside className="hidden xl:block">
          <div className="saas-surface sticky top-24 p-5">
            <p className="saas-kicker">Focus</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Study Rhythm</h2>
            <p className="mt-2 text-sm text-slate-500">
              Review daily in short sessions. Small streaks beat long cramming.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
