@echo off
echo ==========================================
echo   Sound Ledger - Iniciando...
echo ==========================================

echo Encerrando processos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Iniciando Backend (porta 3001)...
start "Sound Ledger Backend" cmd /k "cd /d "%~dp0" && node server.js"

timeout /t 5 /nobreak >nul

echo Iniciando Frontend (porta 3000)...
start "Sound Ledger Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul

echo Abrindo navegador...
start http://localhost:3000

echo.
echo ==========================================
echo   Sound Ledger rodando!
echo   Backend:  http://localhost:3001/api/health
echo   Frontend: http://localhost:3000
echo ==========================================
