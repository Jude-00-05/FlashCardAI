import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './db';
import authRoutes from './routes/authRoutes';
import subjectRoutes from './routes/subjectRoutes';
import deckRoutes from './routes/deckRoutes';
import cardRoutes from './routes/cardRoutes';
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/reviews', reviewRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

async function start(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required.');
    }

    await connectDatabase(mongoUri);

    const port = Number(process.env.PORT ?? 5000);
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void start();

process.on('unhandledRejection', error => {
  console.error('Unhandled rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

