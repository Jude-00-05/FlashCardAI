export type FlashcardChunk = {
  front: string;
  back: string;
};

export function chunkTextToFlashcards(text: string): FlashcardChunk[] {
  const cleaned = text
    .replace(/---\s*Page\s*\d+\s*---/gi, '')
    .replace(/\r/g, '')
    .trim();

  const lines = cleaned
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const cards: FlashcardChunk[] = [];

  /**
   * CASE 1: Line-based numbered Q&A (PDF-friendly)
   * 1. Question?
   * Answer line(s)
   */
  for (let i = 0; i < lines.length; i++) {
    const qMatch = lines[i].match(/^(\d+)\.\s+(.*\?)$/);

    if (qMatch) {
      const question = qMatch[2].trim();

      let answer = '';
      let j = i + 1;

      // Collect answer lines until next numbered question
      while (
        j < lines.length &&
        !lines[j].match(/^\d+\.\s+/)
      ) {
        answer += (answer ? ' ' : '') + lines[j];
        j++;
      }

      if (answer.length > 10) {
        cards.push({
          front: question,
          back: answer
        });
      }

      i = j - 1;
    }
  }

  // ✅ If this worked, RETURN EARLY (most PDFs hit this path)
  if (cards.length > 0) {
    return cards;
  }

  /**
   * CASE 2: Inline numbered Q&A
   * 1. Question? Answer. 2. Question? Answer.
   */
  const inlineRegex =
    /(\d+)\.\s+(.*?)\?\s+(.*?)(?=\s+\d+\.|$)/g;

  let match;
  while ((match = inlineRegex.exec(cleaned)) !== null) {
    cards.push({
      front: match[2].trim() + '?',
      back: match[3].trim()
    });
  }

  if (cards.length > 0) {
    return cards;
  }

  /**
   * CASE 3: Fallback paragraph-based chunking
   */
  return cleaned
    .split(/\n{2,}/)
    .filter(p => p.length > 40)
    .map(p => ({
      front: p.split('. ')[0].slice(0, 120),
      back: p
    }));
}
