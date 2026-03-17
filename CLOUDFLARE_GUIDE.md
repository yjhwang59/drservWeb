# Cloudflare Workers & D1 完整操作指南

> 本文件整理自 drservWeb 專案的實戰經驗，涵蓋從零部署到疑難排解的全過程。

---

## 目錄

1. [核心概念](#1-核心概念)
2. [架構選型決策](#2-架構選型決策)
3. [wrangler.jsonc 設定指南](#3-wranglerjsonc-設定指南)
4. [D1 資料庫操作](#4-d1-資料庫操作)
5. [Worker API 開發](#5-worker-api-開發)
6. [部署方式與流程](#6-部署方式與流程)
7. [Cloudflare Dashboard 設定](#7-cloudflare-dashboard-設定)
8. [API Token 與權限](#8-api-token-與權限)
9. [GitHub Actions CI/CD](#9-github-actions-cicd)
10. [實戰踩坑紀錄](#10-實戰踩坑紀錄)
11. [疑難排解速查表](#11-疑難排解速查表)
12. [專有名詞對照表](#12-專有名詞對照表)
13. [建置心得](#13-建置心得)
14. [側邊欄與後台選單](#14-側邊欄與後台選單)
15. [後台 CRUD 管理](#15-後台-crud-管理)

---

## 1. 核心概念

### Workers vs Pages

| 面向 | **Workers** | **Pages** |
|------|------------|-----------|
| 定位 | 通用無伺服器運算平台 | 前端/全端部署平台 |
| 核心用途 | API、代理、中介層 | 靜態網站、SPA、SSR |
| Git 整合 | 需自行設定 CI/CD | 內建 GitHub/GitLab 整合 |
| 預覽部署 | 無 | 每個 PR 自動產生預覽 URL |
| 靜態資產 | 需搭配 `assets` 設定 | 內建託管 |
| 後端功能 | 原生就是後端 | 透過 `functions/` 目錄（Pages Functions） |
| 部署指令 | `wrangler deploy` | `wrangler pages deploy` |
| 免費額度 | 每日 100,000 請求 | 每月 500 次建置；靜態無限請求 |
| 回滾 | 需重新部署 | 一鍵回滾 |

### D1 資料庫

Cloudflare D1 是無伺服器 SQLite 資料庫，跑在邊緣節點上。

- 底層為 SQLite，支援標準 SQL 語法
- 透過 `binding` 綁定到 Worker 或 Pages Function
- 本專案用 Worker 模式，透過 `env.DB` 存取；Pages Functions 則用 `context.env.DB`
- 免費方案：5GB 儲存、500 萬列讀取/天、10 萬列寫入/天

---

## 2. 架構選型決策

### 決策樹

```
你的專案需要後端 API 嗎？
├── 不需要 → 純靜態 → Cloudflare Pages（最簡單）
└── 需要
    ├── API 邏輯簡單（表單、CRUD）→ Pages + Pages Functions
    └── API 邏輯複雜（WebSocket、Cron）→ 獨立 Worker
```

### 本專案選擇：Worker + Assets + D1

本專案部署為 **Cloudflare Worker**（非 Pages），使用 `worker.ts` 作為入口點，`assets` 設定服務靜態檔案：

```
請求 → Cloudflare Worker（worker.ts）
  ├─ 靜態檔案（dist/）→ 由 assets 直接回應（HTML、CSS、JS、圖片）
  ├─ POST /api/inquiry → 由 worker.ts 中的 handleInquiry() 處理
  │                          ├── 寫入 D1 資料庫
  │                          └── 透過 Resend API 寄送通知信
  └─ 其他路徑 → SPA fallback（index.html）
```

> **注意**：專案中也有 `functions/` 目錄（Pages Functions 格式），但在 Worker 部署模式下**完全不生效**。
> 實際的 API 邏輯在 `worker.ts` 中，不在 `functions/api/inquiry.ts`。
> `functions/` 目錄是早期嘗試 Pages 部署時留下的，可作為未來遷移至 Pages 的參考。

### 替代方案：Pages + Pages Functions

若未來想遷移至 Pages 模式（享有 Git 連動預覽部署、一鍵回滾等優勢），需要：

1. 從 `wrangler.jsonc` 移除 `"main"` 和 `"assets"` 設定
2. 確保 `functions/` 目錄的 API 邏輯與 `worker.ts` 同步
3. 部署指令改用 `wrangler pages deploy dist`
4. 在 Dashboard 重新設定 D1 binding 和環境變數

```
使用者瀏覽器
    │
    ├── GET /*           → Cloudflare Pages（靜態 SPA）
    └── POST /api/*      → Pages Functions（functions/ 目錄）
                               │
                               ├── D1 資料庫
                               └── Resend API
```

---

## 3. wrangler.jsonc 設定指南

### Worker 模式（assets + worker 入口）

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "drserv",
  "main": "worker.ts",                    // Worker 入口點
  "compatibility_date": "2025-09-27",
  "assets": {
    "directory": "dist",                   // 靜態資產目錄
    "not_found_handling": "single-page-application"  // SPA 路由
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "myd1_db",
    "database_id": "36c4deed-9ddb-4531-a041-0041b152b8e4"
  }]
}
```

### Pages 模式（用 functions/ 目錄）

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "drserv",
  "compatibility_date": "2025-09-27",
  // 注意：pages_build_output_dir 只用於 Cloudflare Git 連動建置
  // 若用 GitHub Actions 部署，不要加這個欄位
  "d1_databases": [{
    "binding": "DB",
    "database_name": "myd1_db",
    "database_id": "36c4deed-9ddb-4531-a041-0041b152b8e4"
  }]
}
```

### 關鍵差異

| 設定欄位 | Worker 模式 | Pages 模式 |
|---------|------------|-----------|
| `main` | 必填（worker.ts） | 不填 |
| `assets.directory` | `"dist"` | 不填 |
| `pages_build_output_dir` | 不填 | 視部署方式而定 |
| `functions/` 目錄 | 不生效 | 自動偵測為 Pages Functions |

### ⚠️ 踩坑重點

1. **`pages_build_output_dir`** — 加了這個欄位後，Cloudflare Git 建置系統會自動執行 `npx wrangler deploy`，若 wrangler 版本或權限有問題會導致部署失敗
2. **`functions/` 目錄** — 只在 Pages 部署時有效。Worker 部署（`wrangler deploy`）會完全忽略
3. **`assets` vs `pages_build_output_dir`** — 前者是 Worker 的靜態資產設定；後者是 Pages 的建置輸出設定。兩者不能混用
4. **`not_found_handling: "single-page-application"`** — 取代 `_redirects` 檔案。不要同時使用兩者

---

## 4. D1 資料庫操作

### 建立資料庫

**方法 A：CLI**
```bash
npx wrangler d1 create myd1_db
# 會回傳 database_id，貼到 wrangler.jsonc
```

**方法 B：Dashboard**
1. Cloudflare Dashboard → Workers & Pages → D1 SQL Database
2. Create → 輸入名稱 → 記下 Database ID

### 執行 Migration

**Dashboard Console（最可靠）：**
```sql
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**CLI（本地或遠端）：**
```bash
# 本地開發
npx wrangler d1 execute myd1_db --local --file=migrations/0001_create_inquiries.sql

# 正式環境
npx wrangler d1 execute myd1_db --remote --file=migrations/0001_create_inquiries.sql
```

### ⚠️ Migration 注意事項

- `d1 migrations apply` 是 Workers 專用指令，在 Pages 專案中會被拒絕
- 改用 `d1 execute --file` 在 Pages 專案中可正常運作
- 使用 `CREATE TABLE IF NOT EXISTS` 確保冪等性
- GitHub Actions 中建議加 `continue-on-error: true`，避免 migration 失敗阻擋部署

### D1 API 用法

```typescript
// 定義環境型別
interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  MAIL_RECIPIENT: string;
}

// INSERT
const result = await env.DB.prepare(
  'INSERT INTO inquiries (organization, contact_name, phone, email, inquiry_type, message) VALUES (?, ?, ?, ?, ?, ?)'
).bind(org, name, phone, email, type, msg).run();
// result.meta.last_row_id → 新增的 ID

// SELECT 單筆
const row = await env.DB.prepare(
  'SELECT * FROM inquiries WHERE id = ?'
).bind(id).first();

// SELECT 多筆
const { results } = await env.DB.prepare(
  'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 10'
).all();
```

---

## 5. Worker API 開發

本專案使用 **Worker 模式**（`worker.ts` 為入口點），在單一 Worker 中同時處理 API 路由和靜態資產。

### 專案檔案結構

```
worker.ts                   ← Worker 入口點（API 路由 + fetch handler）★ 實際生效
wrangler.jsonc              ← Cloudflare 設定（assets、D1 binding）
dist/                       ← Vite 建置的靜態檔案（由 assets 設定服務）
migrations/
  0001_create_inquiries.sql ← D1 資料庫 schema
functions/                  ← ⚠️ Pages Functions 格式（Worker 模式下不生效）
server/                     ← Express 後端（僅本地開發用）
```

### 型別定義

```typescript
interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  MAIL_RECIPIENT: string;
  ADMIN_API_KEY?: string;   // 後台 /api/admin/* 的 Bearer 認證金鑰
}
```

### Worker 入口 — `worker.ts`

Worker 的 `fetch` handler 負責路由分派。非 API 路徑由 `assets` 設定自動處理（靜態檔案 + SPA fallback），不需要在程式碼中手動處理：

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/inquiry') {
      return handleInquiry(request, env);
    }

    // 非 API 路徑 → 由 wrangler.jsonc 的 assets 設定自動處理
    // 靜態檔案直接回應，其餘走 SPA fallback（index.html）
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
```

### API 處理函式範例

```typescript
async function handleInquiry(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  const body = await request.json();
  // 驗證欄位...

  // 寫入 D1（透過 env.DB 直接存取）
  const result = await env.DB.prepare(
    'INSERT INTO inquiries (organization, contact_name, phone, email, inquiry_type, message) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(org, name, phone, email, type, msg).run();

  // 透過 Resend 寄信
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@drserv.com.tw',
      to: env.MAIL_RECIPIENT || 'service@drserv.com.tw',
      subject: `[官網洽詢] ${body.organization}`,
      text: '...',
    }),
  });

  return Response.json({ success: true, id: result.meta?.last_row_id }, { status: 201 });
}
```

> **Worker vs Pages Functions 存取 D1 的差異**：Worker 用 `env.DB`，Pages Functions 用 `context.env.DB`。

### 替代方案：Pages Functions（供參考）

專案中保留了 `functions/` 目錄，若未來遷移至 Pages 模式可直接使用：

```
functions/
  types.ts                  ← 環境變數型別
  api/
    _middleware.ts           ← 所有 /api/* 的 CORS 中介層
    health.ts               ← GET  /api/health
    inquiry.ts              ← POST /api/inquiry
```

> 遷移步驟見第 2 節「替代方案：Pages + Pages Functions」。

---

## 6. 部署方式與流程

本專案以 **Worker 模式**部署，使用 `wrangler deploy`（而非 `wrangler pages deploy`）。

### 方式 A：GitHub Actions 自動部署（推薦，目前使用中）

每次 push 到 `main` 分支自動觸發。`command: deploy` 執行 `wrangler deploy`，部署 Worker + Assets。

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build

      - name: Apply D1 schema
        continue-on-error: true
        run: npx wrangler d1 execute myd1_db --remote --file=migrations/0001_create_inquiries.sql
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

### 方式 B：Cloudflare Dashboard Git 連動

Dashboard 也曾設定 Git 連動建置，**已驗證可用的設定**：

| 欄位 | 值 |
|------|-----|
| 組建命令 (Build command) | `npm run build` |
| 部署命令 (Deploy command) | `echo deployed` |
| 非生產分支部署命令 | `npx wrangler versions upload` |
| 路徑 (Root directory) | `/` |
| 建置輸出目錄 (Build output) | `dist` |

> **注意**：若同時啟用 GitHub Actions 和 Dashboard Git 連動，每次 push 會觸發兩次部署。建議只啟用其中一種。

### 方式 C：本機 CLI 部署

```bash
npm run build
npx wrangler deploy  # Worker 模式部署
```

> Windows ARM64 不支援 `workerd`，無法在本機執行 wrangler。需改用 GitHub Actions。

---

## 7. Cloudflare Dashboard 設定

### Worker 專案 Bindings

進入 Workers & Pages → 你的 Worker（`drserv`）→ Settings → Bindings：

| 類型 | 變數名 | 值 |
|------|--------|-----|
| D1 Database | `DB` | 選擇你的 D1 資料庫 |

### Environment Variables（加密存儲）

| 變數名 | 值 | 勾選 Encrypt |
|--------|-----|------------|
| `RESEND_API_KEY` | `re_xxxx...` | ✅ |
| `MAIL_RECIPIENT` | `service@drserv.com.tw` | 選填 |
| `ADMIN_API_KEY` | 自訂金鑰（後台 API 認證用） | ✅ 建議 |

- **ADMIN_API_KEY**：後台管理（`/admin`）呼叫 `/api/admin/*` 時須在 Request Header 帶 `Authorization: Bearer <ADMIN_API_KEY>`。前端在後台頁面輸入相同金鑰後存於 localStorage，未設定時後端回傳 501。

### 注意事項

- Production 和 Preview 環境的 bindings **分開設定**
- 新增 binding 後需**重新部署**才生效
- Dashboard 顯示的範例 SQL（`env.MY_BINDING`）只是參考，不需要修改
- D1 binding 要在 **Worker 專案設定頁**加，不是在 D1 資料庫頁面

---

## 8. API Token 與權限

### 建立步驟

1. Cloudflare Dashboard → My Profile → API Tokens → Create Token
2. 選 **Create Custom Token**
3. 加入權限：

| Account/Zone | Resource | Permission |
|---|---|---|
| Account | Workers Scripts | Edit |
| Account | D1 | Edit |
| Account | Cloudflare Pages | Edit（若未來遷移至 Pages 才需要） |

4. Account Resources → Include → 你的帳號
5. 複製 Token（只顯示一次）

### 設定 GitHub Secrets

```
https://github.com/<user>/<repo>/settings/secrets/actions
```

| Secret | 值 |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | 剛複製的 Token |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard URL 中的 Account ID |

### 確認 Account ID

Account ID 可從以下位置取得：
- Dashboard URL：`https://dash.cloudflare.com/<ACCOUNT_ID>/...`
- Dashboard 首頁右側欄
- 部署日誌中的 Account 資訊表格

---

## 9. GitHub Actions CI/CD

### 常見問題排查

| 錯誤訊息 | 原因 | 解法 |
|---------|------|------|
| `Authentication error [code: 10000]` | API Token 缺少權限 | 確認 Token 有 Workers Scripts Edit / D1 Edit 權限 |
| `Project not found [code: 8000007]` | Pages 專案不存在（可能是 Worker） | 確認專案名稱，或改用 `wrangler deploy` |
| `Missing entry-point to Worker script` | wrangler.jsonc 缺少 `main` 或 `assets` | 加入 `"main"` 或 `"assets.directory"` |
| `Workers-specific command in Pages project` | `d1 migrations apply` 不適用 Pages | 改用 `d1 execute --file` |
| `Invalid _redirects: Infinite loop` | `_redirects` 與 SPA 設定衝突 | 刪除 `_redirects`，用 `not_found_handling` |

### D1 Migration 在 CI/CD 中的最佳實踐

```yaml
- name: Apply D1 schema
  continue-on-error: true    # 表已存在時不阻擋部署
  run: npx wrangler d1 execute myd1_db --remote --file=migrations/0001_create_inquiries.sql
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

---

## 10. 實戰踩坑紀錄

### 踩坑 1：Worker 部署忽略 functions/ 目錄

**症狀**：前端送出表單回傳 `Unexpected end of JSON input`

**原因**：`wrangler deploy`（Worker 模式）不會處理 `functions/` 目錄。SPA fallback 把 API 請求回傳了 `index.html`，前端用 `res.json()` 解析 HTML 就報錯。

**解法（本專案採用 B）**：
- A：改用 `wrangler pages deploy`（Pages 模式，需拿掉 `main` 和 `assets` 設定）
- B：✅ 新增 `worker.ts` 入口，在 Worker 中手動處理 API 路由

### 踩坑 2：pages_build_output_dir 觸發自動部署

**症狀**：Cloudflare Git 建置系統報「Missing entry-point」或認證錯誤

**原因**：`wrangler.jsonc` 中的 `pages_build_output_dir` 會讓建置系統自動執行 `npx wrangler deploy`，但權限或設定不對就會失敗。

**解法**：移除 `pages_build_output_dir`，在 Dashboard 設定 Build output directory 為 `dist`，Deploy command 填 `echo deployed`。

### 踩坑 3：wrangler v3 vs v4 指令不一致

**症狀**：`wrangler deploy` 在 Pages 專案中報錯

**原因**：
- wrangler v3：`wrangler deploy` 只能用於 Worker；Pages 必須用 `wrangler pages deploy`
- wrangler v4：`wrangler deploy` 理論上統一了，但在某些場景仍會提示要用 `pages deploy`

**解法**：明確使用 `wrangler pages deploy dist --project-name=xxx`，或在 Dashboard 設定讓 Pages 原生處理部署。

### 踩坑 4：D1 migration 指令在 Pages 中被拒

**症狀**：`wrangler d1 migrations apply` 回傳 "Workers-specific command in a Pages project"

**原因**：`wrangler.jsonc` 有 `pages_build_output_dir` 時，wrangler 視為 Pages 專案，拒絕 Workers 專用指令。

**解法**：改用 `wrangler d1 execute myd1_db --remote --file=migrations/xxx.sql`。

### 踩坑 5：_redirects 導致無限迴圈

**症狀**：部署失敗，報 "Infinite loop detected in this rule"

**原因**：`public/_redirects` 中 `/* /index.html 200` 在 Workers 的 assets 模式下被判定為無限迴圈。

**解法**：刪除 `_redirects`，改用 `wrangler.jsonc` 中的 `not_found_handling: "single-page-application"`。

### 踩坑 6：Dashboard 部署命令被快取

**症狀**：改了 `wrangler.jsonc` 但 Dashboard 仍執行舊的部署命令

**原因**：Cloudflare Dashboard 的 Deploy command 欄位是獨立設定，不會因 config 改變而自動更新。

**解法**：手動到 Dashboard → Settings → Build & Deployment → Edit，修改部署命令。

### 踩坑 7：Windows ARM64 不支援 workerd

**症狀**：本機執行 `wrangler` 任何指令都失敗

**原因**：`workerd`（wrangler 底層）不支援 `win32 arm64`。

**解法**：改用 GitHub Actions 部署（Linux x64 環境），或用 Dashboard Git 連動。本地開發用 Express 後端替代。

---

## 11. 疑難排解速查表

| 症狀 | 檢查項目 |
|------|---------|
| API 回傳 HTML 而非 JSON | 確認 API 路由有被部署（Worker 模式需 `main` 入口；Pages 模式需 `functions/` 目錄） |
| `Authentication error` | 到 Dashboard 檢查 API Token 權限是否包含 Workers Scripts Edit |
| `Project not found` | 確認專案名稱是否正確（Worker 和 Pages 專案名稱不互通） |
| D1 查詢回傳 null | 確認 D1 binding 名稱（`DB`）與程式碼中 `env.DB` 一致 |
| 環境變數取不到 | 確認在 Dashboard 的正確環境（Production/Preview）設定了變數 |
| 部署後仍是舊版 | 確認有觸發重新部署（binding 變更後需重新部署） |
| 本機 wrangler 不能用 | Windows ARM64 目前不支援，改用 GitHub Actions |

---

## 12. 專有名詞對照表

### Cloudflare 平台

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **Cloudflare Workers** | Workers 無伺服器運算 | 在 Cloudflare 全球邊緣節點執行 JavaScript/TypeScript 的無伺服器（serverless）平台 |
| **Cloudflare Pages** | Pages 靜態網站平台 | 專為前端/全端網站設計的託管平台，支援 Git 連動自動部署 |
| **Pages Functions** | Pages 函式 | Pages 專案中 `functions/` 目錄下的 serverless API 端點，底層就是 Workers |
| **Cloudflare D1** | D1 資料庫 | Cloudflare 提供的無伺服器 SQLite 資料庫，跑在邊緣節點上 |
| **Cloudflare KV** | KV 鍵值儲存 | 全球分散式的 Key-Value 儲存，適合讀多寫少的場景 |
| **Cloudflare R2** | R2 物件儲存 | 相容 S3 API 的物件儲存服務，適合存放檔案、圖片等 |
| **Cloudflare Access** | Access 存取控制 | Zero Trust 安全機制，可在 Workers/Pages 前面加登入驗證頁 |
| **Edge Network** | 邊緣網路 | Cloudflare 全球 300+ 資料中心組成的網路，程式碼就近使用者執行 |
| **V8 Isolates** | V8 隔離沙箱 | Workers 的執行環境，比容器更輕量，毫秒級冷啟動 |

### 開發工具

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **Wrangler** | Wrangler CLI 工具 | Cloudflare 官方的命令列工具，用於開發、測試、部署 Workers/Pages |
| **wrangler.jsonc** | Wrangler 設定檔 | 專案的 Cloudflare 設定檔，定義名稱、bindings、資產目錄等（支援 JSON with Comments） |
| **workerd** | workerd 本地執行環境 | Cloudflare Workers 的開源本地執行引擎，`wrangler dev` 底層使用它模擬邊緣環境 |
| **Miniflare** | Miniflare 模擬器 | wrangler 內建的本地開發模擬器（v3 起整合進 wrangler） |
| **`wrangler deploy`** | 部署指令（Worker） | 將程式碼部署為 Cloudflare Worker |
| **`wrangler pages deploy`** | 部署指令（Pages） | 將靜態檔案和 Functions 部署為 Cloudflare Pages 專案 |

### 設定與綁定

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **Binding** | 繫結/綁定 | 將外部資源（D1、KV、R2 等）連結到 Worker/Pages Function，在程式中透過 `env.NAME` 存取 |
| **Environment Variables** | 環境變數 | 儲存在 Cloudflare 的設定值（如 API Key），程式透過 `env.NAME` 讀取 |
| **Secrets** | 加密變數 | 設定為 Encrypt 的環境變數，儲存後無法從 Dashboard 讀回 |
| **`compatibility_date`** | 相容性日期 | wrangler.jsonc 中指定的日期，決定 Workers 執行環境使用哪一版的 API 行為 |
| **`compatibility_flags`** | 相容性旗標 | 啟用特定功能（如 `nodejs_compat` 啟用 Node.js API 相容層） |
| **`main`** | Worker 入口點 | wrangler.jsonc 中指定 Worker 的主程式檔案（如 `worker.ts`） |
| **`assets`** | 靜態資產設定 | Worker 模式下，設定靜態檔案目錄和 SPA fallback 行為 |
| **`pages_build_output_dir`** | Pages 建置輸出目錄 | Pages 模式下，指定建置產出的靜態檔案目錄（⚠️ 會觸發自動部署行為） |
| **`not_found_handling`** | 404 處理模式 | 設為 `"single-page-application"` 時，未匹配路徑回傳 `index.html` |

### D1 資料庫

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **D1Database** | D1 資料庫型別 | TypeScript 中 D1 綁定的全域型別，不需 import |
| **`database_id`** | 資料庫 ID | 建立 D1 時取得的 UUID，填入 wrangler.jsonc |
| **`database_name`** | 資料庫名稱 | D1 資料庫的人類可讀名稱 |
| **`.prepare(sql)`** | 預備語句 | 建立參數化 SQL 查詢，防止 SQL injection |
| **`.bind(...args)`** | 綁定參數 | 將值綁定到預備語句的 `?` 占位符 |
| **`.run()`** | 執行（寫入） | 執行 INSERT/UPDATE/DELETE，回傳 `meta.last_row_id` 等資訊 |
| **`.first()`** | 查詢單筆 | 執行 SELECT 取得第一筆結果 |
| **`.all()`** | 查詢多筆 | 執行 SELECT 取得所有結果，回傳 `{ results: [...] }` |
| **Migration** | 資料庫遷移 | 用 SQL 檔案定義資料表結構的版本化管理方式 |

### 部署與 CI/CD

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **GitHub Actions** | GitHub 自動化工作流程 | GitHub 提供的 CI/CD 平台，推送程式碼後自動執行建置與部署 |
| **Workflow** | 工作流程 | `.github/workflows/` 下的 YAML 檔案，定義自動化步驟 |
| **GitHub Secrets** | GitHub 機密變數 | 儲存在 GitHub Repo 設定中的加密值（如 API Token），在 Actions 中用 `${{ secrets.NAME }}` 引用 |
| **`cloudflare/wrangler-action`** | Wrangler GitHub Action | Cloudflare 官方的 GitHub Actions 套件，封裝了 wrangler 的安裝與執行 |
| **`continue-on-error`** | 允許失敗繼續 | GitHub Actions 步驟屬性，設為 `true` 時該步驟失敗不會中斷整個 workflow |
| **Git Integration** | Git 連動 | Cloudflare Dashboard 直接連結 GitHub/GitLab，推送即部署（不經過 GitHub Actions） |
| **Preview Deployment** | 預覽部署 | Pages 針對非 production 分支自動產生的預覽版本，有獨立 URL |
| **Production** / **Preview** | 正式/預覽環境 | Pages 的兩個環境，bindings 和環境變數需分別設定 |

### 網路與安全

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **CDN** | 內容傳遞網路 | Content Delivery Network，將靜態內容快取到全球邊緣節點加速存取 |
| **Custom Domain** | 自訂網域 | 將自己的網域（如 `www.drserv.com.tw`）綁定到 Workers/Pages 專案 |
| **API Token** | API 存取令牌 | Cloudflare 的認證憑證，用於 CLI 和 CI/CD 操作。不同於 Global API Key |
| **Account ID** | 帳號 ID | Cloudflare 帳號的唯一識別碼，部署時需要提供 |
| **CORS** | 跨來源資源共用 | Cross-Origin Resource Sharing，允許不同網域的前端呼叫 API |
| **SPA** | 單頁應用程式 | Single Page Application，只有一個 HTML 入口，路由由前端 JavaScript 處理 |
| **SSR** | 伺服器端渲染 | Server-Side Rendering，在伺服器產生 HTML 後送到瀏覽器 |

### 本專案使用的第三方服務

| 英文術語 | 中文 | 說明 |
|---------|------|------|
| **Resend** | Resend 郵件服務 | 以 HTTP API 方式寄送 Email 的第三方服務（取代傳統 SMTP） |
| **Vite** | Vite 建置工具 | 前端開發伺服器與打包工具，支援 HMR 熱更新 |
| **better-sqlite3** | 本地 SQLite 函式庫 | Node.js 原生模組，用於本機開發時的 SQLite 資料庫存取（正式環境改用 D1） |

---

## 13. 建置心得

### 從一頁式網站到全端自動部署

這個專案大約花了 **一天半**的時間，從零到完成。回顧整個過程，可以分為三個階段：

#### 第一階段：快速上線（約 1 小時）

最初只是一個簡單的一頁式公司官網——用 React + Vite + Tailwind CSS 搭建，純靜態、沒有後端。透過 Cloudflare Pages 直接從 GitHub 部署，一小時內就上線了：

> [https://cats.drserv.com.tw](https://cats.drserv.com.tw)

這個階段體驗了 Cloudflare Pages 的便利——連結 GitHub 儲存庫，推送即部署，完全不需要操心伺服器。

#### 第二階段：自動部署的學習之路（大量踩坑）

為了深入學習 GitHub CI/CD 與 Cloudflare 的整合，開始加入後端功能：聯絡表單 API、D1 資料庫、Resend 寄信服務。這個階段遇到了大量的錯誤：

- API Token 權限不足導致認證失敗
- Worker 與 Pages 部署模式混淆，`functions/` 目錄在 Worker 模式下不生效
- `wrangler` v3 與 v4 指令不一致
- `pages_build_output_dir` 觸發非預期的自動部署行為
- `_redirects` 與 SPA 設定衝突導致無限迴圈
- Windows ARM64 不支援 `workerd`，本機無法執行 wrangler
- D1 migration 指令在不同部署模式下行為不同

每一個錯誤都是一次學習，最終都記錄在本文件的[第 10 節（實戰踩坑紀錄）](#10-實戰踩坑紀錄)中。

#### 第三階段：知識沉澱

完成部署後，將整個過程整理成：

1. **本文件**（`CLOUDFLARE_GUIDE.md`）——完整的 Cloudflare Workers & D1 操作指南
2. **部署指南**（`DEPLOYMENT.md`）——專案專屬的部署 SOP
3. **Cursor Skill**（`cloudflare-workers-d1-deploy`）——讓 AI 助手在未來的專案中能快速重複這套流程

### 給有緣工程師的建議

1. **先跑通最簡單的路徑**——靜態網站 + Cloudflare Pages，確認基礎部署沒問題後再加功能
2. **Worker 和 Pages 是兩條路**——選定一條走到底，不要混用（本專案最終選擇 Worker + Assets + D1）
3. **認真看錯誤訊息**——Cloudflare 的錯誤代碼（如 `10000`、`8000007`）都有明確含義，對照排查很快
4. **善用 `continue-on-error`**——CI/CD 中的非關鍵步驟（如 D1 migration）加上這個，避免已存在的資料表阻擋整個部署
5. **本機跑不動就靠雲端**——Windows ARM64 目前不支援 wrangler 本地執行，與其糾結不如直接用 GitHub Actions

> 期望這份實戰經驗能幫助到有緣的工程師，少走一些彎路。

---

## 14. 側邊欄與後台選單

後台（`/admin`）使用**資料庫驅動的樹狀選單**，由 D1 的 `menu_items` 表提供資料，經 `GET /api/menu` 回傳樹結構，前端 `AdminLayout` 載入後渲染側邊欄。

### 資料表：menu_items

Migration 檔：`migrations/0002_create_menu_items.sql`

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | INTEGER PK | 主鍵 |
| parent_id | INTEGER NULL | 父節點 ID，NULL 表示根項目 |
| menu_code | TEXT UNIQUE | 選單代碼（如 `dashboard`、`contact_mgmt`） |
| menu_name | TEXT | 顯示名稱（如「儀表板」、「聯絡我們管理」） |
| menu_icon | TEXT | 圖示名稱，對應 Lucide 元件（如 `LayoutDashboard`、`Mail`） |
| menu_url | TEXT | 連結路徑（`link` 用）；dropdown 可填 `#` |
| menu_type | TEXT | `link`、`dropdown`、`divider`、`header` |
| sort_order | INTEGER | 排序數字，越小越前面 |
| is_visible | INTEGER | 1 顯示、0 隱藏 |

- **link**：單一連結，點擊導向 `menu_url`
- **dropdown**：父項目，底下有 `children`，不直接導向
- **divider**：視覺分隔線
- **header**：區塊標題（不連結）

### API：GET /api/menu

- **認證**：不需要，公開 API
- **回應**：`{ success: true, menu: [ ... ] }`，`menu` 為樹狀陣列（根節點含 `children`）
- **邏輯**：Worker 查詢 `menu_items WHERE is_visible = 1`，依 `parent_id`、`sort_order` 組合成樹

### 前端：AdminLayout 與選單渲染

- **入口**：`src/components/admin/AdminLayout.tsx`
- **載入**：`useEffect` 內 `fetch('/api/menu')` → 設定 `menu` state
- **容器**：側邊欄 `<ul id="menu-list">`，依 `menu` 遞迴渲染 `MenuItem`
- **MenuItem**：依 `menu_type` 渲染連結、下拉（展開/收合）、分隔線或標題；目前圖示對應 `LayoutDashboard`、`Mail`、`List`、`Inbox`（Lucide）
- **響應式**：`sidebarOpen` 控制側欄顯示/隱藏；小螢幕有遮罩與開關按鈕

### 預設種子資料（0002 內 INSERT）

- 根：儀表板（`/admin`）、聯絡我們管理（dropdown）
- 聯絡我們管理子項：洽詢內容選項（`/admin/inquiry-types`）、表單回覆（`/admin/inquiries`）

若要新增或調整選單，可於 D1 Console 對 `menu_items` 做 INSERT/UPDATE，或未來擴充 Admin API 做選單 CRUD。

---

## 15. 後台 CRUD 管理

後台提供**洽詢內容選項**（inquiry_types）與**表單回覆**（inquiries）的 CRUD，所有 `/api/admin/*` 皆需 **Bearer 金鑰**認證。

### 認證方式

| 位置 | 說明 |
|------|------|
| **Cloudflare Worker** | 環境變數 `ADMIN_API_KEY`（Dashboard → Worker → Settings → Variables，建議 Encrypt） |
| **前端** | 後台頁頂輸入與後端相同的金鑰，存於 localStorage（`src/lib/adminApi.ts`）；未設定時僅能讀取公開 API（如 `/api/inquiry-types`），無法呼叫 admin API |
| **Request** | `Authorization: Bearer <ADMIN_API_KEY>` |

- 未設定 `ADMIN_API_KEY`：回傳 `501`、訊息「後台未設定 ADMIN_API_KEY」
- 金鑰錯誤或未帶：回傳 `401`、訊息「未授權」

### 後台路由（前端）

| 路徑 | 元件 | 說明 |
|------|------|------|
| `/admin` | AdminDashboard | 儀表板，連結到洽詢選項與表單回覆 |
| `/admin/inquiry-types` | InquiryTypesPage | 洽詢內容選項 CRUD |
| `/admin/inquiries` | InquiriesListPage | 洽詢列表（分頁、篩選） |
| `/admin/inquiries/:id` | InquiryDetailPage | 單筆詳情、回覆、刪除 |

### 洽詢內容選項 CRUD（inquiry_types）

資料表：`migrations/0003_create_inquiry_types.sql`（`id`, `label`, `sort_order`）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/admin/inquiry-types` | 列表（與公開 GET `/api/inquiry-types` 資料相同，但需 Bearer） |
| POST | `/api/admin/inquiry-types` | 新增，body: `{ label, sort_order? }` |
| PUT | `/api/admin/inquiry-types/:id` | 更新，body: `{ label?, sort_order? }` |
| DELETE | `/api/admin/inquiry-types/:id` | 刪除 |

- 公開 **GET `/api/inquiry-types`** 供官網聯絡表單下拉選單使用，不需認證。

### 洽詢表單回覆 CRUD（inquiries）

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/admin/inquiries` | 列表，query: `page`, `limit`, `status`, `inquiry_type` |
| GET | `/api/admin/inquiries/:id` | 單筆詳情 |
| PATCH | `/api/admin/inquiries/:id` | 更新，body: `{ admin_reply?, status?, replied_at? }`（回覆、狀態） |
| DELETE | `/api/admin/inquiries/:id` | 刪除 |

- 列表支援分頁（`page`、`limit`）與篩選（`status`、`inquiry_type`）。

### Worker 中的實作要點

- **adminAuth**：檢查 `env.ADMIN_API_KEY` 與 `Authorization: Bearer <token>`，不符則回傳 401/501
- 所有 `/api/admin/*` 先經 `adminAuth` 再分派到對應 handler
- 洽詢內容：`handleAdminGetInquiryTypes`、`handleAdminPostInquiryTypes`、`handleAdminPutInquiryTypes`、`handleAdminDeleteInquiryTypes`
- 洽詢表單：`handleAdminGetInquiries`、`handleAdminGetInquiry`、`handleAdminPatchInquiry`、`handleAdminDeleteInquiry`

### 本地開發

- 後端：`server/index.js` 以 `ADMIN_API_KEY`（或 `.env`）做 `adminAuth`，路由與 Worker 對齊（GET/POST/PUT/DELETE inquiry-types、GET/GET/PATCH/DELETE inquiries）。
- 前端：同一套 `adminApi.ts`，在本地同樣於後台輸入金鑰即可呼叫本地 API。

---

## 參考連結

- [Cloudflare Workers 文件](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages 文件](https://developers.cloudflare.com/pages/)
- [D1 文件](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Resend API](https://resend.com/docs)

---

## 相關 Chat 紀錄

| Chat | 主題 |
|------|------|
| [Workers vs Pages 比較](9e1e1a49-3ba7-4dd7-8271-14d108334f9f) | Worker 部署修復、API 入口點建立 |
| [圖片優化與版本號](befa51e2-cee3-4b30-bf81-927b8c99719a) | 部署流程除錯、Dashboard 設定 |
| [全棧部署到 Cloudflare](cf746b29-f72a-4eb6-87e5-2e1bba32781c) | Pages Functions + D1 重構、wrangler 版本問題 |
| [Workers/Pages/D1 簡介](e31992c8-14a6-43b7-8c1a-0944c1a3099f) | 概念說明、D1 API 用法 |
| [初次部署與設定](9d7eb7d1-05c3-4b39-aa89-aa0683d1a6f3) | Git 連動、_redirects、wrangler 自動設定 |
