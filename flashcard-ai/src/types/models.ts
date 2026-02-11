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
