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

rem Verificar pré-requisitos (Node, npm, Docker/Compose)
call :ensure_prereqs
if %errorlevel% neq 0 (
    pause
    goto menu
)

rem Verificar e instalar dependências
call :check_and_install_dependencies
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências
    pause
    goto menu
)

echo [1/4] Iniciando base de dados PostgreSQL...
if "%DOCKER_AVAILABLE%"=="1" (
    %COMPOSE_CMD% -f docker-compose.dev.yml up -d
    if %errorlevel% neq 0 (
        echo ❌ Erro ao iniciar PostgreSQL
        pause
        goto menu
    )
    echo ✅ PostgreSQL iniciado com sucesso!
) else (
    echo ❌ Docker/Compose nao encontrado. Base de dados via Docker nao sera iniciada.
    echo    -> Instala Docker Desktop ou inicia a tua BD localmente (porta 5433)
)
echo.

echo [2/4] Aguardando PostgreSQL estar pronto...
timeout /t 5 /nobreak >nul
echo ✅ PostgreSQL pronto!
echo.

echo [3/4] Iniciando servidor backend...
start /min "Backend Server" cmd /k "cd server && npm run dev"
echo ✅ Servidor backend iniciado em http://localhost:5000
echo.

echo [4/4] Iniciando cliente frontend...
start /min "Frontend Client" cmd /k "cd client && npm run dev"
echo ✅ Cliente frontend iniciado
echo.

echo ========================================
echo    PROJETO INICIADO COM SUCESSO!
echo ========================================
echo.
echo 🔧 Backend:  http://localhost:5000
echo 🗄️  Database: localhost:5433
echo.
echo Aguardando frontend estar pronto...
timeout /t 5 /nobreak >nul

rem Tentar detectar a porta do frontend automaticamente
set "FRONTEND_PORT=3003"
echo Tentando conectar ao frontend na porta %FRONTEND_PORT%...
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend detectado na porta %FRONTEND_PORT%
    set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%"
) else (
    echo ⚠️  Frontend nao encontrado na porta %FRONTEND_PORT%
    echo.
    echo Portas comuns do Vite: 3000, 3001, 3002, 3003, 5173, 4173
    echo.
    set /p FRONTEND_PORT="Insere a porta do frontend (ou Enter para 3003): "
    if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=3003"
    set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%"
)

echo.
echo 🌐 Frontend: %FRONTEND_URL%
echo.
echo Abrindo frontend no browser...
start %FRONTEND_URL%
echo ✅ Frontend aberto no browser!
echo.
echo ✅ Projeto iniciado com sucesso! Fechando janela...
timeout /t 2 /nobreak >nul
exit

:stop
cls
echo ========================================
echo    PARANDO PROJETO INSTRUCTIONS
echo ========================================
echo.

echo [1/3] Parando containers Docker...
call :detect_docker
if "%DOCKER_AVAILABLE%"=="1" (
    %COMPOSE_CMD% -f docker-compose.dev.yml down
    echo ✅ Containers Docker parados
) else (
    echo ⚠️  Docker/Compose nao encontrado. Nada para parar via Docker.
)
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
call :detect_docker >nul 2>&1
if "%DOCKER_AVAILABLE%"=="1" (
    docker ps --filter "name=instructions-project-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
) else (
    echo ⚠️  Docker nao encontrado. Saltando verificacao de containers.
)
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

rem =====================
rem Verificação e instalação de dependências
rem =====================

:check_and_install_dependencies
echo ========================================
echo    VERIFICANDO DEPENDÊNCIAS
echo ========================================
echo.

echo [1/3] Verificando dependências do servidor...
cd /d "%~dp0server"
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado no servidor. Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências do servidor
        exit /b 1
    )
    echo ✅ Dependências do servidor instaladas com sucesso!
) else (
    echo ✅ Dependências do servidor já instaladas
)
echo.

echo [2/3] Verificando dependências do cliente...
cd /d "%~dp0client"
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado no cliente. Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências do cliente
        exit /b 1
    )
    echo ✅ Dependências do cliente instaladas com sucesso!
) else (
    echo ✅ Dependências do cliente já instaladas
)
echo.

echo [3/3] Verificação de dependências concluída!
echo ✅ Todas as dependências estão prontas
echo.
exit /b 0

rem =====================
rem Utilitarios e checks
rem =====================

:ensure_prereqs
rem Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado.
    echo    -> Instala o Node.js LTS de https://nodejs.org/en/download
    exit /b 1
)
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm nao encontrado no PATH.
    echo    -> Reinstala o Node.js ou adiciona a pasta do npm ao PATH.
    exit /b 1
)

rem Docker/Compose (opcional mas recomendado para a BD)
call :detect_docker
exit /b 0

:detect_docker
set "DOCKER_AVAILABLE=0"
set "COMPOSE_CMD=docker compose"
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    docker compose version >nul 2>&1
    if %errorlevel% equ 0 (
        set "DOCKER_AVAILABLE=1"
        exit /b 0
    ) else (
        where docker-compose >nul 2>&1
        if %errorlevel% equ 0 (
            set "DOCKER_AVAILABLE=1"
            set "COMPOSE_CMD=docker-compose"
            exit /b 0
        )
    )
)
exit /b 1