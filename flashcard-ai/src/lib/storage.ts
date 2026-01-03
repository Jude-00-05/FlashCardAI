import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import type { Subject, Deck, Card } from '../types/models';


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

export async function createCard(deckId: string, front: string, back: string) {
  const cards = (await localforage.getItem<Card[]>(CARDS_KEY)) ?? [];
  const card: Card = {
    id: uuidv4(),
    deckId,
    front,
    back,
    createdAt: Date.now()
  };
  cards.push(card);
  await localforage.setItem(CARDS_KEY, cards);
  return card;
}
