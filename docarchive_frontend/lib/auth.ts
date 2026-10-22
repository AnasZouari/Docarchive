export type UserRole = 'super_admin' | 'admin' | 'agent';

export interface Center {
  id: number;
  code: string;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;

  // Facultatifs pendant la transition :
  // le backend ne renvoie pas encore toutes ces relations.
  center_id?: number | null;
  center?: Center | null;

  service_id: number | null;
  service: {
    id: number;
    name: string;
    center_id?: number | null;
  } | null;
}

export function hasAdminRole(
  user: Pick<User, 'role'> | null | undefined
): boolean {
  return (
    user?.role === 'super_admin' ||
    user?.role === 'admin'
  );
}

export function getRoleLabel(
  role: UserRole | undefined
): string {
  switch (role) {
    case 'super_admin':
      return 'Super administrateur';

    case 'admin':
      return 'Administrateur de centre';

    case 'agent':
      return 'Agent';

    default:
      return 'Utilisateur';
  }
}

const key = 'docarchive-token';

export const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
    'http://127.0.0.1:8000/graphql'
).origin;

export const getToken = () =>
  typeof window === 'undefined'
    ? null
    : sessionStorage.getItem(key);

export const saveToken = (token: string) =>
  sessionStorage.setItem(key, token);

export const clearToken = () =>
  sessionStorage.removeItem(key);

export async function authRequest(
  path: string,
  body?: object
) {
  const token = getToken();

  const response = await fetch(
    `${apiOrigin}/api/${path}`,
    {
      method: body === undefined ? 'GET' : 'POST',

      cache: 'no-store',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',

        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },

      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {}),
    }
  );

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    const firstError = Object.values(
      data?.errors || {}
    ).flat()[0] as string | undefined;

    const error = new Error(
      firstError ||
        data?.message ||
        `La requête a échoué (${response.status}).`
    ) as Error & { status: number };

    error.status = response.status;

    throw error;
  }

  return data;
}