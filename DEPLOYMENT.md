# 部署指南 — Cloudflare Pages + D1 + Resend

本專案使用 **Cloudflare Pages**（前端靜態網站）+ **Pages Functions**（後端 API）+ **D1**（資料庫）+ **Resend**（寄信）。

---

## 架構總覽

```
使用者瀏覽器
    │
    ├── GET /*           → Cloudflare Pages（靜態 SPA）
    └── POST /api/*      → Pages Functions（serverless 後端）
                               │
                               ├── D1 資料庫（儲存洽詢表單）
                               └── Resend API（寄送通知信）
```

---

## 一次性設定（約 15 分鐘）

### 步驟 1：建立 Cloudflare 帳號

前往 https://dash.cloudflare.com/ 註冊或登入。

### 步驟 2：建立 D1 資料庫

1. 進入 Cloudflare Dashboard → **Workers & Pages** → **D1 SQL Database**
2. 點擊 **Create** → 資料庫名稱輸入 `drserv-inquiries`
3. 建立後，在 **Console** 頁面貼上以下 SQL 並執行：

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

4. 記下資料庫的 **Database ID**（格式如 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

### 步驟 3：更新 wrangler.jsonc

將 `wrangler.jsonc` 中的 `database_id` 替換為你剛取得的 ID：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "drserv-inquiries",
      "database_id": "你的-database-id-貼在這裡"
    }
  ]
}
```

### 步驟 4：設定 Resend 寄信服務

1. 前往 https://resend.com 註冊帳號
2. 在 **API Keys** 頁面建立一組 API Key（以 `re_` 開頭）
3. （選用）在 **Domains** 頁面新增並驗證 `drserv.com.tw` 網域
   - 未驗證前只能用 `onboarding@resend.dev` 當寄件者做測試
   - 驗證後才能用 `noreply@drserv.com.tw` 當寄件者

### 步驟 5：建立 Cloudflare API Token

1. Cloudflare Dashboard → **My Profile** → **API Tokens** → **Create Token**
2. 使用 **Edit Cloudflare Workers** 模板，確保權限包含：
   - Account: Cloudflare Pages — Edit
   - Account: D1 — Edit
3. 記下產生的 Token

### 步驟 6：設定 GitHub Secrets

在你的 GitHub 儲存庫 → **Settings** → **Secrets and variables** → **Actions**，新增：

| Secret 名稱 | 值 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 步驟 5 取得的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard 右側的 Account ID |

### 步驟 7：在 Cloudflare Pages 設定環境變數（Secrets）

1. 首次部署後（見下方），進入 Cloudflare Dashboard → **Workers & Pages** → 你的 Pages 專案
2. **Settings** → **Bindings** → 新增：
   - **D1 Database**: 變數名 `DB`，選擇 `drserv-inquiries`
3. **Settings** → **Environment variables** → 新增：
   - `RESEND_API_KEY` = 你的 Resend API Key（設為 Encrypt）
   - `MAIL_RECIPIENT` = `service@drserv.com.tw`

---

## 部署方式

### 方式 A：GitHub Actions 自動部署（推薦）

每次 push 到 `main` 分支，GitHub Actions 會自動：
1. 安裝依賴並建置前端
2. 執行 D1 資料庫遷移
3. 部署到 Cloudflare Pages

只需 `git push` 即可！

### 方式 B：Cloudflare Dashboard Git 連動

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 選擇你的 GitHub 儲存庫
3. 建置組態設定（**已驗證可用的設定**）：

   | 欄位 | 值 |
   |------|-----|
   | 組建命令 (Build command) | `npm run build` |
   | 部署命令 (Deploy command) | `echo deployed` |
   | 非生產分支部署命令 | `npx wrangler versions upload` |
   | 路徑 (Root directory) | `/` |
   | 建置輸出目錄 (Build output) | `dist` |

4. 儲存並部署

> **重要：** `wrangler.jsonc` 中不要包含 `pages_build_output_dir`，否則 Cloudflare 會嘗試用 `wrangler deploy` 部署並導致認證錯誤。部署命令填 `echo deployed` 讓 Pages 原生處理部署即可。
>
> 注意：此方式不會自動執行 D1 遷移，需手動在 Dashboard 的 D1 Console 執行 SQL。

---

## 本地開發

由於 wrangler 目前不支援 Windows ARM64 本地執行，本地開發請繼續使用原有方式：

```bash
npm run start
```

這會同時啟動：
- Vite 前端開發伺服器（port 3000）
- Express 後端 API（port 3001，需先 `cd server && npm install`）

Vite 會自動將 `/api` 請求代理到後端。

---

## 自訂網域

部署完成後，你會得到一個 `https://drserv.pages.dev` 網址。要綁定自訂網域：

1. Cloudflare Dashboard → 你的 Pages 專案 → **Custom domains**
2. 新增網域（如 `www.drserv.com.tw`）
3. 按照指示設定 DNS 記錄

---

## 檔案結構說明

```
functions/                  ← Cloudflare Pages Functions（後端 API）
  types.ts                  ← 環境變數型別定義（D1、Resend 等）
  api/
    _middleware.ts           ← CORS 中間件
    health.ts               ← GET /api/health 健康檢查
    inquiry.ts              ← POST /api/inquiry 洽詢表單 API
migrations/
  0001_create_inquiries.sql ← D1 資料庫 schema
wrangler.jsonc              ← Cloudflare 設定檔
.dev.vars                   ← 本地開發環境變數（不上傳 git）
.github/workflows/deploy.yml ← GitHub Actions 自動部署
server/                     ← 原有 Express 後端（本地開發用）
```

---

## 疑難排解

### API 回傳 500 錯誤
- 檢查 Cloudflare Pages → **Functions** → **Logs** 查看錯誤訊息
- 確認 D1 binding 名稱為 `DB`
- 確認資料表已建立

### 郵件未寄出
- 確認 `RESEND_API_KEY` 已設定在 Pages 環境變數中
- 如果用自訂寄件網域，確認已在 Resend 驗證 `drserv.com.tw`
- 查看 Resend Dashboard 的 Logs 確認發送狀態

### 本機無法執行 wrangler
- Windows ARM64 目前不支援 workerd（wrangler 的本地執行環境）
- 改用 GitHub Actions 部署，或在 x64 電腦上操作
- 本地開發繼續使用 `npm run start`（Express 後端）
