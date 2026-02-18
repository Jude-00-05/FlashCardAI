import type { Response } from 'express';
import { CardModel } from '../models/Card';
import { DeckModel } from '../models/Deck';
import { ReviewHistoryModel } from '../models/ReviewHistory';
import type { AuthenticatedRequest } from '../types/auth';

type ReviewStateInput = {
  interval: number;
  repetition: number;
  easeFactor: number;
  due: number;
};

function getDefaultReviewState(): ReviewStateInput {
  return {
    interval: 1,
    repetition: 0,
    easeFactor: 2.5,
    due: Date.now()
  };
}

export async function getCardsByDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
  const deck = await DeckModel.findOne({ _id: req.params.deckId, userId: req.userId }).lean();
  if (!deck) {
    res.status(404).json({ message: 'Deck not found.' });
    return;
  }

  const cards = await CardModel.find({ userId: req.userId, deckId: req.params.deckId }).sort({ createdAt: -1 }).lean();
  res.status(200).json(cards);
}

export async function createCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { deckId, front, back, reviewState } = req.body as {
    deckId?: string;
    front?: string;
    back?: string;
    reviewState?: ReviewStateInput;
  };

  if (!deckId || !front?.trim() || !back?.trim()) {
    res.status(400).json({ message: 'deckId, front, and back are required.' });
    return;
  }

  const deck = await DeckModel.findOne({ _id: deckId, userId: req.userId }).lean();
  if (!deck) {
    res.status(404).json({ message: 'Deck not found.' });
    return;
  }

  const card = await CardModel.create({
    userId: req.userId,
    subjectId: deck.subjectId,
    deckId,
    front: front.trim(),
    back: back.trim(),
    reviewState: reviewState ?? getDefaultReviewState(),
    createdAt: Date.now()
  });

  res.status(201).json(card);
}

export async function updateCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { front, back, reviewState, quality } = req.body as {
    front?: string;
    back?: string;
    reviewState?: ReviewStateInput;
    quality?: 1 | 2 | 3 | 4 | 5;
  };

  const card = await CardModel.findOne({ _id: req.params.id, userId: req.userId });
  if (!card) {
    res.status(404).json({ message: 'Card not found.' });
    return;
  }

  if (typeof front === 'string') card.front = front.trim();
  if (typeof back === 'string') card.back = back.trim();
  if (reviewState) card.reviewState = reviewState;

  await card.save();

  if (reviewState && quality && quality >= 1 && quality <= 5) {
    await ReviewHistoryModel.create({
      userId: req.userId,
      cardId: card._id,
      deckId: card.deckId,
      quality,
      reviewedAt: Date.now()
    });
  }

  res.status(200).json(card);
}

export async function deleteCard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const deleted = await CardModel.findOneAndDelete({ _id: req.params.id, userId: req.userId }).lean();

  if (!deleted) {
    res.status(404).json({ message: 'Card not found.' });
    return;
  }

  await ReviewHistoryModel.deleteMany({ userId: req.userId, cardId: req.params.id });

  res.status(200).json({ message: 'Card deleted.' });
}

export async function getDueCards(req: AuthenticatedRequest, res: Response): Promise<void> {
  const now = Date.now();
  const cards = await CardModel.find({ userId: req.userId, 'reviewState.due': { $lte: now } })
    .sort({ 'reviewState.due': 1 })
    .lean();

  res.status(200).json(cards);
}

