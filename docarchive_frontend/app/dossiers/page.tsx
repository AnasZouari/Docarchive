'use client';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import Link from 'next/link';
import { gql, useMutation, useQuery } from '@apollo/client';
import toast from 'react-hot-toast';

import { useAuth } from '@/components/AuthProvider';
import PageState from '@/components/PageState';

import {
  authRequest,
  hasAdminRole,
  type Center,
} from '@/lib/auth';

import { GET_CLASSIFICATION } from '@/lib/queries';
import {
  CREATE_CATEGORY,
  CREATE_FOLDER,
} from '@/lib/mutations';

const CREATE_SERVICE_WITH_CENTER = gql`
  mutation CreateServiceWithCenter(
    $name: String!
    $center_id: ID
  ) {
    createService(name: $name, center_id: $center_id) {
      id
      name
    }
  }
`;

type Item = {
  id: string;
  name: string;
};

type Folder = Item & {
  service: Item;
  documents: {
    id: string;
    title: string;
    reference: string;
    status: string;
  }[];
};

type Kind = 'folder' | 'service' | 'category';

const field =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm';

export default function DossiersPage() {
  const { user } = useAuth();

  const isAdmin = hasAdminRole(user);
  const isSuperAdmin = user?.role === 'super_admin';

  const { data, loading, error, refetch } =
    useQuery(GET_CLASSIFICATION, {
      fetchPolicy: 'cache-and-network',
    });

  const [kind, setKind] = useState<Kind>('folder');
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [centerId, setCenterId] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState('');
  const [pending, setPending] = useState(false);

  const [centers, setCenters] = useState<Center[]>([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const [centersError, setCentersError] = useState('');
  const [centersAttempt, setCentersAttempt] = useState(0);

  const [createService] =
    useMutation(CREATE_SERVICE_WITH_CENTER);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [createFolder] = useMutation(CREATE_FOLDER);

  useEffect(() => {
    if (!isSuperAdmin || kind !== 'service') return;

    let active = true;

    setCentersLoading(true);
    setCentersError('');

    authRequest('admin/users')
      .then((response: { centers: Center[] }) => {
        if (active) setCenters(response.centers);
      })
      .catch((err: Error) => {
        if (active) setCentersError(err.message);
      })
      .finally(() => {
        if (active) setCentersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isSuperAdmin, kind, centersAttempt, user?.id]);

  const services: Item[] = data?.services ?? [];
  const categories: Item[] = data?.categories ?? [];
  const folders: Folder[] = data?.folders ?? [];

  const shown = folders.filter(folder => {
    const matchesService =
      !filter || String(folder.service.id) === filter;

    const matchesName = folder.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return matchesService && matchesName;
  });

  const current = folders.find(
    folder => String(folder.id) === selected
  );

  const cannotSubmit =
    pending ||
    !name.trim() ||
    (kind === 'folder' && !serviceId) ||
    (kind === 'category' && !isSuperAdmin) ||
    (
      kind === 'service' &&
      isSuperAdmin &&
      (!centerId || centersLoading || Boolean(centersError))
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAdmin || cannotSubmit) return;

    setPending(true);

    try {
      if (kind === 'category') {
        if (!isSuperAdmin) {
          toast.error('Action réservée au super administrateur.');
          return;
        }

        await createCategory({
          variables: { name: name.trim() },
        });
      } else if (kind === 'service') {
        await createService({
          variables: {
            name: name.trim(),
            center_id: isSuperAdmin ? centerId : null,
          },
        });
      } else {
        await createFolder({
          variables: {
            name: name.trim(),
            service_id: serviceId,
          },
        });
      }

      setName('');
      toast.success('Élément créé.');

      try {
        await refetch();
      } catch {
        toast.error(
          'Création réussie, mais la liste n’a pas pu être actualisée.'
        );
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (loading && !data) return <PageState loading />;

  if (error) {
    return (
      <PageState
        message={error.message}
        retry={() => refetch()}
      />
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          Archivio · Classement
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Dossiers et classement
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Organisez les documents par service, catégorie et dossier.
        </p>
      </div>

      {isAdmin && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-semibold">
            Créer un élément de classement
          </h2>

          <form onSubmit={submit}>
            <fieldset
              disabled={pending}
              className="grid gap-4 md:grid-cols-2"
            >
              <label className="text-sm font-medium">
                Élément
                <select
                  className={field}
                  value={kind}
                  onChange={event =>
                    setKind(event.target.value as Kind)
                  }
                >
                  <option value="folder">Dossier</option>
                  <option value="service">Service</option>

                  {isSuperAdmin && (
                    <option value="category">
                      Catégorie documentaire
                    </option>
                  )}
                </select>
              </label>

              <label className="text-sm font-medium">
                Nom
                <input
                  required
                  maxLength={150}
                  value={name}
                  onChange={event => setName(event.target.value)}
                  className={field}
                />
              </label>

              {kind === 'service' && isSuperAdmin && (
                <div>
                  <label className="text-sm font-medium">
                    Centre du service
                    <select
                      value={centerId}
                      required
                      disabled={
                        centersLoading || Boolean(centersError)
                      }
                      onChange={event =>
                        setCenterId(event.target.value)
                      }
                      className={field}
                    >
                      <option value="">
                        {centersLoading
                          ? 'Chargement…'
                          : 'Choisir un centre'}
                      </option>

                      {centers.map(center => (
                        <option
                          key={center.id}
                          value={center.id}
                        >
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {centersError && (
                    <p role="alert" className="mt-2 text-sm text-red-700">
                      {centersError}
                      <button
                        type="button"
                        onClick={() =>
                          setCentersAttempt(value => value + 1)
                        }
                        className="ml-2 underline"
                      >
                        Réessayer
                      </button>
                    </p>
                  )}
                </div>
              )}

              {kind === 'service' && !isSuperAdmin && (
                <p className="text-sm text-slate-500 md:col-span-2">
                  Le service sera créé dans votre centre.
                </p>
              )}

              {kind === 'folder' && (
                <label className="text-sm font-medium">
                  Service du dossier
                  <select
                    required
                    value={serviceId}
                    onChange={event =>
                      setServiceId(event.target.value)
                    }
                    className={field}
                  >
                    <option value="">Choisir un service</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>

                  {!services.length && (
                    <span className="mt-2 block text-amber-700">
                      Aucun service disponible dans votre périmètre.
                    </span>
                  )}
                </label>
              )}

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={cannotSubmit}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {pending ? 'Création…' : 'Créer'}
                </button>
              </div>
            </fieldset>
          </form>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-3 font-semibold">
            Services accessibles
          </h2>
          <div className="flex flex-wrap gap-2">
            {services.map(service => (
              <span
                key={service.id}
                className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
              >
                {service.name}
              </span>
            ))}
            {!services.length && (
              <p className="text-sm text-slate-500">
                Aucun service accessible.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-3 font-semibold">
            Catégories communes
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <span
                key={category.id}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm"
              >
                {category.name}
              </span>
            ))}
            {!categories.length && (
              <p className="text-sm text-slate-500">
                Aucune catégorie.
              </p>
            )}
          </div>
        </section>
      </div>

      <section>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <input
            aria-label="Rechercher un dossier"
            placeholder="Rechercher un dossier…"
            value={search}
            onChange={event => setSearch(event.target.value)}
            className={field}
          />

          <select
            aria-label="Filtrer par service"
            value={filter}
            onChange={event => setFilter(event.target.value)}
            className={field}
          >
            <option value="">Tous les services accessibles</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map(folder => (
            <button
              type="button"
              key={folder.id}
              aria-pressed={selected === String(folder.id)}
              onClick={() => setSelected(String(folder.id))}
              className={`rounded-2xl border bg-white p-5 text-left hover:border-blue-400 ${
                selected === String(folder.id)
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-slate-200'
              }`}
            >
              <span className="text-xs text-blue-700">
                {folder.service.name}
              </span>

              <h2 className="mt-2 break-words font-semibold">
                {folder.name}
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                {folder.documents.length} document(s)
                {' · '}
                {folder.documents.filter(
                  document => document.status === 'archived'
                ).length} archivé(s)
              </p>
            </button>
          ))}
        </div>

        {!shown.length && (
          <p className="rounded-xl border border-dashed p-8 text-center text-slate-500">
            Aucun dossier correspondant.
          </p>
        )}
      </section>

      {current && (
        <section className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {current.name}
          </h2>

          {current.documents.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="p-3">Référence</th>
                    <th className="p-3">Titre</th>
                    <th className="p-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {current.documents.map(document => (
                    <tr key={document.id} className="border-t">
                      <td className="p-3">{document.reference}</td>
                      <td className="p-3">{document.title}</td>
                      <td className="p-3">
                        {document.status === 'archived'
                          ? 'Archivé'
                          : 'Actif'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Ce dossier ne contient pas encore de documents.
            </p>
          )}

          <Link
            href="/documents"
            className="mt-5 inline-block text-sm text-blue-700 underline"
          >
            Ajouter un document
          </Link>
        </section>
      )}
    </main>
  );
}