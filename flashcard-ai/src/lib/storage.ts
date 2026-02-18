import type { Card, Deck, DeckExportPayload, ReviewHistoryEntry, ReviewState, Subject, WorkspaceBackupPayload } from '../types/models';
import { api } from './api';

type ApiEntity = {
  _id: string;
};

type ApiSubject = ApiEntity & {
  name: string;
};

type ApiDeck = ApiEntity & {
  subjectId: string;
  name: string;
  createdAt: number;
};

type ApiCard = ApiEntity & {
  deckId: string;
  subjectId: string;
  front: string;
  back: string;
  reviewState: ReviewState;
};

type ApiReviewHistory = ApiEntity & {
  cardId: string;
  deckId: string;
  quality: 1 | 2 | 3 | 4 | 5;
  reviewedAt: number;
};

function mapSubject(item: ApiSubject): Subject {
  return {
    id: item._id,
    name: item.name
  };
}

function mapDeck(item: ApiDeck): Deck {
  return {
    id: item._id,
    subjectId: item.subjectId,
    name: item.name,
    createdAt: item.createdAt
  };
}

function mapCard(item: ApiCard): Card {
  return {
    id: item._id,
    deckId: item.deckId,
    front: item.front,
    back: item.back,
    reviewState: item.reviewState
  };
}

function mapReview(item: ApiReviewHistory): ReviewHistoryEntry {
  return {
    id: item._id,
    cardId: item.cardId,
    deckId: item.deckId,
    quality: item.quality,
    reviewedAt: item.reviewedAt
  };
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
  const response = await api.get<ApiSubject[]>('/subjects');
  return response.data.map(mapSubject);
}

export async function createSubject(name: string, _description = ''): Promise<Subject> {
  const response = await api.post<ApiSubject>('/subjects', { name });
  return mapSubject(response.data);
}

export async function renameSubject(subjectId: string, name: string): Promise<Subject | null> {
  try {
    const response = await api.put<ApiSubject>(`/subjects/${subjectId}`, { name });
    return mapSubject(response.data);
  } catch {
    return null;
  }
}

export async function deleteSubjectCascade(subjectId: string): Promise<boolean> {
  try {
    await api.delete(`/subjects/${subjectId}`);
    return true;
  } catch {
    return false;
  }
}

/* ---------- DECKS ---------- */

export async function getDecksBySubject(subjectId: string): Promise<Deck[]> {
  const response = await api.get<ApiDeck[]>(`/decks/${subjectId}`);
  return response.data.map(mapDeck);
}

export async function getDecks(): Promise<Deck[]> {
  const subjects = await getSubjects();
  const grouped = await Promise.all(subjects.map(subject => getDecksBySubject(subject.id)));
  return grouped.flat();
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  const decks = await getDecks();
  return decks.find(deck => deck.id === deckId) ?? null;
}

export async function createDeck(subjectId: string, name: string): Promise<Deck> {
  const response = await api.post<ApiDeck>('/decks', { subjectId, name });
  return mapDeck(response.data);
}

export async function renameDeck(deckId: string, name: string): Promise<Deck | null> {
  try {
    const response = await api.put<ApiDeck>(`/decks/${deckId}`, { name });
    return mapDeck(response.data);
  } catch {
    return null;
  }
}

export async function deleteDeck(deckId: string): Promise<boolean> {
  try {
    await api.delete(`/decks/${deckId}`);
    return true;
  } catch {
    return false;
  }
}

/* ---------- CARDS ---------- */

export async function getCardsByDeck(deckId: string): Promise<Card[]> {
  const response = await api.get<ApiCard[]>(`/cards/${deckId}`);
  return response.data.map(mapCard);
}

export async function createCard(
  deckId: string,
  front: string,
  back: string,
  reviewState?: ReviewState
): Promise<Card> {
  const response = await api.post<ApiCard>('/cards', {
    deckId,
    front,
    back,
    reviewState
  });

  return mapCard(response.data);
}

export async function updateCard(cardId: string, front: string, back: string): Promise<Card | null> {
  try {
    const response = await api.put<ApiCard>(`/cards/${cardId}`, { front, back });
    return mapCard(response.data);
  } catch {
    return null;
  }
}

export async function deleteCard(cardId: string): Promise<boolean> {
  try {
    await api.delete(`/cards/${cardId}`);
    return true;
  } catch {
    return false;
  }
}

export async function getDueCards(): Promise<Card[]> {
  const response = await api.get<ApiCard[]>('/cards/due');
  return response.data.map(mapCard);
}

/* ---------- REVIEW HISTORY ---------- */

export async function getReviewHistory(): Promise<ReviewHistoryEntry[]> {
  const response = await api.get<ApiReviewHistory[]>('/reviews');
  return response.data.map(mapReview);
}

export async function saveReview(
  cardId: string,
  reviewState: ReviewState,
  quality?: 1 | 2 | 3 | 4 | 5
): Promise<void> {
  await api.put(`/cards/${cardId}`, {
    reviewState,
    quality
  });
}

/* ---------- IMPORT / EXPORT (CLIENT-SIDE UTILITIES) ---------- */

export async function exportDeckAsJson(deckId: string): Promise<string | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;

  const subject = (await getSubjects()).find(item => item.id === deck.subjectId);
  if (!subject) return null;

  const cards = await getCardsByDeck(deckId);

  const payload: DeckExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    subject: {
      name: subject.name
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

async function getOrCreateSubjectByName(name: string): Promise<Subject> {
  const subjects = await getSubjects();
  const existing = subjects.find(subject => normalizeName(subject.name) === normalizeName(name));
  if (existing) return existing;
  return createSubject(name);
}

async function getOrCreateDeckByName(subjectId: string, name: string): Promise<Deck> {
  const decks = await getDecksBySubject(subjectId);
  const existing = decks.find(deck => normalizeName(deck.name) === normalizeName(name));
  if (existing) return existing;
  return createDeck(subjectId, name);
}

export async function importDeckFromJson(jsonText: string): Promise<{ subject: Subject; deck: Deck; importedCards: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error('Invalid deck export format.');
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
    if (!isRecord(card) || typeof card.front !== 'string' || typeof card.back !== 'string' || !isValidReviewState(card.reviewState)) {
      throw new Error(`Card ${index + 1} is invalid.`);
    }

    return {
      front: card.front,
      back: card.back,
      reviewState: card.reviewState
    };
  });

  const subject = await getOrCreateSubjectByName(parsedSubject.name);
  const deck = await getOrCreateDeckByName(subject.id, parsedDeck.name);

  for (const item of normalizedCards) {
    await createCard(deck.id, item.front, item.back, item.reviewState);
  }

  return {
    subject,
    deck,
    importedCards: normalizedCards.length
  };
}

export async function exportDeckAsCsv(deckId: string): Promise<string | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;

  const cards = await getCardsByDeck(deckId);
  const lines: string[] = ['front,back,interval,repetition,easeFactor,due'];

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
): Promise<{ subject: Subject; deck: Deck; importedCards: number }> {
  const trimmedSubject = subjectName.trim();
  const trimmedDeck = deckName.trim();

  if (!trimmedSubject) throw new Error('Subject name is required for CSV import.');
  if (!trimmedDeck) throw new Error('Deck name is required for CSV import.');

  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(line => line.length > 0);

  if (lines.length === 0) throw new Error('CSV file is empty.');

  const header = parseCsvLine(lines[0]).map(part => part.trim().toLowerCase());
  const expectedHeader = ['front', 'back', 'interval', 'repetition', 'easefactor', 'due'];
  const headerMatches = header.length === expectedHeader.length && header.every((part, index) => part === expectedHeader[index]);

  if (!headerMatches) {
    throw new Error('Invalid CSV header. Expected: front,back,interval,repetition,easeFactor,due');
  }

  const rows = lines.slice(1);
  const normalizedCards = rows.map((line, index) => {
    const cols = parseCsvLine(line);
    if (cols.length !== 6) throw new Error(`CSV row ${index + 2} is invalid.`);

    const front = csvUnescape(cols[0]);
    const back = csvUnescape(cols[1]);
    const interval = Number(cols[2]);
    const repetition = Number(cols[3]);
    const easeFactor = Number(cols[4]);
    const due = Number(cols[5]);

    if (!front || !back) throw new Error(`CSV row ${index + 2} must include front and back text.`);
    if ([interval, repetition, easeFactor, due].some(value => Number.isNaN(value))) {
      throw new Error(`CSV row ${index + 2} has invalid review state values.`);
    }

    return {
      front,
      back,
      reviewState: { interval, repetition, easeFactor, due }
    };
  });

  const subject = await getOrCreateSubjectByName(trimmedSubject);
  const deck = await getOrCreateDeckByName(subject.id, trimmedDeck);

  for (const item of normalizedCards) {
    await createCard(deck.id, item.front, item.back, item.reviewState);
  }

  return {
    subject,
    deck,
    importedCards: normalizedCards.length
  };
}

export async function exportWorkspaceAsJson(): Promise<string> {
  const subjects = await getSubjects();
  const decks = await getDecks();
  const cardsByDeck = await Promise.all(decks.map(deck => getCardsByDeck(deck.id)));
  const cards = cardsByDeck.flat();

  const payload: WorkspaceBackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    subjects,
    decks,
    cards
  };

  return JSON.stringify(payload, null, 2);
}

export async function importWorkspaceFromJson(jsonText: string): Promise<{ subjects: number; decks: number; cards: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error('Invalid workspace backup format.');
  }

  const parsedSubjects = parsed.subjects;
  const parsedDecks = parsed.decks;
  const parsedCards = parsed.cards;

  if (!Array.isArray(parsedSubjects) || !Array.isArray(parsedDecks) || !Array.isArray(parsedCards)) {
    throw new Error('Backup must include subjects, decks, and cards arrays.');
  }

  const subjectIds = new Set<string>();
  for (const item of parsedSubjects) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
      throw new Error('Invalid subject in backup.');
    }
    if (subjectIds.has(item.id)) throw new Error('Duplicate subject IDs found in backup.');
    subjectIds.add(item.id);
  }

  const deckIds = new Set<string>();
  for (const item of parsedDecks) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.subjectId !== 'string' || typeof item.name !== 'string') {
      throw new Error('Invalid deck in backup.');
    }
    if (!subjectIds.has(item.subjectId)) throw new Error('Deck references missing subject.');
    if (deckIds.has(item.id)) throw new Error('Duplicate deck IDs found in backup.');
    deckIds.add(item.id);
  }

  for (const item of parsedCards) {
    if (!isRecord(item) || typeof item.deckId !== 'string' || typeof item.front !== 'string' || typeof item.back !== 'string') {
      throw new Error('Invalid card in backup.');
    }
    if (!deckIds.has(item.deckId)) throw new Error('Card references missing deck.');
    if (!isValidReviewState(item.reviewState)) throw new Error('Card has invalid reviewState.');
  }

  const existingSubjects = await getSubjects();
  for (const subject of existingSubjects) {
    await deleteSubjectCascade(subject.id);
  }

  const subjectIdMap = new Map<string, string>();
  for (const item of parsedSubjects) {
    const created = await createSubject(String((item as Record<string, unknown>).name));
    subjectIdMap.set(String((item as Record<string, unknown>).id), created.id);
  }

  const deckIdMap = new Map<string, string>();
  for (const item of parsedDecks) {
    const record = item as Record<string, unknown>;
    const newSubjectId = subjectIdMap.get(String(record.subjectId));
    if (!newSubjectId) throw new Error('Deck subject mapping failed during import.');
    const created = await createDeck(newSubjectId, String(record.name));
    deckIdMap.set(String(record.id), created.id);
  }

  for (const item of parsedCards) {
    const record = item as Record<string, unknown>;
    const newDeckId = deckIdMap.get(String(record.deckId));
    if (!newDeckId) throw new Error('Card deck mapping failed during import.');
    await createCard(newDeckId, String(record.front), String(record.back), record.reviewState as ReviewState);
  }

  return {
    subjects: parsedSubjects.length,
    decks: parsedDecks.length,
    cards: parsedCards.length
  };
}
