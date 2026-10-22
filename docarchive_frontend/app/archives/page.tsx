'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_DOCUMENTS } from '@/lib/queries';
import { RESTORE_DOCUMENT } from '@/lib/mutations';
import ArchiveList from '@/components/ArchiveList';
import PageState from '@/components/PageState';
import toast from 'react-hot-toast';

export default function ArchivesPage() {
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } =
    useQuery(GET_DOCUMENTS);

  const [restoreDocument] = useMutation(RESTORE_DOCUMENT);

  const handleRestore = async (id: string) => {
    try {
      await restoreDocument({ variables: { id } });
      toast.success('Document restored');
      await refetch();
    } catch {
      toast.error('Could not restore document');
    }
  };

  const allArchives =
    data?.documents?.filter(
      (doc: any) => doc.status === 'archived'
    ) || [];

  const documents = allArchives.filter((doc: any) =>
    `${doc.title || ''} ${doc.reference || ''}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-600">
            Kept for later
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Archives
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Keep your workspace focused. Restore a document
            whenever you need it.
          </p>
        </div>

        <span className="rounded-full border border-amber-100 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
          {allArchives.length} archived
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
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Archived documents
            </h2>

            <input
              aria-label="Search archives"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by title or reference…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
            />
          </div>

          <ArchiveList
            documents={documents}
            onRestore={handleRestore}
            searching={Boolean(search.trim())}
          />
        </>
      )}
    </main>
  );
}