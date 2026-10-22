'use client';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import { useAuth } from '@/components/AuthProvider';

import {
  authRequest,
  getRoleLabel,
  hasAdminRole,
  type Center,
  type User,
} from '@/lib/auth';

type Service = {
  id: number;
  name: string;
  center_id: number | null;
};

type Directory = {
  users: User[];
  centers: Center[];
  services: Service[];
};

type AccountRole = 'admin' | 'agent';

const field =
  'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm disabled:bg-slate-100';

const button =
  'rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50';

export default function UsersPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (!hasAdminRole(user)) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">
          Accès refusé
        </h1>

        <p className="mt-3">
          Cette page est réservée aux administrateurs.
        </p>
      </main>
    );
  }

  return (
    <UsersAdmin
      key={`${user.id}-${user.role}-${user.center_id}`}
      actor={user}
    />
  );
}

function UsersAdmin({ actor }: { actor: User }) {
  const isSuperAdmin = actor.role === 'super_admin';

  const [directory, setDirectory] =
    useState<Directory | null>(null);

  const [role, setRole] = useState<AccountRole>('agent');

  const [centerId, setCenterId] = useState(
    isSuperAdmin ? '' : String(actor.center_id ?? '')
  );

  const [serviceId, setServiceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setDirectory(null);

    authRequest('admin/users')
      .then((data: Directory) => {
        if (!active) return;

        setDirectory(data);

        if (!isSuperAdmin) {
          setCenterId(
            String(data.centers[0]?.id ?? '')
          );
        }
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
  }, [attempt, isSuperAdmin]);

  const centers = directory?.centers ?? [];
  const services = directory?.services ?? [];

  const availableServices = services.filter(
    service => String(service.center_id) === centerId
  );

  async function create(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const created: User = await authRequest(
        'admin/users',
        {
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          password: String(data.get('password') ?? ''),
          password_confirmation: String(
            data.get('password_confirmation') ?? ''
          ),
          role: isSuperAdmin ? role : 'agent',
          center_id: centerId ? Number(centerId) : null,
          service_id:
            role === 'agent' && serviceId
              ? Number(serviceId)
              : null,
        }
      );

      setDirectory(previous =>
        previous
          ? {
              ...previous,
              users: [...previous.users, created],
            }
          : previous
      );

      form.reset();
      setRole('agent');
      setServiceId('');

      if (isSuperAdmin) setCenterId('');

      setMessage('Le compte a été créé.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function assign(
    id: number,
    selectedCenter: string,
    selectedService: string,
    accountRole: User['role']
  ) {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const updated: User = await authRequest(
        `admin/users/${id}/service`,
        {
          center_id: Number(selectedCenter),
          service_id:
            accountRole === 'agent'
              ? Number(selectedService)
              : null,
        }
      );

      setDirectory(previous =>
        previous
          ? {
              ...previous,
              users: previous.users.map(account =>
                account.id === id ? updated : account
              ),
            }
          : previous
      );

      setMessage(
        'Affectation enregistrée. Si elle a changé, cet utilisateur devra se reconnecter.'
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-10 sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
          {isSuperAdmin
            ? 'Direction générale'
            : 'Administration du centre'}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Utilisateurs
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          {isSuperAdmin
            ? 'Gérez les administrateurs et les agents des différents centres.'
            : 'Créez les comptes agents et gérez leurs affectations dans votre centre.'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}

          <button
            type="button"
            disabled={busy || loading}
            onClick={() => setAttempt(value => value + 1)}
            className="ml-3 underline disabled:opacity-50"
          >
            Recharger
          </button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className="rounded-xl bg-green-50 p-4 text-green-700"
        >
          {message}
        </p>
      )}

      {loading && <p role="status">Chargement…</p>}

      {!loading && directory && (
        <>
          <form
            onSubmit={create}
            className="rounded-2xl border bg-white p-6"
          >
            <h2 className="mb-5 text-lg font-semibold">
              Créer un compte
            </h2>

            <fieldset
              disabled={busy}
              className="grid gap-4 md:grid-cols-2"
            >
              <label className="text-sm font-medium">
                Nom complet
                <input
                  name="name"
                  required
                  maxLength={100}
                  className={field}
                />
              </label>

              <label className="text-sm font-medium">
                Adresse e-mail
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  className={field}
                />
              </label>

              <label className="text-sm font-medium">
                Mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={field}
                />
              </label>

              <label className="text-sm font-medium">
                Confirmer le mot de passe
                <input
                  name="password_confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className={field}
                />
              </label>

              <label className="text-sm font-medium">
                Rôle
                <select
                  value={role}
                  disabled={!isSuperAdmin}
                  onChange={event => {
                    setRole(
                      event.target.value as AccountRole
                    );
                    setServiceId('');
                  }}
                  className={field}
                >
                  <option value="agent">Agent</option>

                  {isSuperAdmin && (
                    <option value="admin">
                      Administrateur de centre
                    </option>
                  )}
                </select>
              </label>

              <label className="text-sm font-medium">
                Centre
                <select
                  value={centerId}
                  required
                  disabled={!isSuperAdmin}
                  onChange={event => {
                    setCenterId(event.target.value);
                    setServiceId('');
                  }}
                  className={field}
                >
                  <option value="">
                    Choisir un centre
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

              {role === 'agent' && (
                <label className="text-sm font-medium md:col-span-2">
                  Service
                  <select
                    value={serviceId}
                    required
                    disabled={!centerId}
                    onChange={event =>
                      setServiceId(event.target.value)
                    }
                    className={field}
                  >
                    <option value="">
                      Choisir un service
                    </option>

                    {availableServices.map(service => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {role === 'agent' &&
                centerId &&
                availableServices.length === 0 && (
                  <p className="text-sm text-amber-700 md:col-span-2">
                    Aucun service n’est encore rattaché à
                    ce centre. Il faut effectuer cette
                    affectation avant de créer un agent.
                  </p>
                )}

              <button
                type="submit"
                disabled={
                  busy ||
                  !centerId ||
                  (role === 'agent' && !serviceId)
                }
                className={`${button} md:col-span-2`}
              >
                {busy
                  ? 'Enregistrement…'
                  : 'Créer le compte'}
              </button>
            </fieldset>
          </form>

          <section className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full text-left text-sm">
              <caption className="p-4 text-left font-semibold">
                {directory.users.length} compte(s)
              </caption>

              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4">
                    Centre et service
                  </th>
                </tr>
              </thead>

              <tbody>
                {directory.users.map(account => (
                  <tr
                    key={account.id}
                    className="border-t align-top"
                  >
                    <td className="p-4">
                      <p className="font-semibold">
                        {account.name}
                      </p>

                      <p className="text-slate-500">
                        {account.email}
                      </p>
                    </td>

                    <td className="p-4">
                      {getRoleLabel(account.role)}
                    </td>

                    <td className="min-w-64 p-4">
                      {account.role === 'super_admin' ? (
                        <p className="text-slate-500">
                          {account.center?.name ??
                            'Direction générale'}
                          {' — '}Tous les centres
                        </p>
                      ) : (
                        <AssignmentForm
                          key={`${account.id}-${account.center_id}-${account.service_id}`}
                          account={account}
                          centers={centers}
                          services={services}
                          canChooseCenter={isSuperAdmin}
                          busy={busy}
                          onSave={assign}
                        />
                      )}
                    </td>
                  </tr>
                ))}

                {directory.users.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-6 text-center text-slate-500"
                    >
                      Aucun utilisateur à afficher.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function AssignmentForm({
  account,
  centers,
  services,
  canChooseCenter,
  busy,
  onSave,
}: {
  account: User;
  centers: Center[];
  services: Service[];
  canChooseCenter: boolean;
  busy: boolean;
  onSave: (
    id: number,
    center: string,
    service: string,
    role: User['role']
  ) => Promise<void>;
}) {
  const [centerId, setCenterId] = useState(
    String(account.center_id ?? '')
  );

  const [serviceId, setServiceId] = useState(
    String(account.service_id ?? '')
  );

  const availableServices = services.filter(
    service => String(service.center_id) === centerId
  );

  const validService =
    account.role !== 'agent' ||
    availableServices.some(
      service => String(service.id) === serviceId
    );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void onSave(
      account.id,
      centerId,
      serviceId,
      account.role
    );
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="space-y-3">
        <label className="block text-xs text-slate-500">
          Centre
          <select
            aria-label={`Centre de ${account.name}`}
            value={centerId}
            required
            disabled={!canChooseCenter}
            onChange={event => {
              setCenterId(event.target.value);
              setServiceId('');
            }}
            className={field}
          >
            <option value="">Non affecté</option>

            {centers.map(center => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </label>

        {account.role === 'agent' && (
          <label className="block text-xs text-slate-500">
            Service
            <select
              aria-label={`Service de ${account.name}`}
              value={serviceId}
              required
              disabled={!centerId}
              onChange={event =>
                setServiceId(event.target.value)
              }
              className={field}
            >
              <option value="">Non affecté</option>

              {availableServices.map(service => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {service.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="submit"
          disabled={busy || !centerId || !validService}
          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Enregistrer l’affectation
        </button>
      </fieldset>
    </form>
  );
}