'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

import { authRequest } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const { acceptSession } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setLoading(true);
    setError('');

    try {
      const session = await authRequest('login', {
        email: String(form.get('email') ?? '').trim(),
        password: String(form.get('password') ?? ''),
      });

      await acceptSession(session.token, session.user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const field =
    'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xl font-bold text-blue-600">
          Archivio
        </p>

        <h1 className="mt-6 text-2xl font-bold">
          Connexion
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Accédez à votre espace documentaire.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <fieldset disabled={loading} className="space-y-5">
            <label className="block text-sm font-medium">
              Adresse e-mail
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={255}
                className={field}
              />
            </label>

            <label className="block text-sm font-medium">
              Mot de passe
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className={field}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                aria-pressed={showPassword}
                onClick={() => setShowPassword(value => !value)}
                className="text-sm text-blue-700"
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </fieldset>

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
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Pour obtenir un compte, contactez votre administrateur.
        </p>
      </section>
    </main>
  );
}