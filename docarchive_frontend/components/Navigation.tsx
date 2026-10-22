'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from './AuthProvider';
import {
  getRoleLabel,
  hasAdminRole,
} from '@/lib/auth';

const baseLinks = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: '◫',
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: '▤',
  },
  {
    href: '/dossiers',
    label: 'Dossiers',
    icon: '▱',
  },
  {
    href: '/archives',
    label: 'Archives',
    icon: '▣',
  },
];

export default function Navigation({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const canManageUsers = hasAdminRole(user);

  const links = canManageUsers
  ? [
      ...baseLinks,
      {
        href: '/utilisateurs',
        label: 'Utilisateurs',
        icon: '♙',
      },
      {
        href: '/historique',
        label: 'Historique',
        icon: '◷',
      },
    ]
    : baseLinks;

  const active = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === '/dashboard' && pathname === '/');

  const title =
    links.find((link) => active(link.href))?.label ||
    'Espace de travail';

  const initial =
    user?.name?.trim().charAt(0).toUpperCase() || 'U';

  const roleLabel = getRoleLabel(user?.role);

  const centerLabel = isSuperAdmin
    ? 'Direction générale'
    : user?.center?.name;

  const handleLogout = async () => {
    if (leaving) return;

    setLeaving(true);

    try {
      await logout();
    } catch {
      toast.error(
        'Déconnexion locale effectuée. Le serveur est injoignable.'
      );
    } finally {
      setLeaving(false);
    }
  };

  if (
    ['/login', '/forgot-password', '/reset-password']
      .includes(pathname)
  ) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 lg:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2 py-3 text-xl font-bold tracking-tight"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm text-white">
            AR
          </span>

          Archivio
        </Link>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold text-slate-700">
            {roleLabel}
          </p>

          {centerLabel && (
            <p className="mt-1 text-xs text-slate-500">
              {centerLabel}
            </p>
          )}
        </div>

        <p className="mb-3 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Espace de travail
        </p>

        <nav
          aria-label="Navigation principale"
          className="space-y-2"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                active(link.href) ? 'page' : undefined
              }
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span
                aria-hidden="true"
                className="text-lg"
              >
                {link.icon}
              </span>

              {link.label}

              {active(link.href) && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <div className="mb-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Vos documents, bien organisés.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Classez vos documents par service et
              dossier, puis retrouvez vos archives.
            </p>

            <Link
              href="/documents"
              className="mt-3 inline-block text-xs font-semibold text-blue-700"
            >
              Consulter les documents →
            </Link>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {initial}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name}
              </p>

              <p className="truncate text-xs text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={leaving}
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            {leaving
              ? 'Déconnexion…'
              : 'Se déconnecter'}
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="text-sm">
              <Link
                href="/dashboard"
                className="font-bold text-blue-600 lg:hidden"
              >
                Archivio
              </Link>

              <p className="hidden text-slate-400 lg:block">
                Espace de travail

                <span className="mx-3 text-slate-300">
                  /
                </span>

                <span className="font-medium text-slate-800">
                  {title}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`hidden rounded-full px-3 py-1 text-xs font-medium md:inline-flex ${
                  isSuperAdmin
                    ? 'bg-purple-50 text-purple-700'
                    : canManageUsers
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {roleLabel}
              </span>

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                {initial}
              </span>

              <span className="hidden max-w-40 truncate text-xs font-medium text-slate-600 sm:block">
                {user?.name}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={leaving}
                className="text-xs font-medium text-slate-500 disabled:opacity-50 lg:hidden"
              >
                {leaving
                  ? 'Déconnexion…'
                  : 'Se déconnecter'}
              </button>
            </div>
          </div>

          <nav
            aria-label="Navigation mobile"
            className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  active(link.href) ? 'page' : undefined
                }
                className={`shrink-0 rounded-lg px-3 py-2 text-center text-xs font-medium ${
                  active(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}