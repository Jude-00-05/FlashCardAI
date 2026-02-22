import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createSubject,
  deleteSubjectCascade,
  exportWorkspaceAsJson,
  getCardsByDeck,
  getDecks,
  getDecksBySubject,
  getReviewHistory,
  getSubjects,
  importWorkspaceFromJson,
  renameSubject
} from '../lib/storage';
import type { Deck, Subject } from '../types/models';

type DashboardStats = {
  totalCards: number;
  dueToday: number;
  accuracy: number;
};

type DeleteModalState = {
  subjectId: string;
  subjectName: string;
  deckCount: number;
  cardCount: number;
};

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [decksBySubject, setDecksBySubject] = useState<Record<string, Deck[]>>({});
  const [stats, setStats] = useState<DashboardStats>({
    totalCards: 0,
    dueToday: 0,
    accuracy: 0
  });

  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectStatus, setSubjectStatus] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  const [settingsStatus, setSettingsStatus] = useState('');
  const [isImportingBackup, setIsImportingBackup] = useState(false);

  const loadDashboard = useCallback(async () => {
    const subs = await getSubjects();
    setSubjects(subs);

    const pairs = await Promise.all(subs.map(async subject => [subject.id, await getDecksBySubject(subject.id)] as const));
    const deckMap = Object.fromEntries(pairs);
    setDecksBySubject(deckMap);

    const allDecks = await getDecks();
    const allCardsNested = await Promise.all(allDecks.map(deck => getCardsByDeck(deck.id)));
    const allCards = allCardsNested.flat();
    const reviewHistory = await getReviewHistory();
    const correctReviews = reviewHistory.filter(item => item.quality >= 4).length;
    const accuracy = reviewHistory.length > 0 ? Math.round((correctReviews / reviewHistory.length) * 100) : 0;
    const dueToday = allCards.filter(card => card.reviewState.due <= Date.now()).length;

    setStats({
      totalCards: allCards.length,
      dueToday,
      accuracy
    });
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const subjectCount = useMemo(() => subjects.length, [subjects.length]);

  async function handleCreateSubject() {
    const name = newSubjectName.trim();

    if (!name) {
      setSubjectStatus('Subject name is required.');
      return;
    }

    const duplicate = subjects.some(subject => subject.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setSubjectStatus('A subject with this name already exists.');
      return;
    }

    await createSubject(name);
    setNewSubjectName('');
    setSubjectStatus('Subject created.');
    await loadDashboard();
  }

  async function handleRenameSubject(subjectId: string) {
    const name = editingSubjectName.trim();

    if (!name) {
      setSubjectStatus('Subject name cannot be empty.');
      return;
    }

    const duplicate = subjects.some(
      subject => subject.id !== subjectId && subject.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setSubjectStatus('A subject with this name already exists.');
      return;
    }

    const renamed = await renameSubject(subjectId, name);
    if (!renamed) {
      setSubjectStatus('Failed to rename subject.');
      return;
    }

    setEditingSubjectId(null);
    setEditingSubjectName('');
    setSubjectStatus('Subject renamed.');
    await loadDashboard();
  }

  async function openDeleteModal(subject: Subject) {
    const subjectDecks = decksBySubject[subject.id] ?? [];
    const cardsByDeck = await Promise.all(subjectDecks.map(deck => getCardsByDeck(deck.id)));
    const cardCount = cardsByDeck.reduce((total, cards) => total + cards.length, 0);

    setDeleteModal({
      subjectId: subject.id,
      subjectName: subject.name,
      deckCount: subjectDecks.length,
      cardCount
    });
  }

  async function handleDeleteSubjectConfirmed() {
    if (!deleteModal) return;

    setIsDeletingSubject(true);

    try {
      const deleted = await deleteSubjectCascade(deleteModal.subjectId);
      if (!deleted) {
        setSubjectStatus('Failed to delete subject.');
        return;
      }

      setSubjectStatus(`Deleted subject "${deleteModal.subjectName}" and associated content.`);
      setDeleteModal(null);
      await loadDashboard();
    } finally {
      setIsDeletingSubject(false);
    }
  }

  async function handleExportWorkspace() {
    const json = await exportWorkspaceAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `flashcard-workspace-${timestamp}.json`;
    anchor.click();

    URL.revokeObjectURL(url);
    setSettingsStatus('Workspace exported successfully.');
  }

  async function handleImportWorkspace(file: File) {
    const confirmed = window.confirm(
      'Importing workspace will replace all current subjects, decks, and cards. Continue?'
    );
    if (!confirmed) return;

    setIsImportingBackup(true);

    try {
      const text = await file.text();
      const result = await importWorkspaceFromJson(text);
      setSettingsStatus(
        `Workspace imported: ${result.subjects} subjects, ${result.decks} decks, ${result.cards} cards.`
      );
      await loadDashboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Workspace import failed.';
      setSettingsStatus(message);
    } finally {
      setIsImportingBackup(false);
    }
  }

  return (
    <>
      <div className="space-y-12">
        <section className="saas-surface p-8 md:p-10">
          <p className="saas-kicker">Overview</p>
          <h1 className="saas-title mt-3">Productive Learning</h1>
          <p className="mt-2 text-sm text-slate-500">Create, review, improve.</p>
        </section>

        <section className="saas-option-grid">
          <Link to="/create" className="saas-option-tile">
            <p className="saas-kicker">Primary Option</p>
            <h2 className="mt-3 text-xl font-semibold">Create Cards</h2>
          </Link>

          <Link to="/study" className="saas-option-tile">
            <p className="saas-kicker">Primary Option</p>
            <h2 className="mt-3 text-xl font-semibold">Study Session</h2>
          </Link>

          <Link to="/analytics" className="saas-option-tile">
            <p className="saas-kicker">Primary Option</p>
            <h2 className="mt-3 text-xl font-semibold">Analytics</h2>
          </Link>

          <a href="#deck-library" className="saas-option-tile">
            <p className="saas-kicker">Primary Option</p>
            <h2 className="mt-3 text-xl font-semibold">Deck Library</h2>
          </a>
        </section>

        <section className="saas-grid-main">
          <article className="saas-surface p-7">
            <p className="text-sm text-slate-500">Total Cards</p>
            <p className="mt-3 text-3xl font-semibold">{stats.totalCards}</p>
            <p className="mt-2 text-sm text-slate-400">{subjectCount} subject(s)</p>
          </article>

          <article className="saas-surface p-7">
            <p className="text-sm text-slate-500">Due Today</p>
            <p className="mt-3 text-3xl font-semibold text-blue-700">{stats.dueToday}</p>
          </article>

          <article className="saas-surface p-7">
            <p className="text-sm text-slate-500">Accuracy</p>
            <p className="mt-3 text-3xl font-semibold text-blue-700">{stats.accuracy}%</p>
          </article>
        </section>

        <section className="saas-surface p-6 md:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="saas-kicker">Subjects</p>
              <h2 className="mt-2 text-2xl font-semibold">Subject Management</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={newSubjectName}
              onChange={event => setNewSubjectName(event.target.value)}
              className="saas-input p-3"
              placeholder="New subject name"
            />
            <button onClick={() => void handleCreateSubject()} className="saas-btn-primary px-4 py-3 text-sm">
              Add Subject
            </button>
          </div>

          {subjectStatus && <p className="mt-4 text-sm text-slate-500">{subjectStatus}</p>}
        </section>

        <section className="saas-surface p-6 md:p-7">
          <div className="mb-6 space-y-2">
            <p className="saas-kicker">Settings</p>
            <h2 className="mt-2 text-2xl font-semibold">Backup and Restore</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => void handleExportWorkspace()} className="saas-btn-secondary px-5 py-2.5 text-sm">
              Export Workspace JSON
            </button>

            <label className="saas-btn-primary cursor-pointer px-5 py-2.5 text-sm">
              Import Workspace JSON
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={isImportingBackup}
                onChange={event => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) {
                    void handleImportWorkspace(file);
                  }
                }}
              />
            </label>
          </div>

          {settingsStatus && <p className="mt-4 text-sm text-slate-500">{settingsStatus}</p>}
        </section>

        <section id="deck-library" className="space-y-6">
          {subjects.map(subject => {
            const isEditing = editingSubjectId === subject.id;

            return (
              <article key={subject.id} className="saas-surface space-y-6 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={editingSubjectName}
                          onChange={event => setEditingSubjectName(event.target.value)}
                          className="saas-input max-w-sm p-2.5 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => void handleRenameSubject(subject.id)}
                          className="saas-btn-primary px-3 py-2 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingSubjectId(null);
                            setEditingSubjectName('');
                          }}
                          className="saas-btn-secondary px-3 py-2 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="truncate text-2xl font-semibold tracking-tight">{subject.name}</h2>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="saas-badge-min">
                      {decksBySubject[subject.id]?.length ?? 0} deck(s)
                    </span>
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => {
                            setEditingSubjectId(subject.id);
                            setEditingSubjectName(subject.name);
                            setSubjectStatus('');
                          }}
                          className="saas-btn-ghost"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => void openDeleteModal(subject)}
                          className="saas-btn-ghost saas-btn-ghost-danger"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {decksBySubject[subject.id]?.map(deck => (
                    <div key={deck.id} className="saas-surface-soft space-y-4 p-5">
                      <p className="text-lg font-semibold">{deck.name}</p>
                      <p className="text-sm text-slate-500">Open deck and manage cards</p>
                      <div className="flex gap-2">
                        <Link to={`/deck/${deck.id}`} className="saas-btn-ghost">
                          Manage
                        </Link>
                        <Link to={`/study/${deck.id}`} className="saas-btn-ghost">
                          Study
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm">
          <div className="saas-surface w-full max-w-lg p-6 sm:p-7">
            <p className="saas-kicker">Confirm Delete</p>
            <h3 className="mt-2 text-2xl font-semibold">Delete "{deleteModal.subjectName}"?</h3>
            <p className="mt-3 text-sm text-slate-500">
              This will permanently remove the subject and all associated decks and cards.
            </p>

            <div className="mt-5 grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Decks to delete</span>
                <span className="font-semibold text-slate-900">{deleteModal.deckCount}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Cards to delete</span>
                <span className="font-semibold text-slate-900">{deleteModal.cardCount}</span>
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={isDeletingSubject}
                className="saas-btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteSubjectConfirmed()}
                disabled={isDeletingSubject}
                className="saas-btn-danger px-4 py-2 text-sm disabled:opacity-60"
              >
                {isDeletingSubject ? 'Deleting...' : 'Delete Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
