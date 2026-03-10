@echo off
cd /d "%~dp0"
setlocal EnableDelayedExpansion

echo ========================================
echo   DrServ - Backend + Frontend Launcher
echo ========================================
echo.

REM --- Check Node.js ---
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Please install Node.js and add it to PATH.
    echo See: 安裝Node.js指南.md
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js / npm found.

REM --- Check server folder ---
if not exist "%~dp0server" (
    echo [ERROR] Folder "server" not found.
    pause
    exit /b 1
)
echo [OK] Server folder exists.

REM --- Install dependencies if missing ---
if not exist "%~dp0node_modules" (
    echo.
    echo [Frontend] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed.
)

if not exist "%~dp0server\node_modules" (
    echo.
    echo [Backend] Installing dependencies...
    cd /d "%~dp0server"
    call npm install
    if errorlevel 1 (
        echo [ERROR] Backend npm install failed.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
    echo [OK] Backend dependencies installed.
)

echo.
echo [1/2] Starting backend API...
start "DrServ-Backend" /d "%~dp0server" cmd /k "npm run start || echo Backend exited with error. Check message above. && pause"

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend...
start "DrServ-Frontend" /d "%~dp0" cmd /k "npm run dev || echo Frontend exited with error. && pause"

echo.
echo Two windows opened: Backend API and Frontend dev server.
echo   Frontend: http://localhost:3000  (open in browser)
echo   Backend API: http://localhost:3001  (health: http://localhost:3001/api/health)
echo.
echo If backend is not responding, check the "DrServ-Backend" window for errors.
echo Then in the server folder run: npm install
echo.
pause
