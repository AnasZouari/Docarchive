'use client';

import {
  Suspense,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { authRequest, clearToken } from '@/lib/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="p-10 text-center">
          Chargement…
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validLink = Boolean(token && email);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirmation = String(
      form.get('password_confirmation') ?? ''
    );

    setError('');

    if (password !== confirmation) {
      setError('Les deux mots de passe doivent être identiques.');
      return;
    }

    setLoading(true);

    try {
      const result = await authRequest('reset-password', {
        email,
        token,
        password,
        password_confirmation: confirmation,
      });

      clearToken();
      setMessage(result.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const field =
    'mt-2 w-full rounded-xl border border-slate-200 px-4 py-3';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-xl font-bold text-blue-600">
          Archivio
        </p>

        <h1 className="mt-6 text-2xl font-bold">
          Nouveau mot de passe
        </h1>

        {!validLink ? (
          <div className="mt-5">
            <p role="alert" className="text-sm text-red-700">
              Le lien est incomplet.
            </p>

            <Link
              href="/forgot-password"
              className="mt-4 inline-block text-sm text-blue-700 underline"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : message ? (
          <div className="mt-5">
            <p
              role="status"
              className="rounded-xl bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </p>

            {/* Rechargement complet pour vider aussi l'état
                de session et le cache Apollo en mémoire. */}
            <a
              href="/login"
              className="mt-5 block rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white"
            >
              Se connecter
            </a>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <p className="break-all text-sm text-slate-500">
              Compte : {email}
            </p>

            <fieldset disabled={loading} className="space-y-5">
              <label className="block text-sm font-medium">
                Nouveau mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={field}
                />
              </label>

              <label className="block text-sm font-medium">
                Confirmer le mot de passe
                <input
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={field}
                />
              </label>
            </fieldset>

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                <p>{error}</p>

                <Link
                  href="/forgot-password"
                  className="mt-2 inline-block underline"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? 'Enregistrement…'
                : 'Modifier le mot de passe'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}