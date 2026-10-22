import { apiOrigin, getToken } from './auth';

export async function documentResponse(
  id: string | number,
  action: 'download' | 'preview',
  signal?: AbortSignal
) {
  const token = getToken();

  if (!token) {
    throw new Error(
      'Connectez-vous pour accéder au fichier.'
    );
  }

  const response = await fetch(
    `${apiOrigin}/api/documents/${encodeURIComponent(
      String(id)
    )}/${action}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal,
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(
        new Event('docarchive-session-expired')
      );
    }

    const payload = await response
      .json()
      .catch(() => null);

    throw new Error(
      payload?.message ||
        'Fichier indisponible ou accès refusé.'
    );
  }

  return response;
}

export async function downloadDocument(document: {
  id: string | number;
  file_name?: string;
}) {
  const response = await documentResponse(
    document.id,
    'download'
  );

  const url = URL.createObjectURL(
    await response.blob()
  );

  const link = window.document.createElement('a');

  link.href = url;
  link.download = document.file_name || 'document';

  window.document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}