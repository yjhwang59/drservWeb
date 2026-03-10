@echo off
cd /d "%~dp0"
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

echo.
echo ╔══════════════════════════════════════════════╗
echo ║   DrServ 部署與測試工具                      ║
echo ╚══════════════════════════════════════════════╝
echo.
echo   [1] 部署到正式環境（git push → Cloudflare）
echo   [2] 測試正式環境 Email 寄送
echo   [3] 查看正式環境 D1 最新洽詢
echo   [4] 完整流程（部署 + 等待 + 測試）
echo   [5] 檢查環境設定指引
echo   [0] 離開
echo.

set /p choice="請輸入選項 [0-5]: "

if "%choice%"=="1" goto :DEPLOY
if "%choice%"=="2" goto :TEST_EMAIL
if "%choice%"=="3" goto :CHECK_DB
if "%choice%"=="4" goto :FULL_FLOW
if "%choice%"=="5" goto :CHECK_ENV
if "%choice%"=="0" goto :EXIT
echo [錯誤] 無效選項
goto :EXIT

REM ===================================================
:DEPLOY
REM ===================================================
echo.
echo ── 步驟 1：檢查變更 ──
echo.
git status --short
echo.
git diff --stat HEAD
echo.

set /p confirm="確認要部署以上變更？(y/n): "
if /i not "%confirm%"=="y" (
    echo 已取消。
    goto :EXIT
)

echo.
echo ── 步驟 2：提交變更 ──
set /p msg="Commit 訊息（直接 Enter 用預設）: "
if "%msg%"=="" set msg=fix: update email config and add logging

git add -A
git commit -m "%msg%"
if errorlevel 1 (
    echo [提示] 無新變更，直接推送...
)

echo.
echo ── 步驟 3：推送到 GitHub ──
git push origin main
if errorlevel 1 (
    echo [錯誤] git push 失敗。
    pause
    goto :EXIT
)

echo.
echo ══════════════════════════════════════════════
echo   已推送！GitHub Actions 正在部署...
echo.
echo   部署狀態：https://github.com/yjhwang59/drservWeb/actions
echo   部署通常需 1~3 分鐘，完成後執行選項 [2] 測試。
echo ══════════════════════════════════════════════
echo.
pause
goto :EXIT

REM ===================================================
:TEST_EMAIL
REM ===================================================
echo.
echo ── 測試正式環境 Email ──
echo.

curl -s -X POST https://www.drserv.com.tw/api/inquiry ^
  -H "Content-Type: application/json" ^
  -d @test-payload.json

echo.
echo.
echo   emailSent: true  = 成功
echo   emailSent: false = 失敗（見下方排查步驟）
echo.
echo   排查：Cloudflare Dashboard → Workers → drserv → Logs
echo.
pause
goto :EXIT

REM ===================================================
:CHECK_DB
REM ===================================================
echo.
echo ── 查詢正式環境 D1 最新 5 筆洽詢 ──
echo.
call npx wrangler d1 execute myd1_db --remote --command="SELECT id, organization, contact_name, email, inquiry_type, created_at FROM inquiries ORDER BY id DESC LIMIT 5;"
echo.
pause
goto :EXIT

REM ===================================================
:FULL_FLOW
REM ===================================================
echo.
echo ══════════════════════════════════════════
echo   完整流程：部署 → 等待 → 測試
echo ══════════════════════════════════════════
echo.

echo ── [1/3] 部署 ──
git status --short
echo.
set /p confirm2="確認要部署？(y/n): "
if /i not "%confirm2%"=="y" (
    echo 已取消。
    goto :EXIT
)

set /p msg2="Commit 訊息（Enter 用預設）: "
if "%msg2%"=="" set msg2=fix: update email config and add logging

git add -A
git commit -m "%msg2%"
git push origin main
if errorlevel 1 (
    echo [錯誤] 推送失敗。
    pause
    goto :EXIT
)

echo.
echo ── [2/3] 等待部署（約 2 分鐘）──
echo   即時狀態：https://github.com/yjhwang59/drservWeb/actions
echo.

for /L %%i in (1,1,12) do (
    set /a remaining=120-%%i*10
    echo   等待中... 剩餘約 !remaining! 秒
    timeout /t 10 /nobreak >nul
)

echo.
echo ── [3/3] 發送測試洽詢 ──
echo.

curl -s -X POST https://www.drserv.com.tw/api/inquiry ^
  -H "Content-Type: application/json" ^
  -d @test-payload.json

echo.
echo.
echo ══════════════════════════════════════════
echo   完整流程結束！
echo   請檢查 yjhwang@drserv.com.tw 是否收到信。
echo   若沒收到 → Cloudflare Dashboard → Workers → Logs
echo ══════════════════════════════════════════
echo.
pause
goto :EXIT

REM ===================================================
:CHECK_ENV
REM ===================================================
echo.
echo ══════════════════════════════════════════
echo   Cloudflare Worker 環境變數設定指引
echo ══════════════════════════════════════════
echo.
echo   請到 Cloudflare Dashboard 設定以下環境變數：
echo.
echo   路徑：Workers ^& Pages → drserv → Settings → Variables and Secrets
echo.
echo   ┌───────────────────┬────────────────────────────────┬──────────┐
echo   │ 變數名             │ 值                             │ Encrypt  │
echo   ├───────────────────┼────────────────────────────────┼──────────┤
echo   │ RESEND_API_KEY    │ re_xxxx...（從 Resend 取得）    │ 是       │
echo   │ MAIL_RECIPIENT    │ yjhwang@drserv.com.tw          │ 否       │
echo   └───────────────────┴────────────────────────────────┴──────────┘
echo.
echo   另外確認 Resend 網域驗證：
echo   https://resend.com/domains → drserv.com.tw 須為 Verified
echo.
echo   設定完成後，需重新部署才會生效（選項 [1]）。
echo.
pause
goto :EXIT

REM ===================================================
:EXIT
REM ===================================================
echo.
endlocal
