@echo off
cd /d "%~dp0"
echo Starting Personal Management dev server on http://localhost:3030
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
