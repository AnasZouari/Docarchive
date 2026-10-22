'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from './AuthProvider';
import { hasAdminRole } from '@/lib/auth';
import { downloadDocument } from '@/lib/document-files';

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR');
}

function formatSize(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) return '0 octet';

  const units = ['octets', 'Ko', 'Mo', 'Go', 'To'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

export default function DocumentList({
  documents = [],
  onArchive,
  onDelete,
  searching = false,
}) {
  const { user } = useAuth();
  const isAdmin = hasAdminRole(user);

  const [downloading, setDownloading] = useState(null);
  const [pending, setPending] = useState(null);

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

  async function perform(document, action) {
    const message =
      action === 'archive'
        ? 'Archiver ce document ?'
        : 'Supprimer définitivement le fichier de ce document ? Cette action est irréversible.';

    if (!window.confirm(message)) return;

    setPending(document.id);

    try {
      if (action === 'archive') {
        await onArchive(document.id);
      } else {
        await onDelete(document.id);
      }
    } catch (error) {
      toast.error(error.message || 'Opération impossible.');
    } finally {
      setPending(null);
    }
  }

  if (!documents?.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-lg font-medium text-slate-600">
          {searching
            ? 'Aucun document correspondant'
            : 'Aucun document pour le moment'}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {searching
            ? 'Essayez un autre titre ou une autre référence.'
            : 'Ajoutez votre premier document avec le formulaire.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="border-b p-5 text-left font-semibold">
          {documents.length} document(s)
        </caption>

        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="p-4">Document</th>
            <th className="p-4">Classement</th>
            <th className="p-4">Format</th>
            <th className="p-4">Taille</th>
            <th className="p-4">Ajouté le</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {documents.map(document => (
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
                <p className="mt-1 break-all text-xs text-slate-400">
                  {document.file_name}
                </p>

                {document.description && (
                  <details className="mt-3 max-w-sm text-xs text-slate-500">
                    <summary className="cursor-pointer">
                      Description
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap break-words">
                      {document.description}
                    </p>
                  </details>
                )}
              </td>

              <td className="p-4 text-xs text-slate-500">
                <p>{document.service?.name || 'Sans service'}</p>
                <p className="mt-1">
                  {document.category?.name || 'Sans catégorie'}
                </p>

                {document.folder && (
                  <p className="mt-1 text-blue-700">
                    Dossier : {document.folder.name}
                  </p>
                )}

                {document.product && (
                  <p className="mt-1">
                    Produit : {document.product}
                  </p>
                )}

                {document.document_date && (
                  <p className="mt-1">
                    Date du document : {formatDate(document.document_date)}
                  </p>
                )}
              </td>

              <td className="p-4">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                  {document.type}
                </span>
              </td>

              <td className="whitespace-nowrap p-4 text-slate-500">
                {formatSize(document.file_size)}
              </td>

              <td className="whitespace-nowrap p-4 text-slate-500">
                {formatDate(document.created_at)}
              </td>

              <td className="p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={downloading !== null}
                    onClick={() => download(document)}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 disabled:opacity-50"
                  >
                    {downloading === document.id
                      ? 'Téléchargement…'
                      : 'Télécharger'}
                  </button>

                  {document.status === 'active' && onArchive && (
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => perform(document, 'archive')}
                      className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 disabled:opacity-50"
                    >
                      Archiver
                    </button>
                  )}

                  {isAdmin && onDelete && (
                    <button
                      type="button"
                      disabled={pending !== null}
                      onClick={() => perform(document, 'delete')}
                      className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}