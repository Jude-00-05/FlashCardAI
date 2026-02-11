import { generateCardsFromText } from '../lib/ai';
import React, { useEffect, useState } from 'react';
import { extractTextFromImage } from '../lib/ocr';
import { extractTextFromPdf } from '../lib/pdf';
import { getDecks, createCard } from '../lib/storage';
import type { Deck } from '../types/models';

export default function CreateImport() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [status, setStatus] = useState('');
  const [useCloudAI, setUseCloudAI] = useState(false);
  const [generated, setGenerated] = useState<
  { front: string; back: string }[]
>([]);

  useEffect(() => {
    getDecks().then(setDecks);
  }, []);

  async function handleSave() {
    if (!deckId || !front || !back) {
      setStatus('Please select a deck and fill both sides');
      return;
    }

    await createCard(deckId, front, back);
    setFront('');
    setBack('');
    setStatus('Card saved ✅');
  }

  async function pasteFromClipboard() {
    const text = await navigator.clipboard.readText();
    setFront(text.split('\n')[0] ?? '');
    setBack(text);
  }

  async function handlePdfUpload(file: File) {
    setStatus('Reading PDF...');
    const text = await extractTextFromPdf(file);
    setFront(text.split('\n')[0] ?? '');
    setBack(text);
    setStatus('PDF imported ✅');
  }
  async function handleImageUpload(file: File) {
  setStatus('Reading image...');
  const text = await extractTextFromImage(file);
  setFront(text.split('\n')[0] ?? '');
  setBack(text);
  setStatus('Image imported ✅');
}
async function handleGenerate() {
  if (!back) {
    setStatus('Nothing to generate from');
    return;
  }

  setStatus('Generating flashcards...');
  const cards = await generateCardsFromText(back, 8, false);
  setGenerated(cards);
  setStatus(`Generated ${cards.length} cards ✨`);
}


  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Create / Import</h1>

      {/* Deck selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Select Deck</label>
        <select
          value={deckId}
          onChange={e => setDeckId(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">-- Choose a deck --</option>
          {decks.map(d => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Front */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Front</label>
        <textarea
          value={front}
          onChange={e => setFront(e.target.value)}
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Question / Prompt"
        />
      </div>

      {/* Back */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Back</label>
        <textarea
          value={back}
          onChange={e => setBack(e.target.value)}
          className="w-full border rounded p-2"
          rows={4}
          placeholder="Answer / Explanation"
        />
      </div>

      {/* Paste helper */}
      <div className="mb-4">
        <button
          onClick={pasteFromClipboard}
          className="text-sm text-brand-500 underline"
        >
          Paste from clipboard
        </button>
      </div>

      {/* PDF upload — THIS IS THE FIX */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Import PDF</label>
        <input
          type="file"
          accept=".pdf"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handlePdfUpload(file);
          }}
          className="text-sm"
        />
      </div>
      {/* Image OCR upload */}
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">Import Image (OCR)</label>
  <input
    type="file"
    accept="image/*"
    onChange={e => {
      const file = e.target.files?.[0];
      if (file) handleImageUpload(file);
    }}
    className="text-sm"
  />
</div>
{/* AI Generation */}
<div className="mb-6 p-4 border rounded bg-gray-50">
  <h3 className="font-medium mb-2">AI Flashcard Generator</h3>
    <div className="mb-3 flex items-center gap-2">
  <input
    type="checkbox"
    checked={useCloudAI}
    onChange={e => setUseCloudAI(e.target.checked)}
  />
  <span className="text-sm">
    Use Cloud AI (Hugging Face)
  </span>
</div>

{useCloudAI && (
  <p className="text-xs text-gray-500 mb-2">
    Text will be sent to Hugging Face for processing.
  </p>
)}

  <button
    onClick={handleGenerate}
    className="px-3 py-1 bg-brand-500 text-white rounded text-sm"
  >
    Generate flashcards from text
  </button>

  {generated.length > 0 && (
    <div className="mt-4 space-y-3">
      {generated.map((c, idx) => (
        <div key={idx} className="bg-white p-3 border rounded">
          <input
            className="w-full font-medium mb-1 border p-1"
            value={c.front}
            onChange={e => {
              const copy = [...generated];
              copy[idx].front = e.target.value;
              setGenerated(copy);
            }}
          />
          <textarea
            className="w-full text-sm border p-1"
            rows={3}
            value={c.back}
            onChange={e => {
              const copy = [...generated];
              copy[idx].back = e.target.value;
              setGenerated(copy);
            }}
          />
        </div>
      ))}

      <button
        className="mt-2 px-3 py-1 border rounded text-sm"
        onClick={async () => {
          if (!deckId) {
            setStatus('Select a deck first');
            return;
          }
          for (const c of generated) {
            await createCard(deckId, c.front, c.back);
          }
          setGenerated([]);
          setStatus('Generated cards saved ✅');
        }}
      >
        Save all generated cards
      </button>
    </div>
  )}
</div>



      <button
        onClick={handleSave}
        className="px-4 py-2 bg-brand-500 text-white rounded"
      >
        Save Card
      </button>

      {status && (
        <div className="mt-3 text-sm text-gray-600">{status}</div>
      )}
    </div>
  );
}
