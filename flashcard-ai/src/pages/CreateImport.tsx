import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateCardsFromText } from '../lib/ai';
import { extractTextFromImage } from '../lib/ocr';
import { extractTextFromPdf } from '../lib/pdf';
import {
  createCard,
  createDeck,
  deleteDeck,
  exportDeckAsCsv,
  exportDeckAsJson,
  getDecksBySubject,
  getSubjects,
  importDeckFromCsv,
  importDeckFromJson,
  renameDeck
} from '../lib/storage';
import type { Deck, Subject } from '../types/models';

type GeneratedCard = {
  front: string;
  back: string;
};

export default function CreateImport() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState('');

  const [newDeckName, setNewDeckName] = useState('');
  const [renameDeckName, setRenameDeckName] = useState('');

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [status, setStatus] = useState('');
  const [generated, setGenerated] = useState<GeneratedCard[]>([]);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvSubjectName, setCsvSubjectName] = useState('');
  const [csvDeckName, setCsvDeckName] = useState('');

  const selectedDeck = useMemo(() => decks.find(deck => deck.id === deckId) ?? null, [decks, deckId]);

  const loadSubjects = useCallback(async () => {
    const data = await getSubjects();
    setSubjects(data);

    if (!subjectId && data.length > 0) {
      setSubjectId(data[0].id);
    }
  }, [subjectId]);

  const loadDecks = useCallback(async () => {
    if (!subjectId) {
      setDecks([]);
      setDeckId('');
      return;
    }

    const data = await getDecksBySubject(subjectId);
    setDecks(data);

    if (data.length === 0) {
      setDeckId('');
      return;
    }

    const stillExists = data.some(deck => deck.id === deckId);
    if (!stillExists) {
      setDeckId(data[0].id);
    }
  }, [subjectId, deckId]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  async function handleCreateDeck() {
    if (!subjectId) {
      setStatus('Select a subject first.');
      return;
    }

    const name = newDeckName.trim();
    if (!name) {
      setStatus('Deck name is required.');
      return;
    }

    const created = await createDeck(subjectId, name);
    setNewDeckName('');
    setDeckId(created.id);
    await loadDecks();
    setStatus(`Deck "${created.name}" created.`);
  }

  async function handleRenameDeck() {
    if (!deckId) {
      setStatus('Select a deck to rename.');
      return;
    }

    const nextName = renameDeckName.trim();
    if (!nextName) {
      setStatus('Enter a new deck name.');
      return;
    }

    const updated = await renameDeck(deckId, nextName);
    if (!updated) {
      setStatus('Failed to rename deck.');
      return;
    }

    setRenameDeckName('');
    await loadDecks();
    setStatus(`Deck renamed to "${updated.name}".`);
  }

  async function handleDeleteDeck() {
    if (!deckId || !selectedDeck) {
      setStatus('Select a deck to delete.');
      return;
    }

    const confirmed = window.confirm(`Delete deck "${selectedDeck.name}" and all its cards?`);
    if (!confirmed) return;

    const ok = await deleteDeck(deckId);
    if (!ok) {
      setStatus('Failed to delete deck.');
      return;
    }

    setStatus(`Deck "${selectedDeck.name}" deleted.`);
    setDeckId('');
    setRenameDeckName('');
    await loadDecks();
  }

  async function handleSave() {
    if (!deckId || !front.trim() || !back.trim()) {
      setStatus('Please select a deck and fill both sides.');
      return;
    }

    await createCard(deckId, front.trim(), back.trim());
    setFront('');
    setBack('');
    setStatus('Card saved.');
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
    setStatus('PDF imported.');
  }

  async function handleImageUpload(file: File) {
    setStatus('Reading image...');
    const text = await extractTextFromImage(file);
    setFront(text.split('\n')[0] ?? '');
    setBack(text);
    setStatus('Image imported.');
  }

  async function handleGenerate() {
    if (!back.trim()) {
      setStatus('Nothing to generate from.');
      return;
    }

    setStatus('Generating flashcards...');
    const cards = await generateCardsFromText(back, 8);
    setGenerated(cards);
    setStatus(`Generated ${cards.length} cards.`);
  }

  async function handleSaveGenerated() {
    if (!deckId) {
      setStatus('Select a deck first.');
      return;
    }

    for (const card of generated) {
      await createCard(deckId, card.front.trim(), card.back.trim());
    }

    setGenerated([]);
    setStatus('Generated cards saved.');
  }

  async function handleDeckExport() {
    if (!deckId) {
      setStatus('Select a deck first.');
      return;
    }

    const json = await exportDeckAsJson(deckId);
    if (!json) {
      setStatus('Could not export this deck.');
      return;
    }

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
    setStatus('Deck exported as JSON.');
  }

  async function handleJsonImport(file: File) {
    setIsImportingJson(true);
    setStatus('Importing JSON...');

    try {
      const text = await file.text();
      const result = await importDeckFromJson(text);
      await loadSubjects();
      setSubjectId(result.deck.subjectId);
      setDeckId(result.deck.id);
      setStatus(`Imported "${result.deck.name}" with ${result.importedCards} cards into subject "${result.subject.name}".`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed.';
      setStatus(message);
    } finally {
      setIsImportingJson(false);
    }
  }

  async function handleDeckExportCsv() {
    if (!deckId) {
      setStatus('Select a deck first.');
      return;
    }

    const csv = await exportDeckAsCsv(deckId);
    if (!csv) {
      setStatus('Could not export this deck.');
      return;
    }

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
    setStatus('Deck exported as CSV.');
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
      await loadSubjects();
      setSubjectId(result.deck.subjectId);
      setDeckId(result.deck.id);
      setStatus(`Imported CSV deck "${result.deck.name}" with ${result.importedCards} cards into subject "${result.subject.name}".`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV import failed.';
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

      <section className="saas-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Deck Management</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Select Subject</label>
            <select value={subjectId} onChange={event => setSubjectId(event.target.value)} className="saas-input p-3">
              <option value="">-- Choose a subject --</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Select Deck</label>
            <select value={deckId} onChange={event => setDeckId(event.target.value)} className="saas-input p-3">
              <option value="">-- Choose a deck --</option>
              {decks.map(deck => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={newDeckName}
            onChange={event => setNewDeckName(event.target.value)}
            placeholder="New deck name"
            className="saas-input p-3"
          />
          <button onClick={() => void handleCreateDeck()} className="saas-btn-primary px-4 py-2 text-sm">
            Add Deck
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={renameDeckName}
            onChange={event => setRenameDeckName(event.target.value)}
            placeholder="Rename selected deck"
            className="saas-input p-3"
          />
          <button onClick={() => void handleRenameDeck()} className="saas-btn-secondary px-4 py-2 text-sm">
            Rename Deck
          </button>
          <button onClick={() => void handleDeleteDeck()} className="saas-btn-danger px-4 py-2 text-sm">
            Delete Deck
          </button>
        </div>
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
                onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
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
                onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void handleCsvImport(file);
                }}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-2">
            <input
              type="text"
              value={csvSubjectName}
              onChange={event => setCsvSubjectName(event.target.value)}
              placeholder="Subject name for CSV import"
              className="saas-input p-2.5 text-sm"
            />
            <input
              type="text"
              value={csvDeckName}
              onChange={event => setCsvDeckName(event.target.value)}
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
              onChange={event => setFront(event.target.value)}
              className="saas-input p-3"
              rows={3}
              placeholder="Question / Prompt"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-600">Back</label>
            <textarea
              value={back}
              onChange={event => setBack(event.target.value)}
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
        <h2 className="text-lg font-semibold text-slate-900">Imports and Deterministic Generation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="saas-upload cursor-pointer p-4 text-sm text-slate-600">
            Import PDF
            <input
              type="file"
              accept=".pdf"
              className="mt-3 block"
              onChange={event => {
                const file = event.target.files?.[0];
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
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) void handleImageUpload(file);
              }}
            />
          </label>
        </div>

        <div className="saas-upload mt-4 p-4">
          <p className="mb-3 text-sm text-slate-600">Generation uses deterministic chunking only.</p>
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
                  onChange={event => {
                    setGenerated(prev =>
                      prev.map((item, index) => (index === idx ? { ...item, front: event.target.value } : item))
                    );
                  }}
                />
                <textarea
                  className="saas-input p-2 text-sm"
                  rows={3}
                  value={card.back}
                  onChange={event => {
                    setGenerated(prev =>
                      prev.map((item, index) => (index === idx ? { ...item, back: event.target.value } : item))
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
