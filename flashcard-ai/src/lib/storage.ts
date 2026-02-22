import type { Card, Deck, DeckExportPayload, ReviewHistoryEntry, ReviewState, Subject, WorkspaceBackupPayload } from '../types/models';

type WorkspaceState = {
  subjects: Subject[];
  decks: Deck[];
  cards: Card[];
  reviews: ReviewHistoryEntry[];
};

const STORAGE_KEY = 'flashcard-ai.workspace.v1';

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultReviewState(): ReviewState {
  return {
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    due: Date.now()
  };
}

function seededWorkspace(): WorkspaceState {
  const now = Date.now();

  const subjectOneId = createId('sub');
  const subjectTwoId = createId('sub');

  const deckOneId = createId('deck');
  const deckTwoId = createId('deck');
  const deckThreeId = createId('deck');

  return {
    subjects: [
      { id: subjectOneId, name: 'Computer Science' },
      { id: subjectTwoId, name: 'Mathematics' }
    ],
    decks: [
      { id: deckOneId, subjectId: subjectOneId, name: 'Data Structures', createdAt: now },
      { id: deckTwoId, subjectId: subjectOneId, name: 'Operating Systems', createdAt: now },
      { id: deckThreeId, subjectId: subjectTwoId, name: 'Linear Algebra', createdAt: now }
    ],
    cards: [
      {
        id: createId('card'),
        deckId: deckOneId,
        front: 'What is the time complexity of binary search?',
        back: 'O(log n)',
        reviewState: defaultReviewState()
      },
      {
        id: createId('card'),
        deckId: deckOneId,
        front: 'Which data structure supports FIFO order?',
        back: 'Queue',
        reviewState: defaultReviewState()
      },
      {
        id: createId('card'),
        deckId: deckTwoId,
        front: 'What does virtual memory primarily provide?',
        back: 'An abstraction of larger memory space using disk-backed paging.',
        reviewState: defaultReviewState()
      },
      {
        id: createId('card'),
        deckId: deckThreeId,
        front: 'What is the determinant used for?',
        back: 'It indicates scaling factor and whether a square matrix is invertible.',
        reviewState: defaultReviewState()
      }
    ],
    reviews: []
  };
}

function readWorkspace(): WorkspaceState {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = seededWorkspace();
    writeWorkspace(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(raw) as WorkspaceState;
    if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.decks) || !Array.isArray(parsed.cards) || !Array.isArray(parsed.reviews)) {
      throw new Error('Invalid workspace');
    }
    return parsed;
  } catch {
    const seed = seededWorkspace();
    writeWorkspace(seed);
    return seed;
  }
}

function writeWorkspace(workspace: WorkspaceState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
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

/* ---------- SUBJECTS ---------- */

export async function getSubjects(): Promise<Subject[]> {
  return readWorkspace().subjects;
}

export async function createSubject(name: string, _description = ''): Promise<Subject> {
  const workspace = readWorkspace();
  const subject: Subject = {
    id: createId('sub'),
    name: name.trim()
  };
  workspace.subjects.push(subject);
  writeWorkspace(workspace);
  return subject;
}

export async function renameSubject(subjectId: string, name: string): Promise<Subject | null> {
  const workspace = readWorkspace();
  const subject = workspace.subjects.find(item => item.id === subjectId);
  if (!subject) return null;
  subject.name = name.trim();
  writeWorkspace(workspace);
  return subject;
}

export async function deleteSubjectCascade(subjectId: string): Promise<boolean> {
  const workspace = readWorkspace();
  const existing = workspace.subjects.some(item => item.id === subjectId);
  if (!existing) return false;

  const removedDeckIds = new Set(workspace.decks.filter(deck => deck.subjectId === subjectId).map(deck => deck.id));
  workspace.subjects = workspace.subjects.filter(subject => subject.id !== subjectId);
  workspace.decks = workspace.decks.filter(deck => deck.subjectId !== subjectId);
  workspace.cards = workspace.cards.filter(card => !removedDeckIds.has(card.deckId));
  workspace.reviews = workspace.reviews.filter(review => !removedDeckIds.has(review.deckId));
  writeWorkspace(workspace);
  return true;
}

/* ---------- DECKS ---------- */

export async function getDecksBySubject(subjectId: string): Promise<Deck[]> {
  return readWorkspace().decks.filter(deck => deck.subjectId === subjectId);
}

export async function getDecks(): Promise<Deck[]> {
  return readWorkspace().decks;
}

export async function getDeckById(deckId: string): Promise<Deck | null> {
  return readWorkspace().decks.find(deck => deck.id === deckId) ?? null;
}

export async function createDeck(subjectId: string, name: string): Promise<Deck> {
  const workspace = readWorkspace();
  const deck: Deck = {
    id: createId('deck'),
    subjectId,
    name: name.trim(),
    createdAt: Date.now()
  };
  workspace.decks.push(deck);
  writeWorkspace(workspace);
  return deck;
}

export async function renameDeck(deckId: string, name: string): Promise<Deck | null> {
  const workspace = readWorkspace();
  const deck = workspace.decks.find(item => item.id === deckId);
  if (!deck) return null;
  deck.name = name.trim();
  writeWorkspace(workspace);
  return deck;
}

export async function deleteDeck(deckId: string): Promise<boolean> {
  const workspace = readWorkspace();
  const exists = workspace.decks.some(deck => deck.id === deckId);
  if (!exists) return false;

  workspace.decks = workspace.decks.filter(deck => deck.id !== deckId);
  workspace.cards = workspace.cards.filter(card => card.deckId !== deckId);
  workspace.reviews = workspace.reviews.filter(review => review.deckId !== deckId);
  writeWorkspace(workspace);
  return true;
}

/* ---------- CARDS ---------- */

export async function getCardsByDeck(deckId: string): Promise<Card[]> {
  return readWorkspace().cards.filter(card => card.deckId === deckId);
}

export async function createCard(
  deckId: string,
  front: string,
  back: string,
  reviewState?: ReviewState
): Promise<Card> {
  const workspace = readWorkspace();
  const card: Card = {
    id: createId('card'),
    deckId,
    front: front.trim(),
    back: back.trim(),
    reviewState: reviewState ?? defaultReviewState()
  };
  workspace.cards.push(card);
  writeWorkspace(workspace);
  return card;
}

export async function updateCard(cardId: string, front: string, back: string): Promise<Card | null> {
  const workspace = readWorkspace();
  const card = workspace.cards.find(item => item.id === cardId);
  if (!card) return null;
  card.front = front.trim();
  card.back = back.trim();
  writeWorkspace(workspace);
  return card;
}

export async function deleteCard(cardId: string): Promise<boolean> {
  const workspace = readWorkspace();
  const exists = workspace.cards.some(card => card.id === cardId);
  if (!exists) return false;
  workspace.cards = workspace.cards.filter(card => card.id !== cardId);
  workspace.reviews = workspace.reviews.filter(review => review.cardId !== cardId);
  writeWorkspace(workspace);
  return true;
}

export async function getDueCards(): Promise<Card[]> {
  const now = Date.now();
  return readWorkspace().cards.filter(card => card.reviewState.due <= now);
}

/* ---------- REVIEW HISTORY ---------- */

export async function getReviewHistory(): Promise<ReviewHistoryEntry[]> {
  return readWorkspace().reviews;
}

export async function saveReview(
  cardId: string,
  reviewState: ReviewState,
  quality?: 1 | 2 | 3 | 4 | 5
): Promise<void> {
  const workspace = readWorkspace();
  const card = workspace.cards.find(item => item.id === cardId);
  if (!card) return;

  card.reviewState = reviewState;
  if (quality) {
    workspace.reviews.push({
      id: createId('review'),
      cardId: card.id,
      deckId: card.deckId,
      quality,
      reviewedAt: Date.now()
    });
  }
  writeWorkspace(workspace);
}

/* ---------- IMPORT / EXPORT ---------- */

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
  const workspace = readWorkspace();
  const payload: WorkspaceBackupPayload = {
    version: 1,
    exportedAt: Date.now(),
    subjects: workspace.subjects,
    decks: workspace.decks,
    cards: workspace.cards
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

  const workspace: WorkspaceState = {
    subjects: parsedSubjects as Subject[],
    decks: parsedDecks as Deck[],
    cards: parsedCards as Card[],
    reviews: []
  };
  writeWorkspace(workspace);

  return {
    subjects: workspace.subjects.length,
    decks: workspace.decks.length,
    cards: workspace.cards.length
  };
}
