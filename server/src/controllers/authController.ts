import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import type { AuthenticatedRequest } from '../types/auth';

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT secret is not configured.');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      res.status(400).json({ message: 'Name, email, and password (min 6 chars) are required.' });
      return;
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean();
    if (existing) {
      res.status(409).json({ message: 'Email already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    const token = signToken(String(user._id));

    res.status(201).json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email
      }
    });
  } catch {
    res.status(500).json({ message: 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = signToken(String(user._id));

    res.status(200).json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email
      }
    });
  } catch {
    res.status(500).json({ message: 'Login failed.' });
  }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const user = await UserModel.findById(req.userId).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  res.status(200).json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email
    }
  });
}

