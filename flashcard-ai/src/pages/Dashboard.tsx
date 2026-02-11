import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createDeck,
  createSubject,
  getCardsByDeck,
  getDecks,
  getDecksBySubject,
  getReviewHistory,
  getSubjects
} from '../lib/storage';
import type { Deck, Subject } from '../types/models';

type DashboardStats = {
  totalCards: number;
  dueToday: number;
  accuracy: number;
};

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [decksBySubject, setDecksBySubject] = useState<Record<string, Deck[]>>({});
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0,
    dueToday: 0,
    accuracy: 0
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let subs = await getSubjects();

      if (subs.length === 0) {
        const s1 = await createSubject('Computer Science', 'DSA, OS, DBMS');
        const s2 = await createSubject('Maths', 'Linear Algebra, Calculus');

        await createDeck(s1.id, 'Data Structures');
        await createDeck(s1.id, 'Operating Systems');
        await createDeck(s2.id, 'Linear Algebra');

        subs = await getSubjects();
      }

      if (cancelled) return;
      setSubjects(subs);

      const deckMap: Record<string, Deck[]> = {};
      for (const subject of subs) {
        deckMap[subject.id] = await getDecksBySubject(subject.id);
      }

      if (cancelled) return;
      setDecksBySubject(deckMap);

      const allDecks = await getDecks();
      const allCardsNested = await Promise.all(allDecks.map(deck => getCardsByDeck(deck.id)));
      const allCards = allCardsNested.flat();
      const reviewHistory = await getReviewHistory();
      const correctReviews = reviewHistory.filter(item => item.quality >= 4).length;
      const accuracy = reviewHistory.length > 0 ? Math.round((correctReviews / reviewHistory.length) * 100) : 0;
      const dueToday = allCards.filter(card => card.reviewState.due <= Date.now()).length;

      if (cancelled) return;
      setStats({
        totalCards: allCards.length,
        dueToday,
        accuracy
      });
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const subjectCount = useMemo(() => subjects.length, [subjects.length]);

  return (
    <div className="space-y-8">
      <section className="saas-surface p-8 md:p-10">
        <p className="saas-kicker">Overview</p>
        <h1 className="saas-title mt-3">Productive learning, designed for speed</h1>
        <p className="saas-subtitle mt-4 max-w-3xl">
          Manage your decks, track what is due, and jump straight into review sessions with a clean structured workflow.
        </p>
      </section>

      <section className="flex gap-4 overflow-x-auto pb-1">
        <Link to="/create" className="saas-surface min-w-[250px] p-5">
          <p className="saas-kicker">Primary Option</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Create Cards</h2>
          <p className="mt-2 text-sm text-slate-500">Import content and produce flashcards quickly.</p>
        </Link>

        <Link to="/study" className="saas-surface min-w-[250px] p-5">
          <p className="saas-kicker">Primary Option</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Study Session</h2>
          <p className="mt-2 text-sm text-slate-500">Review due cards with keyboard-friendly controls.</p>
        </Link>

        <Link to="/analytics" className="saas-surface min-w-[250px] p-5">
          <p className="saas-kicker">Primary Option</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Analytics</h2>
          <p className="mt-2 text-sm text-slate-500">Monitor retention and review quality over time.</p>
        </Link>

        <a href="#deck-library" className="saas-surface min-w-[250px] p-5">
          <p className="saas-kicker">Primary Option</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Deck Library</h2>
          <p className="mt-2 text-sm text-slate-500">Browse subjects and open a deck instantly.</p>
        </a>
      </section>

      <section className="saas-grid-main">
        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Total Cards</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalCards}</p>
          <p className="mt-1 text-sm text-slate-400">{subjectCount} subject(s)</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Due Today</p>
          <p className="mt-2 text-3xl font-semibold text-blue-700">{stats.dueToday}</p>
          <p className="mt-1 text-sm text-slate-400">Cards waiting for review</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Accuracy</p>
          <p className="mt-2 text-3xl font-semibold text-blue-700">{stats.accuracy}%</p>
          <p className="mt-1 text-sm text-slate-400">From review history</p>
        </article>
      </section>

      <section id="deck-library" className="space-y-6">
        {subjects.map(subject => (
          <article key={subject.id} className="saas-surface p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{subject.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{subject.description}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {decksBySubject[subject.id]?.length ?? 0} deck(s)
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {decksBySubject[subject.id]?.map(deck => (
                <div key={deck.id} className="saas-surface-soft p-5">
                  <p className="text-lg font-semibold text-slate-900">{deck.name}</p>
                  <p className="mt-2 text-sm text-slate-500">Open deck and manage cards</p>
                  <div className="mt-4 flex gap-2">
                    <Link to={`/deck/${deck.id}`} className="saas-btn-secondary px-3 py-1.5 text-xs">
                      Manage
                    </Link>
                    <Link to={`/study/${deck.id}`} className="saas-btn-primary rounded-full px-3 py-1.5 text-xs">
                      Study
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
