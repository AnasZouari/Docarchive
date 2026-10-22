'use client';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useAuth } from '@/components/AuthProvider';
import {
  authRequest,
  hasAdminRole,
  type User,
} from '@/lib/auth';

type AuditEntry = {
  id: number;
  user_name: string;
  user_role: string | null;
  center_name: string | null;
  document_id: number;
  document_title: string;
  document_reference: string;
  action: string;
  created_at: string;
};

type AuditPage = {
  data: AuditEntry[];
  current_page: number;
  last_page: number;
  total: number;
};

type Filters = {
  action: string;
  from: string;
  to: string;
};

const labels: Record<string, string> = {
  created: 'Ajout',
  archived: 'Archivage',
  restored: 'Restauration',
  deleted: 'Suppression',
  download_requested: 'Demande de téléchargement',
};

const field =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm';

function formatDate(value: string) {
  // Le backend renvoie ici une date SQL en UTC.
  const date = new Date(
    value.includes('T')
      ? value
      : `${value.replace(' ', 'T')}Z`
  );

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('fr-FR', {
    timeZone: 'UTC',
  });
}

export default function HistoryPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (!hasAdminRole(user)) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">Accès refusé</h1>
        <p className="mt-3">
          Cette page est réservée aux administrateurs.
        </p>
      </main>
    );
  }

  return (
    <History
      key={`${user.id}-${user.role}-${user.center_id}`}
      user={user}
    />
  );
}

function History({ user }: { user: User }) {
  const [draft, setDraft] = useState<Filters>({
    action: '',
    from: '',
    to: '',
  });

  const [filters, setFilters] = useState<Filters>(draft);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);

  const [result, setResult] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setResult(null);

    const params = new URLSearchParams({
      page: String(page),
    });

    if (filters.action) params.set('action', filters.action);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);

    authRequest(`admin/audit-logs?${params.toString()}`)
      .then((data: AuditPage) => {
        if (active) setResult(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, page, attempt]);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (draft.from && draft.to && draft.from > draft.to) {
      setError('Vérifiez les dates de début et de fin.');
      return;
    }

    setPage(1);
    setFilters({ ...draft });
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-10 sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          Traçabilité
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Historique des actions
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          {user.role === 'super_admin'
            ? 'Consultez les événements de tous les centres.'
            : 'Consultez les événements de votre centre.'}
          {' '}Les dates et les filtres sont exprimés en UTC.
        </p>
      </div>

      <form
        onSubmit={apply}
        className="rounded-2xl border bg-white p-6"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <label className="text-sm font-medium">
            Action
            <select
              value={draft.action}
              onChange={event =>
                setDraft(previous => ({
                  ...previous,
                  action: event.target.value,
                }))
              }
              className={field}
            >
              <option value="">Toutes les actions</option>

              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Du
            <input
              type="date"
              value={draft.from}
              onChange={event =>
                setDraft(previous => ({
                  ...previous,
                  from: event.target.value,
                }))
              }
              className={field}
            />
          </label>

          <label className="text-sm font-medium">
            Au
            <input
              type="date"
              value={draft.to}
              min={draft.from || undefined}
              onChange={event =>
                setDraft(previous => ({
                  ...previous,
                  to: event.target.value,
                }))
              }
              className={field}
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Filtrer
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}

          <button
            type="button"
            onClick={() => setAttempt(value => value + 1)}
            disabled={loading}
            className="ml-3 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading && <p role="status">Chargement…</p>}

      {!loading && result && (
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="flex items-center justify-between gap-3 border-b p-5">
            <p className="font-semibold">
              {result.total} événement(s)
            </p>

            <button
              type="button"
              onClick={() => setAttempt(value => value + 1)}
              className="text-sm text-blue-700 underline"
            >
              Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-4">Date UTC</th>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Document</th>
                  <th className="p-4">Centre</th>
                </tr>
              </thead>

              <tbody>
                {result.data.map(entry => (
                  <tr key={entry.id} className="border-t align-top">
                    <td className="whitespace-nowrap p-4">
                      {formatDate(entry.created_at)}
                    </td>

                    <td className="p-4">
                      {entry.user_name}
                    </td>

                    <td className="p-4">
                      <span className="inline-block rounded-lg bg-blue-50 px-3 py-1 text-xs text-blue-700">
                        {labels[entry.action] ?? entry.action}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-medium">
                        {entry.document_title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry.document_reference}
                      </p>
                    </td>

                    <td className="p-4">
                      {entry.center_name ?? 'Non affecté'}
                    </td>
                  </tr>
                ))}

                {!result.data.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-slate-500"
                    >
                      Aucun événement pour ces critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 border-t p-5">
            <button
              type="button"
              disabled={result.current_page <= 1}
              onClick={() => setPage(value => value - 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            >
              Précédent
            </button>

            <p className="text-sm text-slate-500">
              Page {result.current_page} / {result.last_page}
            </p>

            <button
              type="button"
              disabled={result.current_page >= result.last_page}
              onClick={() => setPage(value => value + 1)}
              className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </section>
      )}
    </main>
  );
}