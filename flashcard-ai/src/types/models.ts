// src/types/models.ts

export type Subject = {
  id: string;
  name: string;
  description?: string;
};

export type Deck = {
  id: string;
  subjectId: string;
  name: string;
  createdAt: number;
};

export type ReviewState = {
  interval: number;
  repetition: number;
  easeFactor: number;
  due: number;
};

export type Card = {
  id: string;
  deckId: string;
  front: string;
  back: string;
  reviewState: ReviewState;
};

export type ReviewHistoryEntry = {
  id: string;
  cardId: string;
  deckId: string;
  quality: 1 | 2 | 3 | 4 | 5;
  reviewedAt: number;
};

export type DeckExportPayload = {
  version: 1;
  exportedAt: number;
  subject: {
    name: string;
    description?: string;
  };
  deck: {
    name: string;
    createdAt: number;
  };
  cards: Array<{
    front: string;
    back: string;
    reviewState: ReviewState;
  }>;
};
