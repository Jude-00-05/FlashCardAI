import type { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../types/auth';

export function validateObjectId(param: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const value = req.params[param];
    if (!mongoose.isValidObjectId(value)) {
      res.status(400).json({ message: `Invalid ${param}.` });
      return;
    }
    next();
  };
}

