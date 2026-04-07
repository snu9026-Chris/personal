@echo off
cd /d "%~dp0"

REM 이미 3030 포트가 사용 중이면 브라우저만 열기
netstat -ano | findstr ":3030.*LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo 서버가 이미 실행 중입니다. 브라우저를 엽니다.
    start http://localhost:3030
    timeout /t 2 >nul
    exit
)

echo 서버를 시작합니다...
start /b cmd /c "timeout /t 4 >nul && start http://localhost:3030"
npm run dev
pause
