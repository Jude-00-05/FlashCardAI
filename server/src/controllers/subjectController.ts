import type { Response } from 'express';
import { SubjectModel } from '../models/Subject';
import { DeckModel } from '../models/Deck';
import { CardModel } from '../models/Card';
import { ReviewHistoryModel } from '../models/ReviewHistory';
import type { AuthenticatedRequest } from '../types/auth';

export async function getSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  const subjects = await SubjectModel.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.status(200).json(subjects);
}

export async function createSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name } = req.body as { name?: string };

  if (!name?.trim()) {
    res.status(400).json({ message: 'Subject name is required.' });
    return;
  }

  try {
    const subject = await SubjectModel.create({
      userId: req.userId,
      name: name.trim()
    });

    res.status(201).json(subject);
  } catch {
    res.status(409).json({ message: 'A subject with this name already exists.' });
  }
}

export async function updateSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name } = req.body as { name?: string };

  if (!name?.trim()) {
    res.status(400).json({ message: 'Subject name is required.' });
    return;
  }

  const subject = await SubjectModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { name: name.trim() },
    { new: true }
  ).lean();

  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  res.status(200).json(subject);
}

export async function deleteSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
  const subject = await SubjectModel.findOneAndDelete({ _id: req.params.id, userId: req.userId }).lean();

  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }

  const decks = await DeckModel.find({ userId: req.userId, subjectId: req.params.id }).lean();
  const deckIds = decks.map(deck => deck._id);

  await Promise.all([
    DeckModel.deleteMany({ userId: req.userId, subjectId: req.params.id }),
    CardModel.deleteMany({ userId: req.userId, subjectId: req.params.id }),
    ReviewHistoryModel.deleteMany({ userId: req.userId, deckId: { $in: deckIds } })
  ]);

  res.status(200).json({ message: 'Subject deleted.' });
}

