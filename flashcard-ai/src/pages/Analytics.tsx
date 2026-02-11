import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { getReviewHistory } from '../lib/storage';
import type { ReviewHistoryEntry } from '../types/models';

const DAYS_WINDOW = 14;

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

export default function Analytics() {
  const [history, setHistory] = useState<ReviewHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart<'line', number[], string> | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const data = await getReviewHistory();
      setHistory(data);
      setLoading(false);
    }
    void run();
  }, []);

  const totalReviews = history.length;

  const accuracy = useMemo(() => {
    if (history.length === 0) return 0;
    const correct = history.filter(entry => entry.quality >= 4).length;
    return Math.round((correct / history.length) * 100);
  }, [history]);

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
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.14)',
            fill: true,
            tension: 0.32,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 4
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
            ticks: { color: '#64748b' }
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#64748b' },
            grid: { color: 'rgba(148, 163, 184, 0.25)' }
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
  }, [reviewsByDay]);

  if (loading) {
    return <div className="saas-surface p-6 text-sm text-slate-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="saas-surface p-8 md:p-10">
        <p className="saas-kicker">Insights</p>
        <h1 className="saas-title mt-3">Analytics</h1>
        <p className="saas-subtitle mt-3 max-w-2xl">Track learning consistency and quality trends at a glance.</p>
      </section>

      <section className="saas-grid-main">
        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Total Reviews</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{totalReviews}</p>
          <p className="mt-1 text-sm text-slate-400">All recorded study evaluations</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Accuracy</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-700">{accuracy}%</p>
          <p className="mt-1 text-sm text-slate-400">Grades 4-5 count as correct</p>
        </article>

        <article className="saas-surface p-6">
          <p className="text-sm text-slate-500">Window</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Last {DAYS_WINDOW} days</p>
          <p className="mt-1 text-sm text-slate-400">Rolling activity trend window</p>
        </article>
      </section>

      <section className="saas-surface p-6 md:p-7">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Reviews Per Day</h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{DAYS_WINDOW} day trend</span>
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