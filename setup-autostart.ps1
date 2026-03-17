# 設定開機自動啟動開發伺服器的 PowerShell 腳本
# 以系統管理員權限執行此腳本即可完成設定

Write-Host "正在設定開機自動啟動..." -ForegroundColor Green

# 取得啟動資料夾路徑
$startupPath = [Environment]::GetFolderPath("Startup")
$scriptPath = "C:\Web\drservWeb\start-dev-server.bat"
$shortcutPath = Join-Path $startupPath "捨得資訊開發伺服器.lnk"

# 檢查腳本是否存在
if (-not (Test-Path $scriptPath)) {
    Write-Host "錯誤：找不到啟動腳本：$scriptPath" -ForegroundColor Red
    exit 1
}

# 建立捷徑
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $scriptPath
$Shortcut.WorkingDirectory = "C:\Web\drservWeb"
$Shortcut.Description = "捨得資訊網站開發伺服器"
$Shortcut.Save()

Write-Host "✓ 已建立啟動捷徑：$shortcutPath" -ForegroundColor Green
Write-Host ""
Write-Host "設定完成！重新開機後開發伺服器會自動啟動。" -ForegroundColor Cyan
Write-Host "網站將在 http://localhost:3520 啟動" -ForegroundColor Yellow
Write-Host ""
Write-Host "如需移除自動啟動，請刪除：" -ForegroundColor Gray
Write-Host "  $shortcutPath" -ForegroundColor Gray



