import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { updateSM2 } from '../lib/scheduler';
import { getCardsByDeck, getDueCards, saveReview } from '../lib/storage';
import type { Card } from '../types/models';

type Grade = 1 | 2 | 3 | 4 | 5;
type GradeCounts = Record<Grade, number>;
type TransitionPhase = 'idle' | 'exiting' | 'entering';

const INITIAL_GRADE_COUNTS: GradeCounts = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0
};

const GRADE_OPTIONS: Array<{ value: Grade; label: string; description: string }> = [
  { value: 1, label: '1', description: 'Forgot completely' },
  { value: 2, label: '2', description: 'Hard recall' },
  { value: 3, label: '3', description: 'Partial recall' },
  { value: 4, label: '4', description: 'Good recall' },
  { value: 5, label: '5', description: 'Perfect recall' }
];

function shuffleCards(cards: Card[]): Card[] {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function StudyMode() {
  const { deckId } = useParams<{ deckId?: string }>();

  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [gradeCounts, setGradeCounts] = useState<GradeCounts>(INITIAL_GRADE_COUNTS);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');

  const loadDueCards = useCallback(async () => {
    setIsLoading(true);

    const now = Date.now();
    const dueCards = deckId
      ? (await getCardsByDeck(deckId)).filter(card => card.reviewState.due <= now)
      : await getDueCards();

    setCards(shuffleCards(dueCards));
    setIndex(0);
    setShowBack(false);
    setSessionComplete(false);
    setReviewedCount(0);
    setGradeCounts(INITIAL_GRADE_COUNTS);
    setTransitionPhase('idle');
    setIsLoading(false);
  }, [deckId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDueCards();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDueCards]);

  const card = cards[index];
  const totalCards = cards.length;
  const summaryVisible = totalCards > 0 && (sessionComplete || !card);

  const accuracy = useMemo(() => {
    if (reviewedCount === 0) return 0;
    const correct = gradeCounts[4] + gradeCounts[5];
    return Math.round((correct / reviewedCount) * 100);
  }, [gradeCounts, reviewedCount]);

  const averageGrade = useMemo(() => {
    if (reviewedCount === 0) return 0;
    const weightedTotal =
      gradeCounts[1] * 1 +
      gradeCounts[2] * 2 +
      gradeCounts[3] * 3 +
      gradeCounts[4] * 4 +
      gradeCounts[5] * 5;
    return (weightedTotal / reviewedCount).toFixed(2);
  }, [gradeCounts, reviewedCount]);

  const isTransitioning = transitionPhase !== 'idle';

  const grade = useCallback(
    (quality: number) => {
      if (!card || isTransitioning) return;
      if (quality < 1 || quality > 5) return;

      const safeQuality = quality as Grade;
      const updated = updateSM2(card.reviewState, safeQuality);
      void saveReview(card.id, updated, safeQuality);

      setTransitionPhase('exiting');
      setShowBack(false);

      window.setTimeout(() => {
        setGradeCounts(prev => ({
          ...prev,
          [safeQuality]: prev[safeQuality] + 1
        }));
        setReviewedCount(prev => prev + 1);

        if (index >= totalCards - 1) {
          setSessionComplete(true);
          setIndex(totalCards);
          setTransitionPhase('idle');
          return;
        }

        setIndex(prev => prev + 1);
        setTransitionPhase('entering');

        window.setTimeout(() => {
          setTransitionPhase('idle');
        }, 140);
      }, 170);
    },
    [card, index, isTransitioning, totalCards]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!card || isTransitioning) return;

      if (event.code === 'Space') {
        event.preventDefault();
        setShowBack(prev => !prev);
      }

      if (showBack && event.key >= '1' && event.key <= '5') {
        grade(Number(event.key));
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, showBack, grade, isTransitioning]);

  if (isLoading) {
    return <div className="mt-8 text-center text-sm text-slate-500">Loading due cards...</div>;
  }

  if (totalCards === 0) {
    return (
      <div className="saas-surface mx-auto mt-10 max-w-2xl p-10 text-center">
        <h2 className="text-3xl font-semibold">No cards due right now</h2>
        <p className="mt-3 text-sm text-slate-500">You are all caught up.</p>
        <Link to="/dashboard" className="mt-6 inline-block text-sm font-semibold text-blue-700">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (summaryVisible) {
    return (
      <div className="saas-surface mx-auto mt-8 max-w-4xl p-8">
        <p className="saas-kicker">Session Complete</p>
        <h2 className="mt-3 text-3xl font-semibold">Review Summary</h2>
        <p className="mt-2 text-sm text-slate-500">Great session. Your updates are saved to the SM-2 schedule.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <div className="saas-surface-soft p-5">
            <p className="text-sm text-slate-500">Cards Studied</p>
            <p className="mt-2 text-3xl font-semibold">{reviewedCount}</p>
          </div>
          <div className="saas-surface-soft p-5">
            <p className="text-sm text-slate-500">Accuracy</p>
            <p className="mt-2 text-3xl font-semibold text-blue-700">{accuracy}%</p>
          </div>
          <div className="saas-surface-soft p-5">
            <p className="text-sm text-slate-500">Average Quality</p>
            <p className="mt-2 text-3xl font-semibold">{averageGrade}</p>
          </div>
          <div className="saas-surface-soft p-5">
            <p className="text-sm text-slate-500">Hard Cards (1-2)</p>
            <p className="mt-2 text-3xl font-semibold">{gradeCounts[1] + gradeCounts[2]}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs text-slate-500 sm:grid-cols-5">
          {GRADE_OPTIONS.map(option => (
            <div key={option.value} className="rounded-lg bg-white/80 px-3 py-2 text-center">
              <p className="font-semibold text-slate-900">{option.value}</p>
              <p className="mt-1">{gradeCounts[option.value]} card(s)</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          <button onClick={() => void loadDueCards()} className="saas-btn-primary px-4 py-2 text-sm">
            Start Another Session
          </button>
          <Link to="/dashboard" className="saas-btn-secondary px-4 py-2 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentPosition = index + 1;
  const cardsRemaining = Math.max(totalCards - currentPosition, 0);
  const progressPercent = Math.round((currentPosition / totalCards) * 100);

  const transitionClass =
    transitionPhase === 'exiting'
      ? 'translate-y-2 opacity-0'
      : transitionPhase === 'entering'
        ? '-translate-y-2 opacity-0'
        : 'translate-y-0 opacity-100';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="saas-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="saas-kicker">Study Session</p>
            <h1 className="mt-2 text-2xl font-semibold">Due Cards Review</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {currentPosition} / {totalCards}
            </span>
            <button onClick={() => void loadDueCards()} className="saas-btn-secondary px-3 py-2 text-xs">
              Reshuffle
            </button>
          </div>
        </div>

        <div className="mt-5 h-2 w-full rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{progressPercent}% complete</span>
          <span>{cardsRemaining} remaining</span>
        </div>
      </section>

      <div className={`transition-all duration-200 ${transitionClass}`}>
        <button
          key={card.id}
          type="button"
          onClick={() => setShowBack(prev => !prev)}
          className="saas-flashcard-scene text-left"
          aria-label="Flip flashcard"
          disabled={isTransitioning}
        >
          <div className={`saas-flashcard ${showBack ? 'is-flipped' : ''}`}>
            <div className="saas-flashcard-face saas-flashcard-front">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Front</p>
              <h2 className="text-3xl font-semibold leading-snug text-slate-900">{card.front}</h2>
              <p className="mt-8 text-sm text-slate-500">Click card or press Space to flip</p>
            </div>
            <div className="saas-flashcard-face saas-flashcard-back">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Back</p>
              <p className="whitespace-pre-wrap text-lg text-slate-700">{card.back}</p>
              <p className="mt-8 text-sm text-slate-500">Use 1-5 keys or buttons to grade this review</p>
            </div>
          </div>
        </button>
      </div>

      <section className="saas-surface p-5">
        {!showBack ? (
          <p className="text-sm text-slate-500">Flip the card to reveal the answer and submit a quality score.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-5">
            {GRADE_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => grade(option.value)}
                className="saas-btn-primary rounded-xl px-3 py-2 text-sm"
                disabled={isTransitioning}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="mt-0.5 block text-[11px] font-medium opacity-90">{option.description}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
