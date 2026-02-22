import { chunkTextToFlashcards } from './chunker';

export type GeneratedCard = {
  front: string;
  back: string;
};

type GrokCard = {
  question: string;
  answer: string;
};

type GrokResponse = {
  cards: GrokCard[];
};

/**
 * Flashcard generator.
 * Deterministic mode is used only when useCloudAI is false.
 */
export async function generateCardsFromText(
  rawText: string,
  maxCards = 20,
  useCloudAI = false
): Promise<GeneratedCard[]> {
  if (!useCloudAI) {
    const cards = chunkTextToFlashcards(rawText);
    return cards.slice(0, maxCards);
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  try {
    const response = await fetch(`${apiBaseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, maxCards })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Grok request failed (${response.status}): ${detail || 'Unknown error'}`);
    }

    const payload = (await response.json()) as GrokResponse;
    const normalized = (payload.cards ?? [])
      .filter(card => typeof card.question === 'string' && typeof card.answer === 'string')
      .map(card => ({
        front: card.question.trim(),
        back: card.answer.trim()
      }))
      .filter(card => card.front.length > 0 && card.back.length > 0)
      .slice(0, maxCards);

    if (normalized.length === 0) {
      throw new Error('Grok returned no valid cards in {question, answer} format.');
    }

    return normalized;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Grok error';
    throw new Error(`Cloud AI generation failed: ${message}`);
  }
}
