import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import './index.css';
import { AppShell } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import CreateImport from './pages/CreateImport';
import DeckView from './pages/DeckView';
import StudyMode from './pages/StudyMode';
import AnalyticsPage from './pages/Analytics';
import AuthPage from './pages/Auth';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/study" element={<StudyMode />} />
          <Link to="/study">Study</Link>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateImport />} />
          <Route path="/deck/:deckId" element={<DeckView />} />
          <Route path="/study/:deckId" element={<StudyMode />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </React.StrictMode>
);
