import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthenticatedRequest } from '../types/auth';

type JwtPayload = {
  userId: string;
};

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (process.env.SKIP_AUTH === 'true') {
    req.userId = '000000000000000000000001';
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing authorization token.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'JWT secret is not configured.' });
      return;
    }

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

