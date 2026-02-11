import { useCallback, useEffect, useState } from 'react';
import { generateCardsFromText } from '../lib/ai';
import { extractTextFromImage } from '../lib/ocr';
import { extractTextFromPdf } from '../lib/pdf';
import {
  createCard,
  exportDeckAsCsv,
  exportDeckAsJson,
  getDecks,
  importDeckFromCsv,
  importDeckFromJson
} from '../lib/storage';
import type { Deck } from '../types/models';

type GeneratedCard = {
  front: string;
  back: string;
};

export default function CreateImport() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [status, setStatus] = useState('');
  const [useCloudAI, setUseCloudAI] = useState(false);
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvSubjectName, setCsvSubjectName] = useState('');
  const [csvDeckName, setCsvDeckName] = useState('');

  const loadDecks = useCallback(async () => {
    const data = await getDecks();
    setDecks(data);
  }, []);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  async function handleSave() {
    if (!deckId || !front.trim() || !back.trim()) {
      setStatus('Please select a deck and fill both sides');
      return;
    }

    await createCard(deckId, front.trim(), back.trim());
    setFront('');
    setBack('');
    setStatus('Card saved');
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
    setStatus('PDF imported');
  }

  async function handleImageUpload(file: File) {
    setStatus('Reading image...');
    const text = await extractTextFromImage(file);
    setFront(text.split('\n')[0] ?? '');
    setBack(text);
    setStatus('Image imported');
  }

  async function handleGenerate() {
    if (!back.trim()) {
      setStatus('Nothing to generate from');
      return;
    }

    setStatus('Generating flashcards...');
    const cards = await generateCardsFromText(back, 8);
    setGenerated(cards);
    setStatus(`Generated ${cards.length} cards`);
  }

  async function handleSaveGenerated() {
    if (!deckId) {
      setStatus('Select a deck first');
      return;
    }

    for (const card of generated) {
      await createCard(deckId, card.front.trim(), card.back.trim());
    }

    setGenerated([]);
    setStatus('Generated cards saved');
  }

  async function handleDeckExport() {
    if (!deckId) {
      setStatus('Select a deck first');
      return;
    }

    const json = await exportDeckAsJson(deckId);
    if (!json) {
      setStatus('Could not export this deck');
      return;
    }

    const selectedDeck = decks.find(deck => deck.id === deckId);
    const safeDeckName = (selectedDeck?.name ?? 'deck')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeDeckName || 'deck'}-export.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Deck exported as JSON');
  }

  async function handleJsonImport(file: File) {
    setIsImportingJson(true);
    setStatus('Importing JSON...');

    try {
      const text = await file.text();
      const result = await importDeckFromJson(text);
      await loadDecks();
      setDeckId(result.deck.id);
      setStatus(
        `Imported "${result.deck.name}" with ${result.importedCards} cards into subject "${result.subject.name}"`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      setStatus(message);
    } finally {
      setIsImportingJson(false);
    }
  }

  async function handleDeckExportCsv() {
    if (!deckId) {
      setStatus('Select a deck first');
      return;
    }

    const csv = await exportDeckAsCsv(deckId);
    if (!csv) {
      setStatus('Could not export this deck');
      return;
    }

    const selectedDeck = decks.find(deck => deck.id === deckId);
    const safeDeckName = (selectedDeck?.name ?? 'deck')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeDeckName || 'deck'}-export.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus('Deck exported as CSV');
  }

  async function handleCsvImport(file: File) {
    if (!csvSubjectName.trim() || !csvDeckName.trim()) {
      setStatus('Enter CSV subject and deck names before importing.');
      return;
    }

    setIsImportingCsv(true);
    setStatus('Importing CSV...');

    try {
      const text = await file.text();
      const result = await importDeckFromCsv(text, csvSubjectName, csvDeckName);
      await loadDecks();
      setDeckId(result.deck.id);
      setStatus(
        `Imported CSV deck "${result.deck.name}" with ${result.importedCards} cards into subject "${result.subject.name}"`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV import failed';
      setStatus(message);
    } finally {
      setIsImportingCsv(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="saas-surface p-8">
        <p className="saas-kicker">Content Studio</p>
        <h1 className="saas-title mt-3">Create and Import Flashcards</h1>
        <p className="saas-subtitle mt-3 max-w-2xl">
          Structured workflows for manual creation, file imports, and deterministic generation.
        </p>
      </section>

      <section className="saas-surface p-6">
        <label className="mb-2 block text-sm font-medium text-slate-600">Select Deck</label>
        <select value={deckId} onChange={e => setDeckId(e.target.value)} className="saas-input p-3">
          <option value="">-- Choose a deck --</option>
          {decks.map(deck => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="saas-surface p-6">
          <h2 className="text-lg font-semibold text-slate-900">JSON Transfer</h2>
          <p className="mt-1 text-sm text-slate-500">Export the selected deck or import from a JSON backup.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => void handleDeckExport()} className="saas-btn-primary px-4 py-2 text-sm">
              Export JSON
            </button>
            <label className="saas-btn-secondary cursor-pointer px-4 py-2 text-sm">
              Import JSON
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={isImportingJson}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleJsonImport(file);
                }}
              />
            </label>
          </div>
        </article>

        <article className="saas-surface p-6">
          <h2 className="text-lg font-semibold text-slate-900">CSV Transfer</h2>
          <p className="mt-1 text-sm text-slate-500">Move cards with spreadsheet-compatible CSV format.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => void handleDeckExportCsv()} className="saas-btn-primary px-4 py-2 text-sm">
              Export CSV
            </button>
            <label className="saas-btn-secondary cursor-pointer px-4 py-2 text-sm">
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={isImportingCsv}
                onChange={e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void handleCsvImport(file);
                }}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-2">
            <input
              type="text"
              value={csvSubjectName}
              onChange={e => setCsvSubjectName(e.target.value)}
              placeholder="Subject name for CSV import"
              className="saas-input p-2.5 text-sm"
            />
            <input
              type="text"
              value={csvDeckName}
              onChange={e => setCsvDeckName(e.target.value)}
              placeholder="Deck name for CSV import"
              className="saas-input p-2.5 text-sm"
            />
          </div>
        </article>
      </section>

      <section className="saas-surface p-6">
        <h2 className="text-lg font-semibold text-slate-900">Manual Card Editor</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Front</label>
            <textarea
              value={front}
              onChange={e => setFront(e.target.value)}
              className="saas-input p-3"
              rows={3}
              placeholder="Question / Prompt"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Back</label>
            <textarea
              value={back}
              onChange={e => setBack(e.target.value)}
              className="saas-input p-3"
              rows={5}
              placeholder="Answer / Explanation"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void pasteFromClipboard()} className="saas-btn-secondary px-4 py-2 text-sm">
              Paste from clipboard
            </button>
            <button onClick={() => void handleSave()} className="saas-btn-primary px-4 py-2 text-sm">
              Save Card
            </button>
          </div>
        </div>
      </section>

      <section className="saas-surface p-6">
        <h2 className="text-lg font-semibold text-slate-900">Imports and Generation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="saas-upload cursor-pointer p-4 text-sm text-slate-600">
            Import PDF
            <input
              type="file"
              accept=".pdf"
              className="mt-3 block"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void handlePdfUpload(file);
              }}
            />
          </label>
          <label className="saas-upload cursor-pointer p-4 text-sm text-slate-600">
            Import Image (OCR)
            <input
              type="file"
              accept="image/*"
              className="mt-3 block"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void handleImageUpload(file);
              }}
            />
          </label>
        </div>

        <div className="saas-upload mt-4 p-4">
          <div className="mb-3 flex items-center gap-2">
            <input type="checkbox" checked={useCloudAI} onChange={e => setUseCloudAI(e.target.checked)} />
            <span className="text-sm text-slate-600">Use Cloud AI (Hugging Face)</span>
          </div>
          {useCloudAI && (
            <p className="mb-3 text-xs text-slate-500">
              This toggle is not currently connected. Generation uses deterministic chunking.
            </p>
          )}
          <button onClick={() => void handleGenerate()} className="saas-btn-primary px-4 py-2 text-sm">
            Generate flashcards from text
          </button>
        </div>

        {generated.length > 0 && (
          <div className="mt-4 space-y-3">
            {generated.map((card, idx) => (
              <div key={`${idx}-${card.front.slice(0, 12)}`} className="saas-surface-soft p-4">
                <input
                  className="saas-input mb-2 p-2 text-sm font-medium"
                  value={card.front}
                  onChange={e => {
                    setGenerated(prev =>
                      prev.map((item, index) => (index === idx ? { ...item, front: e.target.value } : item))
                    );
                  }}
                />
                <textarea
                  className="saas-input p-2 text-sm"
                  rows={3}
                  value={card.back}
                  onChange={e => {
                    setGenerated(prev =>
                      prev.map((item, index) => (index === idx ? { ...item, back: e.target.value } : item))
                    );
                  }}
                />
              </div>
            ))}

            <button onClick={() => void handleSaveGenerated()} className="saas-btn-primary px-4 py-2 text-sm">
              Save all generated cards
            </button>
          </div>
        )}
      </section>

      {status && <div className="saas-surface p-4 text-sm text-slate-700">{status}</div>}
    </div>
  );
}
