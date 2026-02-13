@echo off
REM 捨得資訊網站開發伺服器自動啟動批次檔
REM 設定開機自動啟動此檔案即可自動啟動開發伺服器

cd /d C:\Web\drservWeb
start "捨得資訊開發伺服器" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0start-dev-server.ps1"



