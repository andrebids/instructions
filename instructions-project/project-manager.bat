@echo off
title Project Manager - TheCore
color 0A

:menu
cls
echo ========================================
echo    PROJECT MANAGER - THECORE
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
echo    INICIANDO PROJETO THECORE
echo ========================================
echo.

rem Parar rapidamente processos/portas antes de iniciar
call :stop_quick

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

rem Garantir que estamos na raiz do projeto antes de comandos subsequentes
cd /d "%~dp0"

echo [1/4] Iniciando base de dados PostgreSQL...
if "%DOCKER_AVAILABLE%"=="1" (
    %COMPOSE_CMD% -f "%~dp0docker-compose.dev.yml" up -d
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

echo [2/5] Aguardando PostgreSQL estar pronto...
timeout /t 5 /nobreak >nul
echo ✅ PostgreSQL pronto!
echo.

echo [3/5] Executando setup da base de dados (migrations)...
cd /d "%~dp0server"
echo    Executando migrations e verificando schema...
call npm run setup
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: Setup pode ter encontrado problemas, mas continuando...
    echo    Se houver erros, execute manualmente: cd server ^&^& npm run setup
) else (
    echo ✅ Setup da base de dados concluído!
)
echo.

echo [4/5] Iniciando servidor backend...
start /min "Backend Server" cmd /k cd /d "%~dp0server" ^&^& npm run dev
echo ✅ Servidor backend iniciado em http://localhost:5000
echo.

echo [5/5] Iniciando cliente frontend...
start /min "Frontend Client" cmd /k cd /d "%~dp0client" ^&^& npm run dev
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
timeout /t 7 /nobreak >nul

rem Tentar detectar automaticamente o frontend em portas comuns do Vite
set "FRONTEND_PORT="
for %%P in (3003 5173 4173 3000 3001 3002 3005) do (
    curl -s http://localhost:%%P >nul 2>&1
    if not errorlevel 1 (
        set "FRONTEND_PORT=%%P"
        goto frontend_found
    )
)

echo ⚠️  Frontend nao detectado automaticamente.
echo.
echo Portas comuns do Vite: 3003, 5173, 4173, 3000, 3001, 3002, 3005
echo.
set /p FRONTEND_PORT="Insere a porta do frontend (ou Enter para 3003): "
if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=3003"
goto frontend_set

:frontend_found
echo ✅ Frontend detectado na porta %FRONTEND_PORT%

:frontend_set
set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%"

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
echo    PARANDO PROJETO THECORE
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
echo    STATUS DO PROJETO THECORE
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
echo    REINICIANDO PROJETO THECORE
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
echo Projeto TheCore - Gerido com sucesso
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
set "NEED_INSTALL=0"
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado no cliente. Instalando dependências...
    set "NEED_INSTALL=1"
) else (
    rem Verificar se dependências críticas estão instaladas
    if not exist "node_modules\@clerk\clerk-react" (
        echo ⚠️  @clerk/clerk-react não encontrado. Reinstalando dependências...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\three" (
        echo ⚠️  three não encontrado. Reinstalando dependências...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\react" (
        echo ⚠️  react não encontrado. Reinstalando dependências...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\vite" (
        echo ⚠️  vite não encontrado. Reinstalando dependências...
        set "NEED_INSTALL=1"
    )
    rem Verificar também outras dependências críticas do projeto
    if not exist "node_modules\react-router-dom" (
        echo ⚠️  react-router-dom não encontrado. Reinstalando dependências...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\@heroui\react" (
        echo ⚠️  @heroui/react não encontrado. Reinstalando dependências...
        set "NEED_INSTALL=1"
    )
)

if "%NEED_INSTALL%"=="1" (
    if exist "package-lock.json" (
        echo 🔄 Instalando dependências do cliente com npm ci...
        npm ci
        if %errorlevel% neq 0 (
            echo ⚠️  npm ci falhou, tentando npm install...
            npm install
        )
    ) else (
        echo 🔄 Instalando dependências do cliente com npm install...
        npm install
    )
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências do cliente
        echo    -> Tente executar manualmente: cd client ^&^& npm install
        exit /b 1
    )
    echo ✅ Dependências do cliente instaladas com sucesso!
    rem Verificar novamente após instalação
    if not exist "node_modules\@clerk\clerk-react" (
        echo ❌ AVISO: @clerk/clerk-react ainda não foi instalado após npm install
        echo    -> Execute manualmente: cd client ^&^& npm install @clerk/clerk-react
    )
    if not exist "node_modules\three" (
        echo ❌ AVISO: three ainda não foi instalado após npm install
        echo    -> Execute manualmente: cd client ^&^& npm install three
    )
) else (
    echo ✅ Dependências do cliente já instaladas
)
echo.

 rem Aviso de variável Vite Clerk
 if not exist ".env" (
     echo ⚠️  Arquivo .env nao encontrado em client. Defina VITE_CLERK_PUBLISHABLE_KEY
 ) else (
     findstr /B /C:"VITE_CLERK_PUBLISHABLE_KEY=" ".env" >nul
     if errorlevel 1 (
         echo ⚠️  VITE_CLERK_PUBLISHABLE_KEY nao definida em client\.env
     ) else (
         echo ✅ VITE_CLERK_PUBLISHABLE_KEY detectada
     )
 )

echo [3/3] Verificação de dependências concluída!
echo ✅ Todas as dependências estão prontas
echo.
exit /b 0

rem =====================
rem Paragem rápida (silenciosa) para reinício
rem =====================

:stop_quick
call :detect_docker >nul 2>&1
if "%DOCKER_AVAILABLE%"=="1" (
    %COMPOSE_CMD% -f "%~dp0docker-compose.dev.yml" down >nul 2>&1
)
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1
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