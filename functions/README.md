# Cloudflare Pages Functions（遺留程式碼）

本目錄為 **Cloudflare Pages Functions** 格式的 API 程式碼，目前**未在正式部署中使用**。

## 現況說明

- 本專案採用 **Cloudflare Worker** 模式部署（入口點為根目錄的 `worker.ts`）。
- Worker 模式下，`wrangler deploy` 會完全忽略此 `functions/` 目錄。
- 實際生效的 API 邏輯位於 **`worker.ts`**（表單提交、選單、洽詢類型、後台 CRUD 等）。

## 目錄用途

| 檔案 | 說明 |
|------|------|
| `api/_middleware.ts` | CORS 中介層（Pages 模式用） |
| `api/health.ts` | `GET /api/health` — 健康檢查 |
| `api/inquiry.ts` | `POST /api/inquiry` — 表單提交（D1 + Resend） |
| `types.ts` | `Env` 介面定義 |

## 為何保留

- 若未來改為 **Pages** 部署（`wrangler pages deploy`），可享有 PR 預覽、一鍵回滾等能力，此目錄的程式碼可作為遷移起點。
- 可作為 Worker 與 Pages Functions 行為對照參考。

## 相關文件

詳見專案根目錄的 [CLOUDFLARE_GUIDE.md](../CLOUDFLARE_GUIDE.md) 第 2 節「架構選型決策」。
