'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from './AuthProvider';
import JsonTablePreview from './JsonTablePreview';
import { hasAdminRole } from '@/lib/auth';
import { downloadDocument } from '@/lib/document-files';

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR');
}

function latestArchive(document) {
  return [...(document.archives ?? [])].sort(
    (a, b) => Number(b.id) - Number(a.id)
  )[0];
}

export default function ArchiveList({
  documents = [],
  onRestore,
  searching = false,
}) {
  const { user } = useAuth();
  const isAdmin = hasAdminRole(user);

  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [restoring, setRestoring] = useState(null);

  const trigger = useRef(null);

  const previewDocument = documents?.find(
    document => document.id === selected
  );

  function closePreview() {
    setSelected(null);
    trigger.current?.focus();
  }

  async function download(document) {
    setDownloading(document.id);

    try {
      await downloadDocument(document);
    } catch (error) {
      toast.error(error.message || 'Téléchargement impossible.');
    } finally {
      setDownloading(null);
    }
  }

  async function restore(document) {
    if (!window.confirm('Restaurer ce document dans les documents actifs ?')) {
      return;
    }

    setRestoring(document.id);

    try {
      await onRestore(document.id);

      if (selected === document.id) {
        setSelected(null);
      }
    } catch (error) {
      toast.error(error.message || 'Restauration impossible.');
    } finally {
      setRestoring(null);
    }
  }

  if (!documents?.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-lg font-medium text-slate-600">
          {searching
            ? 'Aucune archive correspondante'
            : 'Aucun document archivé'}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {searching
            ? 'Essayez un autre titre ou une autre référence.'
            : 'Les documents archivés apparaîtront ici.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <caption className="border-b p-5 text-left font-semibold">
            {documents.length} archive(s)
          </caption>

          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-4">Document</th>
              <th className="p-4">Service</th>
              <th className="p-4">Format</th>
              <th className="p-4">Archivé le</th>
              <th className="p-4">Motif</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {documents.map(document => {
              const archive = latestArchive(document);

              const isJson = /\.json$/i.test(
                document.file_name || document.file_path || ''
              );

              return (
                <tr
                  key={document.id}
                  className="border-t align-top hover:bg-slate-50"
                >
                  <td className="p-4">
                    <p className="font-semibold">
                      {document.title || 'Sans titre'}
                    </p>
                    <p className="mt-1 text-xs text-blue-700">
                      {document.reference}
                    </p>
                    {document.folder && (
                      <p className="mt-1 text-xs text-slate-500">
                        Dossier : {document.folder.name}
                      </p>
                    )}
                  </td>

                  <td className="p-4 text-slate-500">
                    {document.service?.name || 'Sans service'}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                      {document.type}
                    </span>
                  </td>

                  <td className="whitespace-nowrap p-4 text-slate-500">
                    {formatDate(archive?.archive_date)}
                  </td>

                  <td className="max-w-xs whitespace-pre-wrap break-words p-4 text-slate-500">
                    {archive?.reason || 'Non renseigné'}
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={downloading !== null}
                        onClick={() => download(document)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {downloading === document.id
                          ? 'Téléchargement…'
                          : 'Télécharger'}
                      </button>

                      {isJson && (
                        <button
                          type="button"
                          aria-expanded={selected === document.id}
                          onClick={event => {
                            trigger.current = event.currentTarget;
                            setSelected(document.id);
                          }}
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                        >
                          Voir en tableau
                        </button>
                      )}

                      {isAdmin && onRestore && (
                        <button
                          type="button"
                          disabled={restoring !== null}
                          onClick={() => restore(document)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 disabled:opacity-50"
                        >
                          {restoring === document.id
                            ? 'Restauration…'
                            : 'Restaurer'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewDocument && (
        <JsonTablePreview
          key={previewDocument.id}
          document={previewDocument}
          onClose={closePreview}
        />
      )}
    </>
  );
}