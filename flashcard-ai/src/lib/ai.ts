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

export async function generateCardsFromText(
  rawText: string,
  maxCards = 20
): Promise<GeneratedCard[]> {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

  try {
    const response = await fetch(`${apiBaseUrl}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, maxCards })
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq request failed (${response.status}): ${detail || 'Unknown error'}`);
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
      throw new Error('Groq returned no valid cards in {question, answer} format.');
    }

    return normalized;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Groq error';
    throw new Error(`Cloud AI generation failed: ${message}`);
  }
}
