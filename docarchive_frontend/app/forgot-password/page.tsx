'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

import { authRequest } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await authRequest('forgot-password', {
        email: String(form.get('email') ?? '').trim(),
      });

      setMessage(result.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-xl font-bold text-blue-600">
          Archivio
        </p>

        <h1 className="mt-6 text-2xl font-bold">
          Mot de passe oublié
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Saisissez l’adresse e-mail de votre compte pour
          demander un lien de réinitialisation.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block text-sm font-medium">
            Adresse e-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              disabled={loading}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          </label>

          {message && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-blue-700 hover:underline"
        >
          ← Retour à la connexion
        </Link>
      </section>
    </main>
  );
}