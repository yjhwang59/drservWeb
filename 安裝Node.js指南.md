# Node.js 安裝指南

## 方法一：自動下載安裝程式（推薦）

### Windows 系統

1. **下載 Node.js LTS 版本**
   - 訪問：https://nodejs.org/zh-tw/download/
   - 點擊「Windows Installer (.msi)」下載 LTS 版本（建議 20.x）

2. **執行安裝程式**
   - 雙擊下載的 `.msi` 檔案
   - 按照安裝精靈指示完成安裝（全部使用預設選項即可）
   - **重要**：確保勾選「Add to PATH」選項

3. **驗證安裝**
   - 重新開啟 PowerShell 或命令提示字元
   - 執行以下命令：
     ```powershell
     node --version
     npm --version
     ```
   - 應該會顯示版本號（例如：v20.10.0）

## 方法二：使用 Chocolatey（如果已安裝）

如果您已安裝 Chocolatey 套件管理器：

```powershell
choco install nodejs-lts
```

## 方法三：使用 Winget（Windows 11）

```powershell
winget install OpenJS.NodeJS.LTS
```

## 安裝完成後的步驟

1. **重新開啟終端機**（重要！）
   - 關閉當前的 PowerShell/命令提示字元
   - 重新開啟新的終端機視窗

2. **驗證安裝**
   ```powershell
   node --version
   npm --version
   ```

3. **安裝專案依賴**
   ```powershell
   cd c:\Web\drservWeb
   npm install
   ```

4. **啟動開發伺服器**
   ```powershell
   npm run dev
   ```

## 常見問題

### Q: 安裝後仍然顯示「找不到 node」？

**A:** 
- 確認已重新開啟終端機
- 檢查環境變數 PATH 是否包含 Node.js 安裝路徑
- 嘗試重新啟動電腦

### Q: npm install 很慢？

**A:**
- 使用國內鏡像源：
  ```powershell
  npm config set registry https://registry.npmmirror.com
  ```

### Q: 權限錯誤？

**A:**
- 以系統管理員身份執行 PowerShell
- 或使用 `npm install --global` 時需要管理員權限

## 快速測試

安裝完成後，在專案目錄執行：

```powershell
npm install
npm run dev
```

瀏覽器會自動開啟 `http://localhost:5173`，您就可以看到完整的網站了！

