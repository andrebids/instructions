@echo off
title Project Manager - Instructions
color 0A

:menu
cls
echo ========================================
echo    PROJECT MANAGER - INSTRUCTIONS
echo ========================================
echo.
echo 1. 🚀 INICIAR PROJETO
echo 2. 🛑 PARAR PROJETO  
echo 3. 📊 VERIFICAR STATUS
echo 4. 🔄 REINICIAR PROJETO
echo 5. ❌ SAIR
echo.
echo ========================================
set /p choice="Escolha uma opção (1-5): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto status
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto exit
goto menu

:start
cls
echo ========================================
echo    INICIANDO PROJETO INSTRUCTIONS
echo ========================================
echo.

echo [1/4] Iniciando base de dados PostgreSQL...
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo ❌ Erro ao iniciar PostgreSQL
    pause
    goto menu
)
echo ✅ PostgreSQL iniciado com sucesso!
echo.

echo [2/4] Aguardando PostgreSQL estar pronto...
timeout /t 5 /nobreak >nul
echo ✅ PostgreSQL pronto!
echo.

echo [3/4] Iniciando servidor backend...
start "Backend Server" cmd /k "cd server && npm run dev"
echo ✅ Servidor backend iniciado em http://localhost:5000
echo.

echo [4/4] Iniciando cliente frontend...
start "Frontend Client" cmd /k "cd client && npm run dev"
echo ✅ Cliente frontend iniciado em http://localhost:3003
echo.

echo ========================================
echo    PROJETO INICIADO COM SUCESSO!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3003
echo 🔧 Backend:  http://localhost:5000
echo 🗄️  Database: localhost:5433
echo.
pause
goto menu

:stop
cls
echo ========================================
echo    PARANDO PROJETO INSTRUCTIONS
echo ========================================
echo.

echo [1/3] Parando containers Docker...
docker-compose -f docker-compose.dev.yml down
echo ✅ Containers Docker parados
echo.

echo [2/3] Parando processos Node.js...
taskkill /f /im node.exe 2>nul
echo ✅ Processos Node.js parados
echo.

echo [3/3] Limpando processos restantes...
taskkill /f /im nodemon.exe 2>nul
echo ✅ Processos de desenvolvimento parados
echo.

echo ========================================
echo    PROJETO PARADO COM SUCESSO!
echo ========================================
echo.
pause
goto menu

:status
cls
echo ========================================
echo    STATUS DO PROJETO INSTRUCTIONS
echo ========================================
echo.

echo [1/3] Verificando PostgreSQL...
docker ps --filter "name=instructions-project-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [2/3] Verificando processos Node.js...
tasklist /fi "imagename eq node.exe" 2>nul | findstr node.exe
if %errorlevel% neq 0 (
    echo ❌ Nenhum processo Node.js encontrado
) else (
    echo ✅ Processos Node.js ativos
)
echo.

echo [3/3] Testando conectividade...
echo Testando backend...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend: http://localhost:5000 - ONLINE
) else (
    echo ❌ Backend: http://localhost:5000 - OFFLINE
)

echo Testando frontend...
curl -s http://localhost:3003 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend: http://localhost:3003 - ONLINE
) else (
    echo ❌ Frontend: http://localhost:3003 - OFFLINE
)
echo.

echo ========================================
echo    VERIFICAÇÃO CONCLUÍDA
echo ========================================
echo.
pause
goto menu

:restart
cls
echo ========================================
echo    REINICIANDO PROJETO INSTRUCTIONS
echo ========================================
echo.

echo [1/2] Parando projeto atual...
call :stop
echo.

echo [2/2] Iniciando projeto novamente...
call :start
goto menu

:exit
cls
echo ========================================
echo    OBRIGADO POR USAR PROJECT MANAGER!
echo ========================================
echo.
echo Projeto Instructions - Gerido com sucesso
echo.
timeout /t 2 /nobreak >nul
exit
