import type { Response } from 'express';
import { ReviewHistoryModel } from '../models/ReviewHistory';
import type { AuthenticatedRequest } from '../types/auth';

export async function getReviewHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const history = await ReviewHistoryModel.find({ userId: req.userId }).sort({ reviewedAt: 1 }).lean();
  res.status(200).json(history);
}

