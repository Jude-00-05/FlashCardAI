import React, { useEffect, useState } from 'react';
import { getSubjects, createSubject, getDecksBySubject, createDeck } from '../lib/storage';
import type { Subject, Deck } from '../types/models';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [decks, setDecks] = useState<Record<string, Deck[]>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    let subs = await getSubjects();

    // seed once if empty
    if (subs.length === 0) {
      const s1 = await createSubject('Computer Science', 'DSA, OS, DBMS');
      const s2 = await createSubject('Maths', 'Linear Algebra, Calculus');

      await createDeck(s1.id, 'Data Structures');
      await createDeck(s1.id, 'Operating Systems');
      await createDeck(s2.id, 'Linear Algebra');

      subs = await getSubjects();
    }

    setSubjects(subs);

    const map: Record<string, Deck[]> = {};
    for (const s of subs) {
      map[s.id] = await getDecksBySubject(s.id);
    }
    setDecks(map);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <div className="space-y-6">
        {subjects.map(subject => (
          <div key={subject.id} className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium">{subject.name}</h2>
            <p className="text-sm text-gray-500 mb-3">{subject.description}</p>

            <div className="grid grid-cols-3 gap-3">
              {decks[subject.id]?.map(deck => (
                <Link
                  key={deck.id}
                  to={`/deck/${deck.id}`}
                  className="p-3 border rounded hover:bg-gray-50"
                >
                  <div className="font-medium">{deck.name}</div>
                  <div className="text-xs text-gray-500">Cards inside</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
