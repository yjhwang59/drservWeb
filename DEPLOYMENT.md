# 部署指南

## 前置準備

1. 確保已安裝 Node.js 18+ 和 npm
2. 安裝專案依賴：`npm install`

## 本地開發

```bash
npm run dev
```

開發伺服器將在 `http://localhost:5173` 啟動

## 構建生產版本

```bash
npm run build
```

構建完成後，`dist` 目錄將包含所有靜態文件。

## 部署選項

### 1. Cloudflare Pages 部署（推薦，免伺服器）

將網站直接部署到 Cloudflare 代管，免自架伺服器、自動 HTTPS、全球 CDN。

#### 方式 A：透過 Git 連動（推薦）

1. 將專案推送到 GitHub（例如 https://github.com/yjhwang59/drservWeb）
2. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **建立** → **Pages** → **連接到 Git**
3. 選擇 **GitHub** 並授權，選取 `drservWeb` 儲存庫
4. 建置設定（通常會自動偵測 Vite）：
   - **建置命令**：`npm run build`
   - **建置輸出目錄**：`dist`
   - **根目錄**：留空
5. 儲存並部署，完成後會得到 `https://<專案名>.pages.dev`，可在 Pages 設定中綁定自訂網域

本專案已包含 `public/_redirects`，可讓 SPA 路由（如重新整理子路徑）正常運作。

#### 方式 B：本機 Wrangler 上傳

1. 安裝 Wrangler：`npm install -g wrangler`
2. 登入：`wrangler login`
3. 建置並上傳：
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=drserv-web
   ```
4. 首次會提示建立 Pages 專案，之後每次執行上述兩行即可更新

### 2. Vercel 部署

1. 將專案推送到 GitHub
2. 在 [Vercel](https://vercel.com) 導入專案
3. Vercel 會自動檢測 Vite 專案並進行構建
4. 部署完成後會自動獲得 HTTPS 域名

### 3. Netlify 部署

1. 將專案推送到 GitHub
2. 在 [Netlify](https://netlify.com) 導入專案
3. 構建命令：`npm run build`
4. 發布目錄：`dist`
5. 部署完成

### 4. GitHub Pages 部署

1. 安裝 `gh-pages`：`npm install --save-dev gh-pages`
2. 在 `package.json` 添加部署腳本：
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```
3. 執行：`npm run deploy`

### 5. 傳統伺服器部署（含 Cloudflare DNS）

若使用自架伺服器（IIS/Nginx），並以 Cloudflare 做 DNS 與 CDN，請參考專案內 **部署指南-Cloudflare與防火牆設定.md**。簡要步驟：

1. 執行 `npm run build`
2. 將 `dist` 目錄內容上傳到伺服器
3. 配置 Web 伺服器（Nginx/Apache）指向 `dist` 目錄
4. 確保伺服器支援 SPA 路由（所有路由重定向到 index.html）

#### Nginx 配置範例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 環境變數（如需要）

如需使用環境變數，創建 `.env` 文件：

```env
VITE_API_URL=https://api.example.com
VITE_CONTACT_EMAIL=service@drserv.com.tw
```

## 聯絡表單整合

目前聯絡表單使用模擬提交。如需實際功能，可選擇：

1. **EmailJS**：前端直接發送郵件
2. **後端 API**：建立後端服務處理表單提交
3. **第三方服務**：如 Formspree、Getform 等

### EmailJS 整合範例

1. 註冊 [EmailJS](https://www.emailjs.com/)
2. 安裝：`npm install @emailjs/browser`
3. 在 `ContactSection.tsx` 中整合 EmailJS

## 效能優化建議

1. **圖片優化**：使用 WebP 格式，並實施 lazy loading
2. **代碼分割**：考慮使用 React.lazy 進行路由級代碼分割
3. **CDN**：使用 CDN 加速靜態資源載入
4. **快取策略**：配置適當的 HTTP 快取標頭

## 監控與分析

建議整合：
- Google Analytics：追蹤訪客行為
- Google Search Console：SEO 監控
- Sentry：錯誤追蹤（如需要）

## 安全建議

1. 確保 HTTPS 連線
2. 設定適當的 CSP（Content Security Policy）
3. 定期更新依賴套件
4. 使用環境變數管理敏感資訊

## 維護

- 定期執行 `npm audit` 檢查安全漏洞
- 更新依賴：`npm update`
- 檢查並修復 linting 錯誤：`npm run lint`

