@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo.
echo ══════════════════════════════════════
echo   測試正式環境 Email 寄送
echo   目標：https://www.drserv.com.tw
echo ══════════════════════════════════════
echo.

curl -s -X POST https://www.drserv.com.tw/api/inquiry ^
  -H "Content-Type: application/json" ^
  -d @test-payload.json

echo.
echo.
echo ──────────────────────────────
echo   emailSent: true  = Email 寄送成功
echo   emailSent: false = Email 寄送失敗
echo.
echo   若失敗，請檢查：
echo   1. Cloudflare Worker 是否有設定 RESEND_API_KEY
echo   2. MAIL_RECIPIENT 是否設為 yjhwang@drserv.com.tw
echo   3. Resend 平台 drserv.com.tw 網域是否已驗證
echo   4. Cloudflare Dashboard → Workers → drserv → Logs
echo ──────────────────────────────
echo.
pause
