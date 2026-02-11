import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deleteCard, getCardsByDeck, getDeckById, updateCard } from '../lib/storage';
import type { Card } from '../types/models';

type EditorState = {
  front: string;
  back: string;
};

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
    <div className="space-y-6">
      <section className="saas-surface p-8">
        <Link to="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-700">
          Back to dashboard
        </Link>
        <h1 className="saas-title mt-2">{deckName}</h1>
        <p className="saas-subtitle mt-2">{totalCards} card(s)</p>
      </section>

      <div className="flex justify-end">
        <Link to="/create" className="saas-btn-primary px-4 py-2 text-sm">
          Add Card
        </Link>
      </div>

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
        <div className="space-y-4">
          {cards.map(card => {
            const isEditing = editingCardId === card.id;
            const isSaving = savingCardId === card.id;
            const isDeleting = deletingCardId === card.id;
            const isFlipped = flippedCardIds.has(card.id);

            return (
              <div key={card.id} className="saas-surface p-5">
                {isEditing && editor ? (
                  <>
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Front
                      </label>
                      <textarea
                        value={editor.front}
                        onChange={e => setEditor(prev => (prev ? { ...prev, front: e.target.value } : prev))}
                        rows={2}
                        className="saas-input p-3 text-sm"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Back
                      </label>
                      <textarea
                        value={editor.back}
                        onChange={e => setEditor(prev => (prev ? { ...prev, back: e.target.value } : prev))}
                        rows={4}
                        className="saas-input p-3 text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="saas-btn-primary px-4 py-2 text-sm disabled:opacity-60"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="saas-btn-secondary px-4 py-2 text-sm"
                      >
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

                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEdit(card)} className="saas-btn-secondary px-4 py-2 text-sm">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        disabled={isDeleting}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-100 disabled:opacity-60"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
