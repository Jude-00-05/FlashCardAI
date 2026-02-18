import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deleteCard, getCardsByDeck, getDeckById, updateCard } from '../lib/storage';
import type { Card } from '../types/models';

type EditorState = {
  front: string;
  back: string;
};

function formatDueDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function DeckView() {
  const { deckId } = useParams<{ deckId: string }>();

  const [deckName, setDeckName] = useState('Deck');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [savingCardId, setSavingCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [flippedCardIds, setFlippedCardIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!deckId) {
      setError('Missing deck id in route.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [deck, deckCards] = await Promise.all([getDeckById(deckId), getCardsByDeck(deckId)]);
      setDeckName(deck?.name ?? 'Unknown Deck');
      setCards(deckCards);
    } catch {
      setError('Failed to load deck cards.');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalCards = useMemo(() => cards.length, [cards.length]);
  const dueCount = useMemo(() => cards.filter(card => card.reviewState.due <= Date.now()).length, [cards]);
  const scheduledCount = totalCards - dueCount;

  function startEdit(card: Card) {
    setEditingCardId(card.id);
    setEditor({ front: card.front, back: card.back });
    setError('');
  }

  function cancelEdit() {
    setEditingCardId(null);
    setEditor(null);
  }

  function toggleFlip(cardId: string) {
    setFlippedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  async function saveEdit() {
    if (!editingCardId || !editor) return;

    const front = editor.front.trim();
    const back = editor.back.trim();

    if (!front || !back) {
      setError('Front and back are required.');
      return;
    }

    setSavingCardId(editingCardId);
    setError('');

    try {
      const updated = await updateCard(editingCardId, front, back);

      if (!updated) {
        setError('Card not found.');
        return;
      }

      setCards(prev => prev.map(card => (card.id === updated.id ? updated : card)));
      setEditingCardId(null);
      setEditor(null);
    } catch {
      setError('Failed to save card changes.');
    } finally {
      setSavingCardId(null);
    }
  }

  async function handleDelete(cardId: string) {
    const ok = window.confirm('Delete this card? This cannot be undone.');
    if (!ok) return;

    setDeletingCardId(cardId);
    setError('');

    try {
      const removed = await deleteCard(cardId);
      if (!removed) {
        setError('Card not found.');
        return;
      }

      setCards(prev => prev.filter(card => card.id !== cardId));
      if (editingCardId === cardId) {
        setEditingCardId(null);
        setEditor(null);
      }
      setFlippedCardIds(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    } catch {
      setError('Failed to delete card.');
    } finally {
      setDeletingCardId(null);
    }
  }

  if (!deckId) {
    return <div className="text-sm text-rose-600">Invalid deck route.</div>;
  }

  return (
    <div className="space-y-7">
      <section className="saas-surface p-8 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-700">
              Back to dashboard
            </Link>
            <h1 className="saas-title mt-3">{deckName}</h1>
            <p className="saas-subtitle mt-3">Manage cards, update content, and review due status.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{totalCards} total</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{dueCount} due</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{scheduledCount} scheduled</span>
          </div>
        </div>
      </section>

      <section className="flex justify-end">
        <Link to="/create" className="saas-btn-primary px-4 py-2 text-sm">
          Add Card
        </Link>
      </section>

      {error && <div className="saas-surface p-4 text-sm text-rose-600">{error}</div>}

      {loading ? (
        <div className="saas-surface p-6 text-sm text-slate-500">Loading cards...</div>
      ) : cards.length === 0 ? (
        <div className="saas-surface p-10 text-center">
          <p className="text-slate-600">No cards in this deck yet.</p>
          <Link to="/create" className="mt-3 inline-block text-sm font-medium text-blue-700">
            Create your first card
          </Link>
        </div>
      ) : (
        <section className="space-y-4">
          {cards.map((card, cardIndex) => {
            const isEditing = editingCardId === card.id;
            const isSaving = savingCardId === card.id;
            const isDeleting = deletingCardId === card.id;
            const isFlipped = flippedCardIds.has(card.id);
            const isDue = card.reviewState.due <= Date.now();

            return (
              <article key={card.id} className="saas-surface p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Card {cardIndex + 1}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isDue ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDue ? 'Due now' : `Due ${formatDueDate(card.reviewState.due)}`}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    Interval {card.reviewState.interval}d | Repetition {card.reviewState.repetition}
                  </div>
                </div>

                {isEditing && editor ? (
                  <>
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Front</label>
                      <textarea
                        value={editor.front}
                        onChange={event => setEditor(prev => (prev ? { ...prev, front: event.target.value } : prev))}
                        rows={3}
                        className="saas-input p-3 text-sm"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Back</label>
                      <textarea
                        value={editor.back}
                        onChange={event => setEditor(prev => (prev ? { ...prev, back: event.target.value } : prev))}
                        rows={5}
                        className="saas-input p-3 text-sm"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit()}
                        disabled={isSaving}
                        className="saas-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={isSaving} className="saas-btn-secondary px-4 py-2 text-sm">
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleFlip(card.id)}
                      className="saas-flashcard-scene mb-4 text-left"
                      aria-label="Flip card"
                    >
                      <div className={`saas-flashcard ${isFlipped ? 'is-flipped' : ''}`}>
                        <div className="saas-flashcard-face saas-flashcard-front">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Front</p>
                          <p className="whitespace-pre-wrap text-slate-900">{card.front}</p>
                          <p className="mt-6 text-xs text-slate-500">Click to flip</p>
                        </div>
                        <div className="saas-flashcard-face saas-flashcard-back">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Back</p>
                          <p className="whitespace-pre-wrap text-slate-700">{card.back}</p>
                          <p className="mt-6 text-xs text-slate-500">Click to flip back</p>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(card)} className="saas-btn-secondary px-4 py-2 text-sm">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(card.id)}
                        disabled={isDeleting}
                        className="saas-btn-danger px-4 py-2 text-sm disabled:opacity-60"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
