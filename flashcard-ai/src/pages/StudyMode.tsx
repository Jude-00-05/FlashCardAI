import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { updateSM2 } from '../lib/scheduler';
import { getCardsByDeck, getDueCards, saveReview } from '../lib/storage';
import type { Card } from '../types/models';

type Grade = 1 | 2 | 3 | 4 | 5;
type GradeCounts = Record<Grade, number>;

const INITIAL_GRADE_COUNTS: GradeCounts = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0
};

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

  const grade = useCallback(
    (quality: number) => {
      if (!card) return;
      if (quality < 1 || quality > 5) return;

      const safeQuality = quality as Grade;
      const updated = updateSM2(card.reviewState, safeQuality);
      void saveReview(card.id, updated, safeQuality);

      setGradeCounts(prev => ({
        ...prev,
        [safeQuality]: prev[safeQuality] + 1
      }));
      setReviewedCount(prev => prev + 1);
      setShowBack(false);

      if (index >= totalCards - 1) {
        setSessionComplete(true);
        setIndex(totalCards);
        return;
      }

      setIndex(prev => prev + 1);
    },
    [card, index, totalCards]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setShowBack(prev => !prev);
      }

      if (showBack && e.key >= '1' && e.key <= '5') {
        grade(Number(e.key));
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, showBack, grade]);

  if (isLoading) {
    return <div className="mt-8 text-center text-sm text-slate-500">Loading due cards...</div>;
  }

  if (totalCards === 0) {
    return (
      <div className="saas-surface mx-auto mt-10 max-w-2xl p-8 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">No cards due right now</h2>
        <p className="mt-2 text-sm text-slate-500">You are all caught up.</p>
        <Link to="/dashboard" className="mt-5 inline-block text-sm font-semibold text-blue-700">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (summaryVisible) {
    return (
      <div className="saas-surface mx-auto mt-8 max-w-3xl p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Session Summary</h2>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="saas-surface-soft p-4">
            <p className="text-slate-500">Reviewed</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{reviewedCount}</p>
          </div>
          <div className="saas-surface-soft p-4">
            <p className="text-slate-500">Accuracy</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{accuracy}%</p>
          </div>
          <div className="saas-surface-soft p-4">
            <p className="text-slate-500">Average Grade</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{averageGrade}</p>
          </div>
          <div className="saas-surface-soft p-4">
            <p className="text-slate-500">Hard (1-2)</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{gradeCounts[1] + gradeCounts[2]}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => void loadDueCards()} className="saas-btn-primary px-4 py-2 text-sm">
            Check Due Cards Again
          </button>
          <Link to="/dashboard" className="saas-btn-secondary px-4 py-2 text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentPosition = index + 1;
  const progressPercent = Math.round((currentPosition / totalCards) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span>
          {currentPosition} / {totalCards}
        </span>
        <span>{progressPercent}%</span>
      </div>

      <div className="mb-5 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-blue-600 transition-all duration-200" style={{ width: `${progressPercent}%` }} />
      </div>

      <button
        type="button"
        onClick={() => setShowBack(prev => !prev)}
        className="saas-flashcard-scene text-left"
        aria-label="Flip flashcard"
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
            <p className="mt-8 text-sm text-slate-500">Click card again to flip back</p>
          </div>
        </div>
      </button>

      <div className="mt-5">
        {!showBack ? (
          <p className="text-sm text-slate-500">Flip the card to reveal the answer.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(q => (
              <button key={q} onClick={() => grade(q)} className="saas-btn-primary rounded-full px-4 py-2 text-sm">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
