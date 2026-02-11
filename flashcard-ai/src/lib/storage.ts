import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import type { Subject, Deck, Card } from '../types/models';
import type { Card, ReviewState } from '../types/models';

export async function getDueCards(): Promise<Card[]> {
  const cards: Card[] = [];

  await localforage.iterate((value, key) => {
    if (key.startsWith('card:')) {
      const card = value as Card;
      if (card.reviewState.due <= Date.now()) {
        cards.push(card);
      }
    }
  });

  return cards;
}

export async function saveReview(
  cardId: string,
  reviewState: ReviewState
) {
  const card = await localforage.getItem<Card>(`card:${cardId}`);
  if (!card) return;

  card.reviewState = reviewState;
  await localforage.setItem(`card:${cardId}`, card);
}


localforage.config({
  name: 'flashcard_ai'
});

const SUBJECTS_KEY = 'subjects';
const DECKS_KEY = 'decks';
const CARDS_KEY = 'cards';

/* ---------- SUBJECTS ---------- */

export async function getSubjects(): Promise<Subject[]> {
  return (await localforage.getItem<Subject[]>(SUBJECTS_KEY)) ?? [];
}

export async function createSubject(name: string, description = '') {
  const subjects = await getSubjects();
  const subject: Subject = {
    id: uuidv4(),
    name,
    description
  };
  subjects.push(subject);
  await localforage.setItem(SUBJECTS_KEY, subjects);
  return subject;
}

/* ---------- DECKS ---------- */

export async function getDecks(): Promise<Deck[]> {
  return (await localforage.getItem<Deck[]>(DECKS_KEY)) ?? [];
}

export async function getDecksBySubject(subjectId: string) {
  const decks = await getDecks();
  return decks.filter(d => d.subjectId === subjectId);
}

export async function createDeck(subjectId: string, name: string) {
  const decks = await getDecks();
  const deck: Deck = {
    id: uuidv4(),
    subjectId,
    name,
    createdAt: Date.now()
  };
  decks.push(deck);
  await localforage.setItem(DECKS_KEY, decks);
  return deck;
}

/* ---------- CARDS ---------- */

export async function getCardsByDeck(deckId: string): Promise<Card[]> {
  const cards = (await localforage.getItem<Card[]>(CARDS_KEY)) ?? [];
  return cards.filter(c => c.deckId === deckId);
}

export async function createCard(
  deckId: string,
  front: string,
  back: string
) {
  const card = {
    id: crypto.randomUUID(),
    deckId,
    front,
    back,
    reviewState: {
      interval: 1,
      repetition: 0,
      easeFactor: 2.5,
      due: Date.now()
    }
  };

  await localforage.setItem(`card:${card.id}`, card);
  return card;
}

