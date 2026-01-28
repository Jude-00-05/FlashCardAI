import { extractTextFromPdf } from '../lib/pdf';
import React, { useEffect, useState } from 'react';
import { getDecks, createCard } from '../lib/storage';
import type { Deck } from '../types/models';

export default function CreateImport() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [status, setStatus] = useState('');

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
  {/* PDF upload */}
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
