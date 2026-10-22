import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
  createHttpLink,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { print } from 'graphql';
import { getToken } from './auth';

const uri =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  'http://127.0.0.1:8000/graphql';

const authLink = new ApolloLink(
  (operation, forward) => {
    const token = getToken();

    operation.setContext(
      ({ headers = {} }) => ({
        headers: {
          ...headers,
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
        },
      })
    );

    return forward(operation);
  }
);

const errorLink = onError(
  ({ graphQLErrors, networkError }) => {
    const authenticationError =
      graphQLErrors?.some(
        (error) =>
          error.extensions?.category ===
          'authentication'
      );

    const unauthorizedResponse =
      networkError &&
      'statusCode' in networkError &&
      networkError.statusCode === 401;

    if (
      typeof window !== 'undefined' &&
      (authenticationError || unauthorizedResponse)
    ) {
      window.dispatchEvent(
        new Event('Archivio-session-expired')
      );
    }
  }
);

const uploadLink = new ApolloLink(
  (operation, forward) => {
    const files: {
      path: string;
      file: File;
    }[] = [];

    const variables = Object.fromEntries(
      Object.entries(operation.variables).map(
        ([key, value]) => {
          if (
            typeof File !== 'undefined' &&
            value instanceof File
          ) {
            files.push({
              path: `variables.${key}`,
              file: value,
            });

            return [key, null];
          }

          return [key, value];
        }
      )
    );

    if (files.length === 0) {
      return forward(operation);
    }

    return new Observable((observer) => {
      const controller = new AbortController();
      const body = new FormData();

      body.append(
        'operations',
        JSON.stringify({
          query: print(operation.query),
          variables,
          operationName: operation.operationName,
        })
      );

      body.append(
        'map',
        JSON.stringify(
          Object.fromEntries(
            files.map(({ path }, index) => [
              index,
              [path],
            ])
          )
        )
      );

      files.forEach(({ file }, index) => {
        body.append(String(index), file);
      });

      fetch(uri, {
        method: 'POST',
        headers: operation.getContext().headers,
        body,
        signal: controller.signal,
      })
        .then(async (response) => {
          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              `Upload failed (${response.status})`
            );
          }

          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          if (!controller.signal.aborted) {
            observer.error(error);
          }
        });

      return () => {
        controller.abort();
      };
    });
  }
);

const httpLink = createHttpLink({
  uri,
  credentials: 'omit',
});

export const client = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    authLink,
    uploadLink,
    httpLink,
  ]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});