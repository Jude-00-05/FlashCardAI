import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCardsByDeck, createCard } from '../lib/storage';
import type { Card } from '../types/models';

export default function DeckView() {
  const { deckId } = useParams();
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    if (!deckId) return;
    load();
  }, [deckId]);

  async function load() {
    const data = await getCardsByDeck(deckId!);
    setCards(data);
  }

  async function addSampleCard() {
    if (!deckId) return;
    await createCard(deckId, 'What is React?', 'A JavaScript library for building UIs');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Deck</h1>

      {cards.length === 0 && (
        <div className="mb-4 text-sm text-gray-500">
          No cards yet.
          <button
            onClick={addSampleCard}
            className="ml-2 text-brand-500 underline"
          >
            Add sample card
          </button>
        </div>
      )}

      <div className="space-y-3">
        {cards.map(card => (
          <div key={card.id} className="p-4 bg-white rounded border">
            <div className="font-medium">{card.front}</div>
            <div className="text-sm text-gray-600 mt-1">{card.back}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
