# 網站部署指南：Cloudflare DNS + 防火牆設定

> **📝 編碼說明：** 本文件使用 UTF-8 編碼。如果在瀏覽器中開啟出現亂碼，請使用 Cursor/VSCode 的 Markdown 預覽功能（`Ctrl+Shift+V`），或參考 `編碼設定說明.md` 文件。

## 📋 目錄
1. [部署架構概述](#部署架構概述)
2. [步驟一：建置生產版本](#步驟一建置生產版本)
3. [步驟二：Web 伺服器設定](#步驟二web-伺服器設定)
4. [步驟三：防火牆端口轉發設定](#步驟三防火牆端口轉發設定)
5. [步驟四：Cloudflare DNS 設定](#步驟四cloudflare-dns-設定)
6. [步驟五：Cloudflare 額外功能設定](#步驟五cloudflare-額外功能設定)
7. [故障排除](#故障排除)

---

## 部署架構概述

```
網際網路 → Cloudflare CDN → 您的公網 IP → 防火牆/路由器 → Web 伺服器 (Port 80/443)
```

**關鍵組件：**
- **Cloudflare**：DNS 解析、CDN 加速、DDoS 防護、SSL/TLS 加密
- **防火牆**：端口轉發、安全防護
- **Web 伺服器**：Nginx/IIS/Apache 提供網站服務

---

## 步驟一：建置生產版本

### 1.1 建置網站

在專案目錄執行：

```powershell
cd C:\Web\drservWeb
npm run build
```

建置完成後，會在 `dist` 目錄產生所有靜態文件。

### 1.2 測試建置結果

```powershell
npm run preview
```

預覽伺服器會在 `http://localhost:4173` 啟動，檢查是否正常運作。

---

## 步驟二：Web 伺服器設定

根據您使用的 Web 伺服器選擇對應的設定方式：

### 選項 A：使用 IIS (Windows Server)

#### 2.A.1 安裝 IIS

1. 打開「伺服器管理員」
2. 新增角色和功能 → Web 伺服器 (IIS)
3. 確保勾選以下功能：
   - 靜態內容
   - 預設文件
   - HTTP 錯誤
   - HTTP 重新導向

#### 2.A.2 部署網站

1. 將 `dist` 目錄內容複製到 `C:\inetpub\wwwroot\drserv`
2. 打開 IIS 管理員
3. 新增網站：
   - **網站名稱**：drserv
   - **實體路徑**：`C:\inetpub\wwwroot\drserv`
   - **連接埠**：80（HTTP）或 443（HTTPS）
   - **主機名稱**：`www.drserv.com.tw`（您的網域）

**⚠️ 重要：多個主機名稱共享 443 端口**

如果 443 端口已被其他服務使用，IIS 支援透過 **SNI (Server Name Indication)** 讓多個網站共享同一個 443 端口：

1. **為每個網站設定不同的主機名稱**
   - 網站 A：主機名稱 `www.drserv.com.tw`，端口 443
   - 網站 B：主機名稱 `other-site.com`，端口 443（相同端口）

2. **為每個網站綁定不同的 SSL 憑證**
   - 在 IIS 管理員中選擇網站 → 繫結 → 新增
   - 類型：https
   - 端口：443
   - **主機名稱**：輸入對應的網域名稱（重要！）
   - SSL 憑證：選擇對應網域的憑證

3. **確認 SNI 已啟用**
   - 在繫結設定中，確保「需要伺服器名稱指示」已勾選
   - 這讓 IIS 可以根據主機名稱選擇正確的 SSL 憑證

**範例：兩個網站共享 443 端口**
- `www.drserv.com.tw` → 使用 drserv 的 SSL 憑證
- `other-site.com` → 使用 other-site 的 SSL 憑證
- 兩者都使用端口 443，但透過主機名稱區分

#### 2.A.3 設定 URL Rewrite (SPA 路由支援)

1. 安裝 [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
2. 在網站根目錄創建或修改 `web.config`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
    </staticContent>
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="text/css" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="text/css" enabled="true" />
      </staticTypes>
    </httpCompression>
  </system.webServer>
</configuration>
```

### 選項 B：使用 Nginx

#### 2.B.1 安裝 Nginx

**Windows:**
```powershell
# 下載 Nginx for Windows from https://nginx.org/en/download.html
# 解壓縮到 C:\nginx
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nginx
```

#### 2.B.2 設定 Nginx

創建或編輯配置文件：

**Windows:** `C:\nginx\conf\nginx.conf`  
**Linux:** `/etc/nginx/sites-available/drserv`

**基本 HTTP 設定（端口 80）：**

```nginx
server {
    listen 80;
    server_name www.drserv.com.tw drserv.com.tw;
    
    root C:/Web/drservWeb/dist;  # Windows 路徑
    # root /var/www/drserv/dist;  # Linux 路徑
    
    index index.html;
    
    # Gzip 壓縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # SPA 路由支援
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 靜態資源快取
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全性標頭
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**⚠️ 重要：多個主機名稱共享 443 端口（使用 SNI）**

如果 443 端口已被其他服務使用，Nginx 支援透過 **SNI (Server Name Indication)** 讓多個網站共享同一個 443 端口。每個 `server` 區塊可以監聽相同的 443 端口，但使用不同的 `server_name`：

```nginx
# 網站 1：drserv.com.tw
server {
    listen 443 ssl http2;
    server_name www.drserv.com.tw drserv.com.tw;
    
    # SSL 憑證（drserv 的憑證）
    ssl_certificate C:/nginx/ssl/drserv.crt;
    ssl_certificate_key C:/nginx/ssl/drserv.key;
    
    root C:/Web/drservWeb/dist;
    index index.html;
    
    # SSL 設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # SPA 路由支援
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 靜態資源快取
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# 網站 2：other-site.com（共享 443 端口）
server {
    listen 443 ssl http2;
    server_name other-site.com www.other-site.com;
    
    # SSL 憑證（other-site 的憑證）
    ssl_certificate C:/nginx/ssl/other-site.crt;
    ssl_certificate_key C:/nginx/ssl/other-site.key;
    
    root C:/Web/other-site/dist;
    index index.html;
    
    # SSL 設定（與網站 1 相同）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name www.drserv.com.tw drserv.com.tw;
    return 301 https://$host$request_uri;
}

server {
    listen 80;
    server_name other-site.com www.other-site.com;
    return 301 https://$host$request_uri;
}
```

**關鍵要點：**
- ✅ 多個 `server` 區塊可以同時 `listen 443`
- ✅ 每個區塊使用不同的 `server_name` 來區分網站
- ✅ 每個區塊需要對應的 SSL 憑證
- ✅ Nginx 會根據客戶端請求的主機名稱（透過 SNI）選擇正確的 `server` 區塊
- ✅ 不需要額外設定，SNI 是自動支援的

**使用 Cloudflare Origin Certificate（推薦）：**

如果使用 Cloudflare，可以申請 Origin Certificate 讓多個網域使用同一個憑證：

1. Cloudflare 儀表板 → SSL/TLS → Origin Server
2. 建立憑證，包含所有需要的網域：
   ```
   *.drserv.com.tw
   drserv.com.tw
   *.other-site.com
   other-site.com
   ```
3. 下載憑證和私鑰，在 Nginx 中所有網站共用這個憑證

**Linux 啟用站點：**
```bash
sudo ln -s /etc/nginx/sites-available/drserv /etc/nginx/sites-enabled/
sudo nginx -t  # 測試配置
sudo systemctl restart nginx
```

**Windows 啟動 Nginx：**
```powershell
cd C:\nginx
start nginx
```

### 選項 C：使用 Node.js 伺服器（簡易方案）

安裝 `serve`：

```powershell
npm install -g serve
```

啟動伺服器：

```powershell
cd C:\Web\drservWeb
serve -s dist -l 80
```

使用 PM2 保持運行（建議生產環境）：

```powershell
npm install -g pm2
pm2 serve dist 80 --spa --name drserv-web
pm2 startup  # 設定開機自動啟動
pm2 save
```

---

## 步驟三：防火牆端口轉發設定

> **💡 提示：多個網站共享 443 端口**
> 
> 如果您的伺服器上有多個網站需要 HTTPS，不需要為每個網站設定不同的外部端口。透過 SNI (Server Name Indication) 技術，多個網站可以共享同一個 443 端口，Web 伺服器會根據請求的主機名稱自動選擇正確的網站和 SSL 憑證。
> 
> 因此，**只需要設定一次端口轉發**（80 和 443），所有網站都可以使用。

### 🔧 多個服務共享 443 端口：防火牆層面的解決方案

#### 情境分析

**問題：** 防火牆端口轉發只能將外部端口映射到內部的一個 `IP:端口`，但多個服務都需要使用 443 端口，該如何處理？

**解決方案取決於服務部署位置：**

#### 方案 A：所有服務在同一台伺服器上（推薦）✅

**架構：**
```
網際網路 → 防火牆 (443) → 單一伺服器 (192.168.1.100:443) → Nginx/IIS → 多個網站（透過 SNI 區分）
```

**防火牆設定：**
- **只需要一個端口轉發規則**
- 外部端口 443 → 內部 IP `192.168.1.100:443`
- 所有網站共享這個端口轉發規則

**Web 伺服器設定：**
- 在 Nginx/IIS 中設定多個 `server` 區塊（每個對應不同主機名稱）
- 每個 `server` 區塊監聽相同的 443 端口
- 透過 `server_name` 和 SNI 自動區分不同網站

**優點：**
- ✅ 簡單：只需一個端口轉發規則
- ✅ 標準：符合 HTTPS 標準做法
- ✅ 安全：所有流量經過同一個入口點，易於管理

**範例設定：**

**防火牆端口轉發（只需設定一次）：**
```
外部端口 443 → 內部 192.168.1.100:443 (TCP)
外部端口 80  → 內部 192.168.1.100:80  (TCP)
```

**Nginx 配置（多個網站共享 443）：**
```nginx
# 網站 1
server {
    listen 443 ssl http2;
    server_name www.drserv.com.tw drserv.com.tw;
    ssl_certificate /path/to/drserv.crt;
    ssl_certificate_key /path/to/drserv.key;
    root /var/www/drserv;
    # ...
}

# 網站 2（共享 443 端口）
server {
    listen 443 ssl http2;
    server_name other-site.com www.other-site.com;
    ssl_certificate /path/to/other-site.crt;
    ssl_certificate_key /path/to/other-site.key;
    root /var/www/other-site;
    # ...
}
```

#### 方案 B：服務在不同伺服器上（使用反向代理）🔄

**架構：**
```
網際網路 → 防火牆 (443) → 反向代理伺服器 (192.168.1.100:443) 
    → 內部轉發到不同伺服器
        → 網站 A: 192.168.1.101:8080
        → 網站 B: 192.168.1.102:8080
        → API 服務: 192.168.1.103:3000
```

**防火牆設定：**
- **只需要一個端口轉發規則**
- 外部端口 443 → 反向代理伺服器 `192.168.1.100:443`

**反向代理設定（Nginx）：**

```nginx
# 反向代理伺服器 (192.168.1.100) 的配置

# 網站 A：drserv.com.tw
server {
    listen 443 ssl http2;
    server_name www.drserv.com.tw drserv.com.tw;
    
    ssl_certificate /path/to/drserv.crt;
    ssl_certificate_key /path/to/drserv.key;
    
    # 轉發到內部網站伺服器
    location / {
        proxy_pass http://192.168.1.101:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 網站 B：other-site.com
server {
    listen 443 ssl http2;
    server_name other-site.com www.other-site.com;
    
    ssl_certificate /path/to/other-site.crt;
    ssl_certificate_key /path/to/other-site.key;
    
    # 轉發到內部網站伺服器
    location / {
        proxy_pass http://192.168.1.102:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API 服務：api.drserv.com.tw
server {
    listen 443 ssl http2;
    server_name api.drserv.com.tw;
    
    ssl_certificate /path/to/api.crt;
    ssl_certificate_key /path/to/api.key;
    
    # 轉發到內部 API 伺服器
    location / {
        proxy_pass http://192.168.1.103:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**內部伺服器設定：**
- 內部伺服器不需要對外開放 443 端口
- 可以監聽任意內部端口（如 8080、3000 等）
- 不需要 SSL 憑證（反向代理處理 SSL 終止）

**優點：**
- ✅ 集中管理：所有 SSL 憑證在反向代理伺服器
- ✅ 安全性：內部服務不直接暴露
- ✅ 靈活性：內部服務可以任意變更端口
- ✅ 負載均衡：可以輕鬆添加多個後端伺服器

#### 方案 C：使用不同外部端口（不推薦）❌

**架構：**
```
網際網路 → 防火牆
    → 端口 443 → 伺服器 A (192.168.1.101:443)
    → 端口 8443 → 伺服器 B (192.168.1.102:443)
    → 端口 9443 → 伺服器 C (192.168.1.103:443)
```

**防火牆設定：**
```
外部端口 443  → 內部 192.168.1.101:443
外部端口 8443 → 內部 192.168.1.102:443
外部端口 9443 → 內部 192.168.1.103:443
```

**缺點：**
- ❌ 非標準端口：用戶需要輸入 `https://example.com:8443`
- ❌ 不專業：看起來不專業
- ❌ Cloudflare 限制：Cloudflare 免費方案不支援自訂端口
- ❌ 維護複雜：需要管理多個端口轉發規則

**僅適用於：**
- 內部測試環境
- 無法使用反向代理的情況
- 臨時解決方案

#### 方案 D：多個公網 IP（成本高）💰

**架構：**
```
公網 IP 1 → 防火牆 → 伺服器 A (443)
公網 IP 2 → 防火牆 → 伺服器 B (443)
公網 IP 3 → 防火牆 → 伺服器 C (443)
```

**缺點：**
- ❌ 成本高：需要多個公網 IP
- ❌ 複雜：需要管理多個 IP 和 DNS 記錄
- ❌ 不必要：通常不需要此方案

**僅適用於：**
- 需要完全隔離的服務
- 合規要求
- 特殊網路架構需求

---

### 📋 推薦方案選擇指南

| 情境 | 推薦方案 | 原因 |
|------|---------|------|
| 所有服務在同一台伺服器 | **方案 A** | 最簡單，標準做法 |
| 服務在不同伺服器，但可設定反向代理 | **方案 B** | 靈活、安全、易管理 |
| 服務在不同伺服器，無法設定反向代理 | **方案 C** | 臨時方案，不推薦 |
| 需要完全隔離的服務 | **方案 D** | 成本高，特殊需求 |

---

### 3.1 確認內部伺服器 IP

在伺服器上執行：

```powershell
ipconfig
```

記下 IPv4 位址，例如：`192.168.1.100`

### 3.2 路由器/防火牆設定

根據不同品牌的路由器，步驟略有不同。以下是通用步驟：

#### 一般路由器設定步驟：

1. **登入路由器管理介面**
   - 通常是 `192.168.1.1` 或 `192.168.0.1`
   - 輸入管理員帳號密碼

2. **找到端口轉發設定**
   - 常見名稱：虛擬伺服器、Port Forwarding、NAT 設定、埠轉發
   - 通常在「進階設定」或「網路設定」中

3. **新增轉發規則**

   **HTTP (必須)：**
   - **服務名稱**：HTTP 或 Web
   - **外部端口**：80
   - **內部 IP**：192.168.1.100（您的伺服器 IP）
   - **內部端口**：80
   - **協定**：TCP
   - **狀態**：啟用

   **HTTPS (建議)：**
   - **服務名稱**：HTTPS 或 Web Secure
   - **外部端口**：443
   - **內部 IP**：192.168.1.100
   - **內部端口**：443
   - **協定**：TCP
   - **狀態**：啟用

4. **儲存並套用設定**

#### 常見品牌路由器設定路徑：

- **TP-Link**：轉送 → 虛擬伺服器
- **ASUS**：WAN → 虛擬伺服器 / 端口轉發
- **D-Link**：進階 → 端口轉發
- **Zyxel**：網路設定 → NAT → 埠轉發
- **中華電信小烏龜**：進階設定 → NAT → 虛擬伺服器

### 3.3 Windows 防火牆設定

如果伺服器使用 Windows 防火牆，需要開放端口：

```powershell
# 以系統管理員身分執行 PowerShell

# 允許 HTTP (Port 80)
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# 允許 HTTPS (Port 443)
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

或透過圖形介面：
1. 控制台 → Windows Defender 防火牆 → 進階設定
2. 輸入規則 → 新增規則
3. 選擇「連接埠」→ TCP → 特定本機連接埠：80, 443
4. 動作：允許連線
5. 套用到所有設定檔
6. 命名並完成

### 3.4 測試端口轉發

1. **內部測試**（在同網路其他電腦）：
   ```
   http://192.168.1.100
   ```

2. **外部測試**：
   - 使用手機關閉 WiFi（使用 4G/5G）
   - 訪問：`http://您的公網IP`
   - 查詢公網 IP：https://ip.me

3. **端口檢查工具**：
   - https://www.yougetsignal.com/tools/open-ports/
   - https://portchecker.co/

---

## 步驟四：Cloudflare DNS 設定

### 4.1 註冊/登入 Cloudflare

1. 前往 https://dash.cloudflare.com/
2. 登入或註冊帳號（免費方案即可）

### 4.2 新增網站

1. 點擊「新增站台」
2. 輸入您的網域名稱：`drserv.com.tw`
3. 選擇「Free」方案
4. 點擊「繼續」

### 4.3 掃描 DNS 記錄

Cloudflare 會自動掃描現有 DNS 記錄，確認無誤後點擊「繼續」。

### 4.4 設定 DNS 記錄

新增或修改以下記錄：

#### A 記錄（IPv4）：

| 類型 | 名稱 | 內容 | Proxy 狀態 | TTL |
|------|------|------|-----------|-----|
| A | @ | 您的公網IP | 已代理（橘色雲朵） | 自動 |
| A | www | 您的公網IP | 已代理（橘色雲朵） | 自動 |

**說明：**
- `@` 代表根網域：`drserv.com.tw`
- `www` 代表：`www.drserv.com.tw`
- **已代理（橘色雲朵）**：流量經過 Cloudflare，啟用 CDN、DDoS 防護、SSL
- **DNS only（灰色雲朵）**：僅 DNS 解析，不經過 Cloudflare

**建議使用橘色雲朵（已代理）以享有完整保護。**

#### CNAME 記錄（若需要子網域）：

| 類型 | 名稱 | 目標 | Proxy 狀態 |
|------|------|------|-----------|
| CNAME | blog | drserv.com.tw | 已代理 |
| CNAME | shop | drserv.com.tw | 已代理 |

### 4.5 更改網域名稱伺服器

1. Cloudflare 會提供兩個 Nameserver，例如：
   ```
   amber.ns.cloudflare.com
   brad.ns.cloudflare.com
   ```

2. 前往您的網域註冊商（如 Hinet、Pchome、Gandi 等）
3. 找到網域管理 → DNS 設定或名稱伺服器設定
4. 將現有的名稱伺服器替換為 Cloudflare 提供的兩個
5. 儲存變更

**注意：DNS 變更需要 24-48 小時生效（通常幾小時內即可）。**

### 4.6 驗證 DNS 設定

等待幾分鐘後，在 Cloudflare 儀表板檢查狀態：
- ✅ 綠色勾號：DNS 已生效
- ⏳ 待處理：等待 DNS 傳播

或使用命令檢查：

```powershell
nslookup drserv.com.tw
nslookup www.drserv.com.tw
```

應該顯示 Cloudflare 的 IP（非您的原始 IP），例如：
```
104.21.x.x
172.67.x.x
```

---

## 步驟五：Cloudflare 額外功能設定

### 5.1 SSL/TLS 設定（必須）

1. **SSL/TLS** → **概觀**
2. 選擇加密模式：

   - **彈性**（Flexible）：訪客 ↔ Cloudflare 加密，Cloudflare ↔ 源伺服器未加密
     - ✅ 適合：源伺服器無 SSL 憑證
     - ⚠️ 安全性較低
   
   - **完整**（Full）：全程加密，但不驗證源伺服器憑證
     - ✅ 適合：使用自簽憑證或 Cloudflare Origin Certificate
   
   - **完整（嚴格）**（Full Strict）：全程加密，驗證源伺服器憑證
     - ✅ 最安全，適合有效 SSL 憑證

**建議：**
- 若源伺服器無 SSL：選擇「彈性」
- 若有 SSL：選擇「完整（嚴格）」

3. **啟用自動 HTTPS 重寫**
   - SSL/TLS → Edge Certificates → Always Use HTTPS：開啟
   - Automatic HTTPS Rewrites：開啟

### 5.2 速度優化設定

#### A. 快取設定

**快取** → **配置**
- **快取層級**：標準
- **瀏覽器快取 TTL**：4 hours（可調整）
- **Always Online**：開啟（源伺服器離線時顯示快取版本）

**快取規則**（Page Rules，免費方案 3 個規則）：

1. **快取所有靜態資源**
   - URL：`*drserv.com.tw/*.{js,css,jpg,jpeg,png,gif,ico,svg,woff,woff2}`
   - 設定：Cache Level = Cache Everything
   - Edge Cache TTL = 1 month

#### B. 效能設定

**速度** → **最佳化**
- **Auto Minify**：勾選 JavaScript、CSS、HTML
- **Brotli**：開啟
- **Rocket Loader**：關閉（可能與 React 衝突）
- **Early Hints**：開啟

#### C. HTTP/3 與 QUIC

**網路** → **HTTP/3 (with QUIC)**：開啟

### 5.3 安全性設定

#### A. 防火牆規則

**安全性** → **WAF** → **防火牆規則**

建議規則：
1. **阻擋惡意機器人**
   - 條件：Threat Score > 14
   - 動作：質詢（CAPTCHA）

2. **地理限制**（如需要）
   - 條件：國家/地區 不是 TW
   - 動作：質詢或阻擋

#### B. 安全性層級

**安全性** → **設定**
- **安全性層級**：中（預設）
- **Challenge Passage**：30 分鐘

#### C. Bot Fight Mode

**安全性** → **Bots**
- **Bot Fight Mode**：開啟（阻擋已知惡意機器人）

### 5.4 頁面規則優化（Page Rules）

**規則** → **頁面規則**（免費方案最多 3 個）

範例規則：

1. **根網域重新導向到 www**
   - URL：`drserv.com.tw/*`
   - 設定：Forwarding URL (301 永久重新導向)
   - 目標：`https://www.drserv.com.tw/$1`

2. **強制 HTTPS**
   - URL：`http://*drserv.com.tw/*`
   - 設定：Always Use HTTPS

3. **首頁快取**
   - URL：`www.drserv.com.tw/`
   - 設定：
     - Cache Level: Cache Everything
     - Edge Cache TTL: 2 hours

---

## 故障排除

### 問題 1：無法訪問網站（DNS 相關）

**症狀**：瀏覽器顯示「找不到伺服器」或「DNS_PROBE_FINISHED_NXDOMAIN」

**解決方案**：
1. 檢查 DNS 記錄是否正確設定
   ```powershell
   nslookup www.drserv.com.tw
   ```
2. 清除 DNS 快取：
   ```powershell
   ipconfig /flushdns
   ```
3. 等待 DNS 傳播（最多 48 小時）
4. 使用 DNS 檢查工具：https://dnschecker.org/

### 問題 2：可以訪問 IP 但網域無法訪問

**症狀**：`http://公網IP` 可訪問，但 `http://drserv.com.tw` 無法

**解決方案**：
- DNS 尚未生效，繼續等待
- 檢查 Cloudflare DNS 記錄是否指向正確 IP
- 確認網域名稱伺服器已更改為 Cloudflare

### 問題 3：顯示「連線逾時」或「無法連線」

**症狀**：網頁持續載入，最後顯示連線失敗

**解決方案**：
1. **檢查 Web 伺服器是否運行**
   ```powershell
   # IIS
   Get-Service W3SVC
   
   # Nginx (Windows)
   tasklist | findstr nginx
   
   # Node.js/PM2
   pm2 list
   ```

2. **檢查防火牆端口轉發**
   - 確認路由器設定正確
   - 測試端口是否開放：https://portchecker.co/

3. **檢查 Windows 防火牆**
   ```powershell
   Get-NetFirewallRule -DisplayName "Allow HTTP" | Select-Object DisplayName, Enabled
   ```

4. **檢查伺服器監聽端口**
   ```powershell
   netstat -ano | findstr :80
   netstat -ano | findstr :443
   ```

### 問題 4：HTTPS 顯示不安全或錯誤

**症狀**：瀏覽器顯示「不安全」或 SSL 錯誤

**解決方案**：
1. Cloudflare SSL/TLS 模式設為「彈性」或「完整」
2. 確認 Cloudflare DNS 為「已代理」（橘色雲朵）
3. 清除瀏覽器快取和 Cookie
4. 檢查 Cloudflare SSL/TLS 憑證狀態

### 問題 5：網站顯示空白或 404

**症狀**：網站載入但顯示空白頁或 404 錯誤

**解決方案**：
1. **檢查 dist 目錄內容**
   - 確認檔案已正確複製到 Web 伺服器
   - 確認 `index.html` 存在

2. **檢查 Web 伺服器配置**
   - IIS：確認預設文件包含 `index.html`
   - Nginx：確認 `root` 路徑正確
   - 檢查 SPA 路由重寫規則

3. **檢查檔案權限**（Linux）
   ```bash
   sudo chown -R www-data:www-data /var/www/drserv/dist
   sudo chmod -R 755 /var/www/drserv/dist
   ```

### 問題 6：Cloudflare 錯誤代碼

#### 502 Bad Gateway
- 源伺服器離線或無法訪問
- 檢查 Web 伺服器狀態
- 檢查防火牆設定

#### 520/521/522/523 錯誤
- 源伺服器回應異常
- 暫時將 DNS 改為「DNS only」（灰色雲朵）測試
- 檢查源伺服器日誌

#### 525 SSL Handshake Failed
- SSL/TLS 模式設定錯誤
- 建議改為「彈性」模式

### 問題 7：從內網無法訪問網域

**症狀**：外部可訪問，內網訪問網域失敗

**解決方案**：
1. **設定內網 DNS 劫持**（路由器）
   - 新增 DNS 記錄：`drserv.com.tw` → `192.168.1.100`

2. **修改 hosts 檔案**（Windows）
   - 編輯：`C:\Windows\System32\drivers\etc\hosts`
   - 新增：`192.168.1.100 www.drserv.com.tw drserv.com.tw`

3. **使用內網 IP 直接訪問**
   - `http://192.168.1.100`

### 問題 8：多個服務需要 443 端口衝突

**症狀：**
- 嘗試新增第二個服務時，發現 443 端口已被占用
- 防火牆端口轉發設定衝突
- 錯誤訊息：「端口已被使用」或「Address already in use」

**解決方案：**

#### 情境 1：服務在同一台伺服器

**問題：** 多個服務都想監聽 443 端口

**解決：** 使用 SNI 讓多個服務共享 443 端口
- 在 Nginx/IIS 中設定多個 `server` 區塊
- 每個區塊監聽相同的 443 端口
- 透過 `server_name` 區分不同服務
- **防火牆只需要一個端口轉發規則**（443 → 伺服器 IP:443）

**檢查方法：**
```powershell
# 檢查哪些進程占用 443 端口
netstat -ano | findstr :443

# 查看 Nginx 配置是否正確
nginx -t  # Linux
# 或檢查 nginx.conf 檔案
```

#### 情境 2：服務在不同伺服器

**問題：** 多個伺服器都需要對外提供 HTTPS 服務

**解決：** 使用反向代理（推薦）
- 設定一台反向代理伺服器（如 Nginx）
- 防火牆端口轉發：443 → 反向代理伺服器 IP:443
- 反向代理根據主機名稱轉發到不同的內部伺服器
- 內部伺服器可以使用任意端口（如 8080、3000 等）

**替代方案：** 使用不同外部端口（不推薦）
- 服務 A：外部 443 → 內部伺服器 A:443
- 服務 B：外部 8443 → 內部伺服器 B:443
- 服務 C：外部 9443 → 內部伺服器 C:443

#### 情境 3：端口轉發規則衝突

**問題：** 路由器不允許多個規則使用相同的外部端口

**解決：** 這是正常行為，應該使用方案 1 或方案 2
- ✅ **正確做法**：只設定一個 443 端口轉發規則，在 Web 伺服器層面使用 SNI
- ❌ **錯誤做法**：嘗試設定多個 443 端口轉發規則（不可能）

**驗證 SNI 是否正常工作：**
```powershell
# 使用 OpenSSL 測試 SNI
openssl s_client -connect www.drserv.com.tw:443 -servername www.drserv.com.tw

# 應該顯示正確的 SSL 憑證資訊
```

**Nginx 檢查多個 server 區塊：**
```bash
# 檢查配置
nginx -t

# 查看所有監聽 443 的 server 區塊
grep -r "listen 443" /etc/nginx/

# 重載配置
nginx -s reload
```

---

## 📝 部署檢查清單

完成以下所有項目以確保部署成功：

### 建置與伺服器
- [ ] 執行 `npm run build` 成功
- [ ] dist 目錄檔案正確
- [ ] Web 伺服器已安裝並設定
- [ ] Web 伺服器正在運行
- [ ] SPA 路由重寫規則已設定
- [ ] 內網可訪問（`http://192.168.1.100`）

### 防火牆與網路
- [ ] 路由器端口轉發已設定（80, 443）
- [ ] Windows 防火牆已開放端口
- [ ] 外網可訪問（`http://公網IP`）
- [ ] 公網 IP 已記錄

### Cloudflare DNS
- [ ] Cloudflare 帳號已註冊
- [ ] 網站已新增到 Cloudflare
- [ ] A 記錄已設定（@ 和 www）
- [ ] DNS 記錄狀態為「已代理」（橘色雲朵）
- [ ] 網域名稱伺服器已更改
- [ ] DNS 驗證成功

### Cloudflare 功能
- [ ] SSL/TLS 模式已設定
- [ ] Always Use HTTPS 已開啟
- [ ] Auto Minify 已啟用
- [ ] Brotli 已開啟
- [ ] 快取規則已設定
- [ ] 防火牆規則已設定（選配）

### 測試
- [ ] 內網測試成功
- [ ] 外網測試成功（使用 4G/5G）
- [ ] HTTPS 正常運作
- [ ] 網域訪問成功（`https://www.drserv.com.tw`）
- [ ] 子頁面路由正常
- [ ] 手機裝置測試正常

---

## 🎉 部署完成！

如果所有檢查項目都已完成，您的網站應該已經成功部署並可以透過以下網址訪問：

- **HTTP**：http://www.drserv.com.tw
- **HTTPS**：https://www.drserv.com.tw

### 後續維護

**定期更新：**
```powershell
cd C:\Web\drservWeb
git pull  # 如果使用 Git
npm install  # 更新依賴
npm run build  # 重新建置
# 複製 dist 到 Web 伺服器目錄
```

**監控與日誌：**
- Cloudflare Analytics：查看流量和威脅
- Web 伺服器日誌：排查問題
- 正常運行時間監控：使用 UptimeRobot 或 Pingdom

**安全更新：**
```powershell
npm audit  # 檢查安全漏洞
npm audit fix  # 自動修復
npm update  # 更新依賴套件
```

---

## 📚 參考資源

- [Cloudflare 官方文檔](https://developers.cloudflare.com/)
- [Nginx 文檔](https://nginx.org/en/docs/)
- [IIS 文檔](https://learn.microsoft.com/en-us/iis/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [React 部署文檔](https://react.dev/learn/start-a-new-react-project#deploying-to-production)

---

## 🆘 需要幫助？

如果遇到任何問題，請檢查：
1. 本文檔的「故障排除」章節
2. Web 伺服器錯誤日誌
3. Cloudflare 儀表板的「分析」和「活動」
4. 使用線上診斷工具（如 pingtest、traceroute）

祝部署順利！🚀
