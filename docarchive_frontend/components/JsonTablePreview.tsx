'use client';

import { useEffect, useRef, useState } from 'react';
import { documentResponse } from '@/lib/document-files';

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

type PreviewDocument = {
  id: string | number;
  title?: string;
  file_name?: string;
  file_path: string;
};

function isObject(
  value: Json
): value is { [key: string]: Json } {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

const label = (key: string) => key.replace(/_/g, ' ');

const cellClass =
  'border-b border-slate-100 px-4 py-3 text-left align-top text-sm text-slate-700';

function Value({
  value,
  depth = 0,
}: {
  value: Json | undefined;
  depth?: number;
}) {
  if (value === undefined) {
    return <span className="text-slate-400">—</span>;
  }

  if (value === null) {
    return <span className="text-slate-400">null</span>;
  }

  if (typeof value !== 'object') {
    return (
      <span className="whitespace-pre-wrap break-words">
        {String(value)}
      </span>
    );
  }

  if (depth >= 6) {
    return (
      <details>
        <summary className="cursor-pointer text-blue-700">
          Voir les données imbriquées
        </summary>

        <pre className="max-h-64 max-w-xl overflow-auto whitespace-pre-wrap text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  }

  return <JsonTable value={value} depth={depth + 1} />;
}

export function JsonTable({
  value,
  depth = 0,
}: {
  value: Json;
  depth?: number;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 25;

  if (Array.isArray(value)) {
    if (!value.length) {
      return (
        <p className="p-3 text-sm text-slate-500">
          Tableau vide.
        </p>
      );
    }

    const records = value.every(isObject);

    const columns = records
      ? Array.from(
          new Set(
            value.flatMap(row =>
              Object.keys(row as object)
            )
          )
        )
      : ['Valeur'];

    if (records && !columns.length) {
      columns.push('(objet vide)');
    }

    const pages = Math.ceil(value.length / pageSize);
    const current = Math.min(page, pages - 1);

    const rows = value.slice(
      current * pageSize,
      (current + 1) * pageSize
    );

    return (
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white">
        <div
          className="max-h-[32rem] overflow-auto"
          tabIndex={0}
          role="region"
          aria-label="Tableau de données JSON"
        >
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className={cellClass}>
                  #
                </th>

                {columns.map(key => (
                  <th
                    scope="col"
                    key={key}
                    title={key}
                    className={`${cellClass} font-semibold`}
                  >
                    {label(key)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={current * pageSize + index}>
                  <th
                    scope="row"
                    className={`${cellClass} font-normal`}
                  >
                    {current * pageSize + index + 1}
                  </th>

                  {columns.map(key => (
                    <td key={key} className={cellClass}>
                      <Value
                        value={
                          records
                            ? (
                                row as {
                                  [key: string]: Json;
                                }
                              )[key]
                            : row
                        }
                        depth={depth}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-slate-500">
          <span>
            {value.length} ligne(s) · page{' '}
            {current + 1}/{pages}
          </span>

          {pages > 1 && (
            <div className="flex gap-3">
              <button
                type="button"
                disabled={current === 0}
                onClick={() => setPage(current - 1)}
                className="text-blue-700 disabled:opacity-40"
              >
                Précédent
              </button>

              <button
                type="button"
                disabled={current + 1 >= pages}
                onClick={() => setPage(current + 1)}
                className="text-blue-700 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isObject(value)) {
    const entries = Object.entries(value);

    if (!entries.length) {
      return (
        <p className="p-3 text-sm text-slate-500">
          Objet vide.
        </p>
      );
    }

    const scalar = entries.filter(
      ([, item]) =>
        item === null || typeof item !== 'object'
    );

    const nested = entries.filter(
      ([, item]) =>
        item !== null && typeof item === 'object'
    );

    return (
      <div className="space-y-4">
        {scalar.length > 0 && (
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className={cellClass}>
                    Champ
                  </th>
                  <th scope="col" className={cellClass}>
                    Valeur
                  </th>
                </tr>
              </thead>

              <tbody>
                {scalar.map(([key, item]) => (
                  <tr key={key}>
                    <th
                      scope="row"
                      title={key}
                      className={`${cellClass} font-medium`}
                    >
                      {label(key)}
                    </th>

                    <td className={cellClass}>
                      <Value value={item} depth={depth} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {nested.map(([key, item]) => (
          <section key={key} className="min-w-0">
            <h3
              title={key}
              className="mb-2 break-words text-sm font-semibold text-slate-800"
            >
              {label(key)}
            </h3>

            <Value value={item} depth={depth} />
          </section>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full">
      <tbody>
        <tr>
          <th scope="row" className={cellClass}>
            Valeur
          </th>
          <td className={cellClass}>
            <Value value={value} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function JsonTablePreview({
  document,
  onClose,
}: {
  document: PreviewDocument;
  onClose: () => void;
}) {
  const [result, setResult] =
    useState<{ value: Json } | null>(null);

  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [section, setSection] = useState('');

  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    setResult(null);
    setError('');
    setSection('');

    heading.current?.focus({
      preventScroll: true,
    });

    heading.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    documentResponse(
      document.id,
      'preview',
      controller.signal
    )
      .then(async response => {
        const payload = await response.json();

        if (!controller.signal.aborted) {
          setResult({
            value: payload.data,
          });
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger cet aperçu.'
          );
        }
      });

    return () => controller.abort();
  }, [document.id, retry]);

  const keys =
    result && isObject(result.value)
      ? Object.keys(result.value)
      : [];

  const selected =
    result &&
    section !== '' &&
    isObject(result.value)
      ? result.value[section]
      : result?.value;

  return (
    <section
      aria-label="Aperçu JSON archivé"
      className="mt-6 min-w-0 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            ref={heading}
            tabIndex={-1}
            className="scroll-mt-32 text-xl font-semibold text-slate-900"
          >
            {document.title ||
              document.file_name ||
              'Document JSON'}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Aperçu en tableau · valeurs et unités
            conservées.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setRetry(value => value + 1)}
            className="mt-3 font-semibold underline"
          >
            Réessayer
          </button>
        </div>
      ) : !result ? (
        <p
          role="status"
          className="py-8 text-center text-slate-500"
        >
          Chargement des données…
        </p>
      ) : (
        <>
          {keys.length > 0 && (
            <label className="mb-5 block text-sm font-medium text-slate-700">
              Section
              <select
                value={section}
                onChange={event =>
                  setSection(event.target.value)
                }
                className="ml-3 max-w-full rounded-lg border border-slate-200 p-2"
              >
                <option value="">
                  Toutes les sections
                </option>

                {keys
                  .filter(key => key !== '')
                  .map(key => (
                    <option key={key} value={key}>
                      {label(key)}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <JsonTable
            key={section}
            value={selected as Json}
          />
        </>
      )}
    </section>
  );
}