@echo off
cd /d "%~dp0"

REM 이미 3030 포트가 사용 중이면 브라우저만 열기
netstat -ano | findstr ":3030.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    start http://localhost:3030
    exit
)

REM 서버가 꺼져있으면 백그라운드로 시작 후 브라우저 열기
start "" cmd /c "cd /d "%~dp0" && npm run dev"
timeout /t 4 >nul
start http://localhost:3030
