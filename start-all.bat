@echo off
echo Starting Frontend and Backend...
echo.

start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak >nul
start "Backend" cmd /k "cd backend && npm run dev"

echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo Press any key to close all windows...
pause >nul
taskkill /FI "WINDOWTITLE eq Frontend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend*" /F >nul 2>&1
