# 洽詢 API 後端

「立即洽詢」表單會將資料送到此 API：寫入 SQLite 並寄信至 `service@drserv.com.tw`。

## 啟動方式

1. 安裝依賴（在專案根目錄或 `server/` 下執行）：
   ```bash
   cd server && npm install
   ```

2. 複製環境變數範例並編輯：
   ```bash
   cp .env.example .env
   ```
   在 `.env` 中填寫 SMTP 設定（若未設定，表單仍會寫入資料庫，但不會寄信）。

3. 啟動 API：
   ```bash
   npm start
   ```
   API 預設在 `http://localhost:3001`。

4. 前端開發時先啟動此 API，再執行前端的 `npm run dev`。前端會透過 Vite proxy 將 `/api/*` 轉到 `http://localhost:3001`。

## 環境變數說明

| 變數 | 必填 | 說明 |
|------|------|------|
| `PORT` | 否 | API 埠號，預設 3001 |
| `DB_PATH` | 否 | SQLite 檔案路徑，預設 `server/data/inquiries.db` |
| `SMTP_HOST` | 寄信時必填 | SMTP 主機 |
| `SMTP_PORT` | 否 | 預設 587 |
| `SMTP_SECURE` | 否 | 是否使用 TLS，設為 `true` 時通常 port 為 465 |
| `SMTP_USER` | 寄信時必填 | SMTP 帳號 |
| `SMTP_PASS` | 寄信時必填 | SMTP 密碼 |
| `SMTP_FROM` | 否 | 寄件者信箱，預設同 `SMTP_USER` |

## 資料庫

- 使用 SQLite，資料庫檔位於 `server/data/inquiries.db`（首次寫入時自動建立）。
- 表單欄位：機關名稱、聯絡人姓名、聯絡電話、Email、洽詢內容、訊息內容、建立時間。

## API

- **POST /api/inquiry**  
  Content-Type: `application/json`  
  Body: `{ organization, contactName, phone, email, inquiryType, message }`  
  成功回傳 `201` 與 `{ success: true, id, emailSent, message }`。
