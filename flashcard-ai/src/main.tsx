import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './index.css';
import App from './App';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AnalyticsPage from './pages/Analytics';
import CreateImport from './pages/CreateImport';
import Dashboard from './pages/Dashboard';
import DeckView from './pages/DeckView';
import Login from './pages/Login';
import Register from './pages/Register';
import StudyMode from './pages/StudyMode';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/study" element={<StudyMode />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create" element={<CreateImport />} />
              <Route path="/deck/:deckId" element={<DeckView />} />
              <Route path="/study/:deckId" element={<StudyMode />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </App>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
