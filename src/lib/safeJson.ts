const API_NOT_AVAILABLE_MSG =
  'API 未回傳 JSON（可能後端未啟動）。請執行 npm run dev:cf 或部署後再試。';

/**
 * 從 Response 安全解析 JSON。若回傳內容為 HTML（例如 SPA  fallback 或錯誤頁），
 * 拋出明確錯誤，避免 "Unexpected token '<', \"<!DOCTYPE\"..." 的 JSON 解析錯誤。
 */
export async function responseJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<')) {
    throw new Error(API_NOT_AVAILABLE_MSG);
  }
  if (!trimmed) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(API_NOT_AVAILABLE_MSG);
  }
}
