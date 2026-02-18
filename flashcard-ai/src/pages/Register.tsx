import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Name, email, and a password of at least 6 characters are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Registration failed. Try a different email.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="saas-container flex min-h-[78vh] items-center justify-center py-12">
      <div className="saas-surface w-full max-w-md p-8">
        <p className="saas-kicker">Get Started</p>
        <h1 className="mt-3 text-3xl font-semibold">Create Account</h1>
        <p className="mt-2 text-sm text-slate-500">Start managing subjects, decks, and flashcards securely.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-500">Name</label>
            <input
              type="text"
              value={name}
              onChange={event => setName(event.target.value)}
              className="saas-input p-3"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="saas-input p-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="saas-input p-3"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button disabled={submitting} className="saas-btn-primary w-full px-4 py-2.5 text-sm disabled:opacity-60">
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
