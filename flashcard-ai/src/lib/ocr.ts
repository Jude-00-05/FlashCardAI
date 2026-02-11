import Tesseract from 'tesseract.js';

export async function extractTextFromImage(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);

  const result = await Tesseract.recognize(imageUrl, 'eng');

  URL.revokeObjectURL(imageUrl);
  return result.data.text.trim();
}
