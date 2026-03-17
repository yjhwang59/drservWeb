# 捨得資訊網站開發伺服器自動啟動腳本
# 設定開機自動啟動此腳本即可自動啟動開發伺服器

# 設定工作目錄
$projectPath = "C:\Web\drservWeb"

# 檢查目錄是否存在
if (-not (Test-Path $projectPath)) {
    Write-Host "錯誤：專案目錄不存在：$projectPath" -ForegroundColor Red
    exit 1
}

# 切換到專案目錄
Set-Location $projectPath

# 檢查 Node.js 是否安裝
try {
    $nodeVersion = node --version
    Write-Host "Node.js 版本：$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "錯誤：未找到 Node.js，請先安裝 Node.js" -ForegroundColor Red
    exit 1
}

# 檢查依賴是否安裝
if (-not (Test-Path "$projectPath\node_modules")) {
    Write-Host "正在安裝依賴..." -ForegroundColor Yellow
    npm install
}

# 啟動開發伺服器
Write-Host "正在啟動開發伺服器..." -ForegroundColor Green
Write-Host "網站將在 http://localhost:3520 啟動" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 可停止伺服器" -ForegroundColor Yellow
Write-Host ""

# 啟動開發伺服器
npm run dev



