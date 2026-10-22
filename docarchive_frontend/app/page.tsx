'use client';

import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useAuth } from '@/components/AuthProvider';
import {
  GET_DOCUMENTS,
  GET_DOCUMENT_STATS,
} from '@/lib/queries';
import StatsCards from '@/components/StatsCards';
import PageState from '@/components/PageState';

interface RecentDocument {
  id: string;
  title: string;
  reference: string;
  type: string;
  status: string;
}

const shortcuts = [
  {
    href: '/documents#upload',
    title: 'Upload a document',
    hint: 'Add something new',
    icon: '↑',
  },
  {
    href: '/documents',
    title: 'Browse the library',
    hint: 'Find a title or reference',
    icon: '▤',
  },
  {
    href: '/archives',
    title: 'Open archives',
    hint: 'Find and restore older files',
    icon: '▣',
  },
];

export default function Home() {
  const { user } = useAuth();

  const stats = useQuery(GET_DOCUMENT_STATS);
  const library = useQuery(GET_DOCUMENTS);

  const recent: RecentDocument[] =
    library.data?.documents?.slice(0, 5) || [];

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || 'there';

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Your workspace at a glance
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}.
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            A little organization goes a long way.
          </p>
        </div>

        <Link
          href="/documents#upload"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span aria-hidden="true">＋</span>
          Add document
        </Link>
      </div>

      <section aria-label="Document statistics">
        {stats.error ? (
          <PageState
            message={stats.error.message}
            retry={() => stats.refetch()}
          />
        ) : (
          <StatsCards
            stats={stats.data?.documentStats}
            loading={stats.loading}
          />
        )}
      </section>

      <section className="my-7 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-slate-900 px-6 py-6 text-white sm:px-8">
        <div>
          <p className="text-lg font-semibold tracking-tight">
            Less clutter. More clarity.
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-300">
            Keep your current work within reach.
            Archive the rest.
          </p>
        </div>

        <Link
          href="/archives"
          className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold transition hover:bg-white/10"
        >
          Explore archives →
        </Link>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-slate-900">
                Recent documents
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                The latest additions to your library
              </p>
            </div>

            <Link
              href="/documents"
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              View all →
            </Link>
          </div>

          {library.loading ? (
            <div
              role="status"
              className="space-y-4 p-6"
            >
              <span className="sr-only">
                Loading recent documents
              </span>

              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 animate-pulse rounded-xl bg-slate-50"
                />
              ))}
            </div>
          ) : library.error ? (
            <PageState
              message={library.error.message}
              retry={() => library.refetch()}
            />
          ) : recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">
                  Five most recently added documents
                </caption>

                <thead>
                  <tr className="bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400">
                    <th
                      scope="col"
                      className="px-6 py-3 font-semibold"
                    >
                      Document
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3 font-semibold"
                    >
                      Type
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 font-semibold"
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recent.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="max-w-xs break-words text-sm font-medium text-slate-800">
                          {doc.title}
                        </p>

                        <p className="mt-1 font-mono text-[11px] text-slate-400">
                          {doc.reference}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          {doc.type}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            doc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <span
                aria-hidden="true"
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600"
              >
                ▤
              </span>

              <h3 className="mt-4 text-sm font-semibold">
                Your first document starts here
              </h3>

              <p className="mt-2 text-xs leading-6 text-slate-500">
                Add a file to start building your
                organized library.
              </p>

              <Link
                href="/documents#upload"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Add a document
              </Link>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-3 text-[11px] text-slate-400">
            Shared document library
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">
              Quick access
            </h2>

            <div className="mt-4 space-y-2">
              {shortcuts.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-blue-50"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-blue-600 group-hover:bg-white"
                  >
                    {item.icon}
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {item.title}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {item.hint}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-600">
              A useful habit
            </p>

            <h2 className="mt-3 text-sm font-semibold text-slate-800">
              Give files a clear title.
            </h2>

            <p className="mt-2 text-xs leading-6 text-slate-500">
              Include the subject and year, such as
              “Annual report 2026”, to find documents
              more easily later.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}