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

/** 驗證目前金鑰是否與後端一致。回傳 { ok, status, message }。 */
export async function verifyAdminKey(): Promise<{ ok: boolean; status: number; message: string }> {
  try {
    const res = await adminFetch('/api/admin/inquiries?limit=1');
    if (res.status === 200) {
      return { ok: true, status: 200, message: '金鑰正確，後端已連線' };
    }
    if (res.status === 401) {
      return { ok: false, status: 401, message: '金鑰錯誤，請確認與 Cloudflare Worker 的 ADMIN_API_KEY 完全一致（含大小寫、前後空白）' };
    }
    if (res.status === 501) {
      return { ok: false, status: 501, message: '後端尚未設定 ADMIN_API_KEY。請到 Cloudflare Dashboard → Workers → 你的專案(drserv) → Settings → Environment variables 新增 ADMIN_API_KEY 並重新部署' };
    }
    const text = await res.text();
    return { ok: false, status: res.status, message: text || `伺服器回傳 ${res.status}` };
  } catch (err) {
    return { ok: false, status: 0, message: '無法連線，請檢查網路與後端服務' };
  }
}
