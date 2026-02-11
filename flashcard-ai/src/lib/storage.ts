import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import type {
  Subject,
  Deck,
  Card,
  ReviewState,
  ReviewHistoryEntry,
  DeckExportPayload
} from '../types/models';

localforage.config({
  name: 'flashcard_ai'
});

const SUBJECTS_KEY = 'subjects';
const DECKS_KEY = 'decks';
const CARDS_KEY = 'cards';
const REVIEW_HISTORY_KEY = 'review_history';

async function getAllCards(): Promise<Card[]> {
  return (await localforage.getItem<Card[]>(CARDS_KEY)) ?? [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidReviewState(value: unknown): value is ReviewState {
  if (!isRecord(value)) return false;
  return (
    typeof value.interval === 'number' &&
    typeof value.repetition === 'number' &&
    typeof value.easeFactor === 'number' &&
    typeof value.due === 'number'
  );
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function csvUnescape(value: string): string {
  let text = value.trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1).replace(/""/g, '"');
  }
  return text;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

/* ---------- SUBJECTS ---------- */

export async function getSubjects(): Promise<Subject[]> {
  return (await localforage.getItem<Subject[]>(SUBJECTS_KEY)) ?? [];
}

export async function createSubject(name: string, description = ''): Promise<Subject> {
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

async function getSubjectById(subjectId: string): Promise<Subject | null> {
  const subjects = await getSubjects();
  return subjects.find(subject => subject.id === subjectId) ?? null;
}

async function getSubjectByName(name: string): Promise<Subject | null> {
  const subjects = await getSubjects();
  const normalized = normalizeName(name);
  return subjects.find(subject => normalizeName(subject.name) === normalized) ?? null;
}

async function getOrCreateSubject(name: string, description = ''): Promise<Subject> {
  const existing = await getSubjectByName(name);
  if (existing) {
    if (!existing.description && description) {
      const subjects = await getSubjects();
      const updatedSubjects = subjects.map(subject =>
        subject.id === existing.id
          ? {
              ...subject,
              description
            }
          : subject
      );
      await localforage.setItem(SUBJECTS_KEY, updatedSubjects);
      return {
        ...existing,
        description
      };
    }
    return existing;
  }

  return createSubject(name, description);
}

/* ---------- DECKS ---------- */

export async function getDecks(): Promise<Deck[]> {
  return (await localforage.getItem<Deck[]>(DECKS_KEY)) ?? [];
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const decks = await getDecks();
  return decks.find(deck => deck.id === deckId) ?? null;
}

export async function getDecksBySubject(subjectId: string): Promise<Deck[]> {
  const decks = await getDecks();
  return decks.filter(deck => deck.subjectId === subjectId);
}

export async function createDeck(subjectId: string, name: string): Promise<Deck> {
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

async function getDeckByName(subjectId: string, name: string): Promise<Deck | null> {
  const subjectDecks = await getDecksBySubject(subjectId);
  const normalized = normalizeName(name);
  return subjectDecks.find(deck => normalizeName(deck.name) === normalized) ?? null;
}

async function getOrCreateDeck(subjectId: string, name: string): Promise<Deck> {
  const existing = await getDeckByName(subjectId, name);
  if (existing) return existing;
  return createDeck(subjectId, name);
}

/* ---------- CARDS ---------- */

export async function getCardsByDeck(deckId: string): Promise<Card[]> {
  const cards = await getAllCards();
  return cards.filter(card => card.deckId === deckId);
}

export async function exportDeckAsJson(deckId: string): Promise<string | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;

  const subject = await getSubjectById(deck.subjectId);
  if (!subject) return null;

  const cards = await getCardsByDeck(deckId);
  const payload: DeckExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    subject: {
      name: subject.name,
      description: subject.description
    },
    deck: {
      name: deck.name,
      createdAt: deck.createdAt
    },
    cards: cards.map(card => ({
      front: card.front,
      back: card.back,
      reviewState: card.reviewState
    }))
  };

  return JSON.stringify(payload, null, 2);
}

export async function importDeckFromJson(jsonText: string): Promise<{
  subject: Subject;
  deck: Deck;
  importedCards: number;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Invalid deck export format.');
  }

  if (parsed.version !== 1) {
    throw new Error('Unsupported export version.');
  }

  const parsedSubject = parsed.subject;
  const parsedDeck = parsed.deck;
  const parsedCards = parsed.cards;

  if (!isRecord(parsedSubject) || typeof parsedSubject.name !== 'string') {
    throw new Error('Invalid subject data in import file.');
  }

  if (!isRecord(parsedDeck) || typeof parsedDeck.name !== 'string') {
    throw new Error('Invalid deck data in import file.');
  }

  if (!Array.isArray(parsedCards)) {
    throw new Error('Invalid cards array in import file.');
  }

  const normalizedCards = parsedCards.map((card, index) => {
    if (!isRecord(card)) {
      throw new Error(`Card ${index + 1} is invalid.`);
    }

    if (typeof card.front !== 'string' || typeof card.back !== 'string') {
      throw new Error(`Card ${index + 1} must include front and back text.`);
    }

    if (!isValidReviewState(card.reviewState)) {
      throw new Error(`Card ${index + 1} has an invalid review state.`);
    }

    return {
      front: card.front,
      back: card.back,
      reviewState: card.reviewState
    };
  });

  const importedSubject = await getOrCreateSubject(
    parsedSubject.name,
    typeof parsedSubject.description === 'string' ? parsedSubject.description : ''
  );
  const importedDeck = await getOrCreateDeck(importedSubject.id, parsedDeck.name);

  if (normalizedCards.length > 0) {
    const cards = await getAllCards();
    const importedCards: Card[] = normalizedCards.map(card => ({
      id: crypto.randomUUID(),
      deckId: importedDeck.id,
      front: card.front,
      back: card.back,
      reviewState: card.reviewState
    }));
    await localforage.setItem(CARDS_KEY, [...cards, ...importedCards]);
  }

  return {
    subject: importedSubject,
    deck: importedDeck,
    importedCards: normalizedCards.length
  };
}

export async function exportDeckAsCsv(deckId: string): Promise<string | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;

  const cards = await getCardsByDeck(deckId);
  const lines: string[] = [
    'front,back,interval,repetition,easeFactor,due'
  ];

  for (const card of cards) {
    lines.push(
      [
        csvEscape(card.front),
        csvEscape(card.back),
        String(card.reviewState.interval),
        String(card.reviewState.repetition),
        String(card.reviewState.easeFactor),
        String(card.reviewState.due)
      ].join(',')
    );
  }

  return lines.join('\n');
}

export async function importDeckFromCsv(
  csvText: string,
  subjectName: string,
  deckName: string
): Promise<{
  subject: Subject;
  deck: Deck;
  importedCards: number;
}> {
  const trimmedSubject = subjectName.trim();
  const trimmedDeck = deckName.trim();

  if (!trimmedSubject) {
    throw new Error('Subject name is required for CSV import.');
  }
  if (!trimmedDeck) {
    throw new Error('Deck name is required for CSV import.');
  }

  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const header = parseCsvLine(lines[0]).map(part => part.trim().toLowerCase());
  const expectedHeader = ['front', 'back', 'interval', 'repetition', 'easefactor', 'due'];
  const headerMatches =
    header.length === expectedHeader.length &&
    header.every((part, index) => part === expectedHeader[index]);

  if (!headerMatches) {
    throw new Error('Invalid CSV header. Expected: front,back,interval,repetition,easeFactor,due');
  }

  const rows = lines.slice(1);
  const normalizedCards = rows.map((line, index) => {
    const cols = parseCsvLine(line);
    if (cols.length !== 6) {
      throw new Error(`CSV row ${index + 2} is invalid.`);
    }

    const front = csvUnescape(cols[0]);
    const back = csvUnescape(cols[1]);
    const interval = Number(cols[2]);
    const repetition = Number(cols[3]);
    const easeFactor = Number(cols[4]);
    const due = Number(cols[5]);

    if (!front || !back) {
      throw new Error(`CSV row ${index + 2} must include front and back text.`);
    }
    if (
      Number.isNaN(interval) ||
      Number.isNaN(repetition) ||
      Number.isNaN(easeFactor) ||
      Number.isNaN(due)
    ) {
      throw new Error(`CSV row ${index + 2} has invalid review state values.`);
    }

    return {
      front,
      back,
      reviewState: {
        interval,
        repetition,
        easeFactor,
        due
      }
    };
  });

  const importedSubject = await getOrCreateSubject(trimmedSubject);
  const importedDeck = await getOrCreateDeck(importedSubject.id, trimmedDeck);

  if (normalizedCards.length > 0) {
    const cards = await getAllCards();
    const importedCards: Card[] = normalizedCards.map(card => ({
      id: crypto.randomUUID(),
      deckId: importedDeck.id,
      front: card.front,
      back: card.back,
      reviewState: card.reviewState
    }));
    await localforage.setItem(CARDS_KEY, [...cards, ...importedCards]);
  }

  return {
    subject: importedSubject,
    deck: importedDeck,
    importedCards: normalizedCards.length
  };
}

export async function createCard(deckId: string, front: string, back: string): Promise<Card> {
  const cards = await getAllCards();
  const card: Card = {
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

  cards.push(card);
  await localforage.setItem(CARDS_KEY, cards);
  return card;
}

export async function updateCard(
  cardId: string,
  front: string,
  back: string
): Promise<Card | null> {
  const cards = await getAllCards();
  let updatedCard: Card | null = null;

  const updatedCards = cards.map(card => {
    if (card.id !== cardId) return card;
    updatedCard = { ...card, front, back };
    return updatedCard;
  });

  if (!updatedCard) {
    return null;
  }

  await localforage.setItem(CARDS_KEY, updatedCards);
  return updatedCard;
}

export async function deleteCard(cardId: string): Promise<boolean> {
  const cards = await getAllCards();
  const updatedCards = cards.filter(card => card.id !== cardId);

  if (updatedCards.length === cards.length) {
    return false;
  }

  await localforage.setItem(CARDS_KEY, updatedCards);
  return true;
}

export async function getDueCards(): Promise<Card[]> {
  const cards = await getAllCards();
  return cards.filter(card => card.reviewState.due <= Date.now());
}

/* ---------- REVIEW HISTORY ---------- */

export async function getReviewHistory(): Promise<ReviewHistoryEntry[]> {
  return (await localforage.getItem<ReviewHistoryEntry[]>(REVIEW_HISTORY_KEY)) ?? [];
}

export async function saveReview(
  cardId: string,
  reviewState: ReviewState,
  quality?: 1 | 2 | 3 | 4 | 5
): Promise<void> {
  const cards = await getAllCards();
  const existingCard = cards.find(card => card.id === cardId);

  const updatedCards = cards.map(card =>
    card.id === cardId ? { ...card, reviewState } : card
  );

  await localforage.setItem(CARDS_KEY, updatedCards);

  if (quality && existingCard) {
    const history = await getReviewHistory();
    history.push({
      id: crypto.randomUUID(),
      cardId: existingCard.id,
      deckId: existingCard.deckId,
      quality,
      reviewedAt: Date.now()
    });
    await localforage.setItem(REVIEW_HISTORY_KEY, history);
  }
}
