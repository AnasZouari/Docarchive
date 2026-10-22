'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';

import { GET_DOCUMENTS } from '@/lib/queries';
import {
  ARCHIVE_DOCUMENT,
  DELETE_DOCUMENT,
} from '@/lib/mutations';

import DocumentList from '@/components/DocumentList';
import UploadForm from '@/components/UploadForm';
import PageState from '@/components/PageState';

export default function DocumentsPage() {
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } =
    useQuery(GET_DOCUMENTS);

  const [archiveDocument] = useMutation(ARCHIVE_DOCUMENT);
  const [deleteDocument] = useMutation(DELETE_DOCUMENT);

  async function handleArchive(id: string) {
    try {
      await archiveDocument({
        variables: { id },
      });

      toast.success('Document archivé.');
      await refetch();
    } catch (err) {
      toast.error(
        'Archivage impossible : ' + (err as Error).message
      );
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument({
        variables: { id },
      });

      toast.success('Document supprimé.');
      await refetch();
    } catch (err) {
      toast.error(
        'Suppression impossible : ' + (err as Error).message
      );
    }
  }

  const allDocuments =
    data?.documents?.filter(
      (doc: any) => doc.status === 'active'
    ) || [];

  const documents = allDocuments.filter((doc: any) => {
    const searchable = [
      doc.title,
      doc.reference,
      doc.service?.name,
      doc.category?.name,
      doc.folder?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(
      search.trim().toLowerCase()
    );
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Archivio · Bibliothèque
          </p>

          <h1 className="text-3xl font-bold text-slate-900">
            Documents
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Ajoute et organise les documents de ton espace.
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          {allDocuments.length} document(s) actif(s)
        </span>
      </div>

      {loading ? (
        <PageState loading />
      ) : error ? (
        <PageState
          message={error.message}
          retry={() => refetch()}
        />
      ) : (
        <>
          <UploadForm onUpload={() => refetch()} />

          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold">
                Bibliothèque documentaire
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {documents.length} sur {allDocuments.length}
              </p>
            </div>

            <input
              aria-label="Rechercher un document"
              type="search"
              placeholder="Titre, référence, service, catégorie ou dossier…"
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 sm:max-w-md"
            />
          </div>

          <DocumentList
            documents={documents}
            onArchive={handleArchive}
            onDelete={handleDelete}
            searching={Boolean(search.trim())}
          />
        </>
      )}
    </main>
  );
}