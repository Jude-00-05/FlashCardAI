import { chunkTextToFlashcards } from './chunker';

export type GeneratedCard = {
  front: string;
  back: string;
};

/**
 * Deterministic flashcard generator.
 * No cloud AI, no local AI.
 * Reliable, predictable, exam-friendly.
 */
export async function generateCardsFromText(
  rawText: string,
  maxCards = 20
): Promise<GeneratedCard[]> {
  const cards = chunkTextToFlashcards(rawText);
  return cards.slice(0, maxCards);
}
