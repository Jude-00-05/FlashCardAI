import { Router } from 'express';

type GenerateRequestBody = {
  text?: string;
  maxCards?: number;
};

type QaCard = {
  question: string;
  answer: string;
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function parseMaxCards(value: number | undefined): number {
  if (!Number.isFinite(value)) return 20;
  return Math.max(1, Math.min(50, Math.floor(value as number)));
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function normalizeCards(parsed: unknown, maxCards: number): QaCard[] {
  const source = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { cards?: unknown }).cards)
      ? (parsed as { cards: unknown[] }).cards
      : [];

  return source
    .filter(item => typeof item === 'object' && item !== null)
    .map(item => {
      const record = item as Record<string, unknown>;
      const question = typeof record.question === 'string' ? record.question.trim() : '';
      const answer = typeof record.answer === 'string' ? record.answer.trim() : '';
      return { question, answer };
    })
    .filter(card => card.question.length > 0 && card.answer.length > 0)
    .slice(0, maxCards);
}

const router = Router();

router.post('/generate', async (req, res) => {
  const { text, maxCards } = req.body as GenerateRequestBody;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: 'text is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: 'GROQ_API_KEY is not configured.' });
  }

  const limit = parseMaxCards(maxCards);
  const model = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You generate study flashcards. Return only valid JSON with this exact shape: {"cards":[{"question":"...","answer":"..."}]}. No markdown, no explanation.'
          },
          {
            role: 'user',
            content: `Create up to ${limit} high-quality flashcards from the following text:\n\n${text}`
          }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ message: 'Groq request failed.', detail });
    }

    const payload = (await response.json()) as GroqChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content ?? '';
    const cleaned = stripCodeFences(content);
    const parsed = JSON.parse(cleaned) as unknown;
    const cards = normalizeCards(parsed, limit);

    if (cards.length === 0) {
      return res.status(422).json({ message: 'Groq returned no valid cards in {question,answer} format.' });
    }

    return res.status(200).json({ cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'AI generation failed.', detail: message });
  }
});

export default router;
