import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="saas-container flex min-h-[78vh] items-center justify-center py-12">
      <div className="saas-surface w-full max-w-md p-8">
        <p className="saas-kicker">Welcome Back</p>
        <h1 className="mt-3 text-3xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to continue your study workflow.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          New here?{' '}
          <Link to="/register" className="font-semibold text-blue-700">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
