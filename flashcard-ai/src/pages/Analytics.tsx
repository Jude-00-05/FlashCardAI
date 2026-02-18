import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getCardsByDeck, getDecks, getReviewHistory } from '../lib/storage';
import type { ReviewHistoryEntry } from '../types/models';

const DAYS_WINDOW = 14;

type AnalyticsStats = {
  totalCards: number;
  dueToday: number;
  reviewsCompleted: number;
  accuracy: number;
};

function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLastNDaysWindow(days: number): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const dt = new Date(today);
    dt.setDate(today.getDate() - i);
    result.push({
      key: toDayKey(dt),
      label: dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    });
  }

  return result;
}

function getThemeToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function Analytics() {
  const [history, setHistory] = useState<ReviewHistoryEntry[]>([]);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalCards: 0,
    dueToday: 0,
    reviewsCompleted: 0,
    accuracy: 0
  });
  const [loading, setLoading] = useState(true);
  const [themeMarker, setThemeMarker] = useState(() => document.documentElement.className);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'line', number[], string> | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);

      const [reviewHistory, decks] = await Promise.all([getReviewHistory(), getDecks()]);
      const cardsByDeck = await Promise.all(decks.map(deck => getCardsByDeck(deck.id)));
      const allCards = cardsByDeck.flat();

      const reviewsCompleted = reviewHistory.length;
      const correct = reviewHistory.filter(entry => entry.quality >= 4).length;
      const accuracy = reviewsCompleted > 0 ? Math.round((correct / reviewsCompleted) * 100) : 0;
      const dueToday = allCards.filter(card => card.reviewState.due <= Date.now()).length;

      setHistory(reviewHistory);
      setStats({
        totalCards: allCards.length,
        dueToday,
        reviewsCompleted,
        accuracy
      });
      setLoading(false);
    }

    void run();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeMarker(document.documentElement.className);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const reviewsByDay = useMemo(() => {
    const windowDays = getLastNDaysWindow(DAYS_WINDOW);
    const counts = new Map<string, number>();

    for (const day of windowDays) counts.set(day.key, 0);

    for (const entry of history) {
      const key = toDayKey(new Date(entry.reviewedAt));
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return {
      labels: windowDays.map(day => day.label),
      values: windowDays.map(day => counts.get(day.key) ?? 0)
    };
  }, [history]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const accent = getThemeToken('--accent');
    const accentSoft = getThemeToken('--accent-soft');
    const textMuted = getThemeToken('--text-muted');
    const borderSubtle = getThemeToken('--border-subtle');

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels: reviewsByDay.labels,
        datasets: [
          {
            label: 'Reviews',
            data: reviewsByDay.values,
            borderColor: accent,
            backgroundColor: accentSoft,
            fill: true,
            tension: 0.32,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 4,
            pointBackgroundColor: accent,
            pointBorderColor: accent
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textMuted }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: textMuted },
            grid: { color: borderSubtle }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [reviewsByDay, themeMarker]);

  if (loading) {
    return <div className="saas-surface p-6 text-sm text-slate-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="saas-surface p-8 md:p-10">
        <p className="saas-kicker">Insights</p>
        <h1 className="saas-title mt-3">Analytics</h1>
        <p className="saas-subtitle mt-3 max-w-2xl">Track workload, outcomes, and daily study consistency.</p>
      </section>

      <section className="saas-grid-main">
        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Total Cards</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{stats.totalCards}</p>
          <p className="mt-1 text-sm text-slate-400">Across all subjects and decks</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Due Today</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-700">{stats.dueToday}</p>
          <p className="mt-1 text-sm text-slate-400">Cards ready for immediate review</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Reviews Completed</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{stats.reviewsCompleted}</p>
          <p className="mt-1 text-sm text-slate-400">All stored review attempts</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Accuracy</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-700">{stats.accuracy}%</p>
          <p className="mt-1 text-sm text-slate-400">Grades 4 and 5 counted as correct</p>
        </article>
      </section>

      <section className="saas-surface p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Reviews Per Day</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Last {DAYS_WINDOW} days</span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No review history yet. Complete a study session to populate analytics.</p>
        ) : (
          <div className="h-80 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
            <canvas ref={canvasRef} />
          </div>
        )}
      </section>
    </div>
  );
}
