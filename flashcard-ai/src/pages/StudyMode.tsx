import { useEffect, useState } from 'react';
import { updateSM2 } from '../lib/scheduler';
import { getDueCards, saveReview } from '../lib/storage';
import type { Card } from '../types/models';

export default function StudyMode() {
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    getDueCards().then(setCards);
  }, []);

  const card = cards[index];

  function grade(quality: number) {
    if (!card) return;

    const updated = updateSM2(card.reviewState, quality);
    saveReview(card.id, updated);

    setShowBack(false);
    setIndex(i => i + 1);
  }

  // ✅ HOOK MUST BE HERE — BEFORE RETURN
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        setShowBack(s => !s);
      }
      if (showBack && e.key >= '1' && e.key <= '5') {
        grade(Number(e.key));
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showBack, card]);

  if (!card) {
    return (
      <div className="text-center text-gray-500 mt-10">
        No cards due 🎉
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center">
      <div className="p-6 border rounded shadow bg-white">
        <h2 className="text-lg font-medium">{card.front}</h2>

        {showBack && (
          <p className="mt-4 text-gray-700 whitespace-pre-wrap">
            {card.back}
          </p>
        )}
      </div>

      <div className="mt-4">
        {!showBack ? (
          <button
            onClick={() => setShowBack(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded"
          >
            Show Answer (Space)
          </button>
        ) : (
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(q => (
              <button
                key={q}
                onClick={() => grade(q)}
                className="px-3 py-1 border rounded"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
