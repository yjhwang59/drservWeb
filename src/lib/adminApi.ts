const STORAGE_KEY = 'admin_api_key';

function getStoredKey(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) ?? '';
}

function getAdminKey(): string {
  return getStoredKey() || import.meta.env.VITE_ADMIN_API_KEY || '';
}

function getAdminHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const key = getAdminKey();
  if (key) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${key}`;
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
  return Boolean(getAdminKey());
}

/** 設定後台 API 金鑰（存於 sessionStorage），請與後端 ADMIN_API_KEY 相同。設定後請重新整理頁面。 */
export function setAdminApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearAdminApiKey(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
