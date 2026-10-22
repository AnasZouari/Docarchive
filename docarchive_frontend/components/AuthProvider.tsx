'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';
import { useApolloClient } from '@apollo/client';
import {
  authRequest,
  clearToken,
  getToken,
  saveToken,
  User,
} from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  acceptSession: (
    token: string,
    user: User
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('AuthProvider is missing');
  }

  return value;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] =
    useState(false);
  const [attempt, setAttempt] = useState(0);

  const pathname = usePathname();
  const isPublicPage = [
    '/login',
    '/forgot-password',
    '/reset-password',
  ].includes(pathname);
  const router = useRouter();
  const client = useApolloClient();

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      setSessionError(false);

      if (!getToken()) {
        if (active) {
          setReady(true);
        }

        return;
      }

      try {
        const account = await authRequest('user');

        if (active) {
          setUser(account);
        }
      } catch (error) {
        if (active) {
          const status = (
            error as Error & { status?: number }
          ).status;

          if (status === 401) {
            clearToken();
          } else {
            setSessionError(true);
          }
        }
      } finally {
        if (active) {
          setReady(true);
        }
      }
    };

    checkSession();

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready || sessionError) return;
  
    if (!user && !isPublicPage) {
      router.replace('/login');
    }
  
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [
    ready,
    user,
    pathname,
    router,
    sessionError,
    isPublicPage,
  ]);
  useEffect(() => {
    const expireSession = () => {
      clearToken();
      setUser(null);
      client.clearStore();
      router.replace('/login');
    };

    window.addEventListener(
      'Archivio-session-expired',
      expireSession
    );

    return () => {
      window.removeEventListener(
        'Archivio-session-expired',
        expireSession
      );
    };
  }, [client, router]);

  const acceptSession = async (
    token: string,
    account: User
  ) => {
    await client.clearStore();

    saveToken(token);
    setUser(account);
    router.replace('/dashboard');
  };

  const logout = async () => {
    try {
      await authRequest('logout', {});
    } finally {
      clearToken();
      setUser(null);

      await client.clearStore();

      router.replace('/login');
    }
  };

  if (sessionError && !isPublicPage) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">
          Could not verify your session
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Check your connection and try again.
        </p>

        <button
          onClick={() => {
            setReady(false);
            setAttempt((value) => value + 1);
          }}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </main>
    );
  }

  if (
    !ready ||
    (!user && !isPublicPage) ||
    (user && pathname === '/login')
  ) {
    return (
      <main
        role="status"
        className="flex min-h-screen items-center justify-center"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

        <span className="sr-only">
          Loading session
        </span>
      </main>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        acceptSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}