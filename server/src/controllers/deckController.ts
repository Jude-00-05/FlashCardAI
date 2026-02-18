import type { Response } from 'express';
import { DeckModel } from '../models/Deck';
import { SubjectModel } from '../models/Subject';
import { CardModel } from '../models/Card';
import { ReviewHistoryModel } from '../models/ReviewHistory';
import type { AuthenticatedRequest } from '../types/auth';

export async function getDecksBySubject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const subject = await SubjectModel.findOne({ _id: req.params.subjectId, userId: req.userId }).lean();
  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  const decks = await DeckModel.find({ userId: req.userId, subjectId: req.params.subjectId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(decks);
}

export async function createDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { subjectId, name } = req.body as { subjectId?: string; name?: string };

  if (!subjectId || !name?.trim()) {
    res.status(400).json({ message: 'subjectId and deck name are required.' });
    return;
  }

  const subject = await SubjectModel.findOne({ _id: subjectId, userId: req.userId }).lean();
  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  try {
    const deck = await DeckModel.create({
      userId: req.userId,
      subjectId,
      name: name.trim(),
      createdAt: Date.now()
    });
    res.status(201).json(deck);
  } catch {
    res.status(409).json({ message: 'A deck with this name already exists in the subject.' });
  }
}

export async function updateDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ message: 'Deck name is required.' });
    return;
  }

  const deck = await DeckModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { name: name.trim() },
    { new: true }
  ).lean();

  if (!deck) {
    res.status(404).json({ message: 'Deck not found.' });
    return;
  }

  res.status(200).json(deck);
}

export async function deleteDeck(req: AuthenticatedRequest, res: Response): Promise<void> {
  const deck = await DeckModel.findOneAndDelete({ _id: req.params.id, userId: req.userId }).lean();

  if (!deck) {
    res.status(404).json({ message: 'Deck not found.' });
    return;
  }

  await Promise.all([
    CardModel.deleteMany({ userId: req.userId, deckId: req.params.id }),
    ReviewHistoryModel.deleteMany({ userId: req.userId, deckId: req.params.id })
  ]);

  res.status(200).json({ message: 'Deck deleted.' });
}

