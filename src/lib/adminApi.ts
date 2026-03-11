const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY ?? '';

function getAdminHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (ADMIN_API_KEY) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${ADMIN_API_KEY}`;
  }
  return headers;
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: { ...getAdminHeaders(), ...init?.headers },
  });
}

export function hasAdminKey(): boolean {
  return Boolean(ADMIN_API_KEY);
}
