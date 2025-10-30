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

echo [1/5] Iniciando base de dados PostgreSQL...
if "%DOCKER_AVAILABLE%"=="1" (
    %COMPOSE_CMD% -f "%~dp0docker-compose.dev.yml" up -d
    if %errorlevel% neq 0 (
        echo ❌ Erro ao iniciar PostgreSQL
        pause
        goto menu
    )
    echo ✅ PostgreSQL iniciado com sucesso!
) else (
    echo ⚠️  Docker/Compose nao encontrado. Base de dados via Docker nao sera iniciada.
    echo    -> Instala Docker Desktop OU inicia a tua BD PostgreSQL localmente (porta 5433)
    echo    -> As migrations ainda serao executadas se o PostgreSQL estiver a correr
)
echo.

echo [2/5] Aguardando PostgreSQL estar pronto...
echo    Aguardando 5 segundos para garantir que o PostgreSQL está completamente iniciado...
timeout /t 5 /nobreak >nul
echo    Verificando conectividade com PostgreSQL...
call :wait_for_postgres
if %errorlevel% neq 0 (
    echo ⚠️  Aviso: PostgreSQL pode não estar totalmente pronto
    echo    Continuando mesmo assim... (as migrations podem falhar se a BD não estiver pronta)
) else (
    echo ✅ PostgreSQL pronto e acessível!
)
echo.

echo [3/5] Executando setup da base de dados (migrations)...
cd /d "%~dp0server"
echo    Este passo irá:
echo    - Verificar conexão com a base de dados
echo    - Criar/sincronizar tabelas básicas
echo    - Executar migrations necessárias
echo    - Configurar schema completo
echo.
call npm run setup
set "SETUP_SUCCESS=0"
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  AVISO: Setup encontrou problemas!
    echo    O projeto pode não funcionar corretamente sem as migrations.
    echo.
    echo    Tentando executar migrations manualmente...
    call npm run migrate:all
    if %errorlevel% neq 0 (
        echo ❌ Erro ao executar migrations. Verifique:
        echo    1. PostgreSQL está a correr
        echo    2. Credenciais em server\.env estão corretas
        echo    3. Base de dados existe
        echo.
        echo    Execute manualmente: cd server ^&^& npm run setup
        echo.
        echo ⚠️  AVISO CRÍTICO: O servidor será iniciado mesmo assim,
        echo    mas pode apresentar erros 500 se as tabelas não existirem.
        echo    Corrija os problemas antes de usar a aplicação.
        echo.
        pause
        set "SETUP_SUCCESS=0"
    ) else (
        echo ✅ Migrations executadas manualmente com sucesso!
        set "SETUP_SUCCESS=1"
    )
) else (
    echo ✅ Setup da base de dados concluído com sucesso!
    echo    Todas as migrations foram aplicadas.
    set "SETUP_SUCCESS=1"
)
echo.

if "%SETUP_SUCCESS%"=="1" (
    echo ✅ Base de dados configurada. Prosseguindo com o início do servidor...
) else (
    echo ⚠️  Setup não foi concluído com sucesso, mas continuando...
    echo    O servidor tentará sincronizar tabelas automaticamente ao iniciar.
    echo    Se aparecerem erros 500, execute: cd server ^&^& npm run setup
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
echo Aguardando frontend estar pronto (7 segundos)...
timeout /t 7 /nobreak >nul

rem Tentar detectar automaticamente o frontend em portas comuns do Vite
set "FRONTEND_PORT="
set "FRONTEND_FOUND=0"

echo Verificando portas do frontend...
for %%P in (3003 5173 4173 3000 3001 3002 3005) do (
    if "%FRONTEND_FOUND%"=="0" (
        echo    Testando porta %%P...
        curl -s -m 2 http://localhost:%%P >nul 2>&1
        if not errorlevel 1 (
            set "FRONTEND_PORT=%%P"
            set "FRONTEND_FOUND=1"
            echo ✅ Frontend detectado na porta %%P
            goto frontend_found
        )
    )
)

if "%FRONTEND_FOUND%"=="0" (
    echo ⚠️  Frontend nao detectado automaticamente.
    echo.
    echo Portas comuns do Vite: 3003, 5173, 4173, 3000, 3001, 3002, 3005
    echo Usando porta padrão: 3003
    echo.
    echo 💡 Dica: Verifique a janela "Frontend Client" para ver a porta correta
    set "FRONTEND_PORT=3003"
    goto frontend_set
)

:frontend_found
rem Frontend já foi detectado acima

:frontend_set
set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%"

echo.
echo 🌐 Frontend: %FRONTEND_URL%
echo.
echo Abrindo frontend no browser...
start %FRONTEND_URL%
echo ✅ Frontend aberto no browser!
echo.
echo ✅ Projeto iniciado com sucesso!
echo.
echo 📝 NOTA: Se aparecerem erros 500 (Internal Server Error) no frontend,
echo    significa que as migrations não foram executadas corretamente.
echo    Execute manualmente: cd server ^&^& npm run setup
echo.
echo Aguardando 2 segundos antes de fechar...
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

:wait_for_postgres
rem Tenta verificar se PostgreSQL está acessível na porta 5433
rem Usa netstat para verificar se a porta está em escuta
set "MAX_TRIES=6"
set "TRY_COUNT=0"
:check_postgres_loop
set /a TRY_COUNT+=1
rem Verificar se a porta 5433 está em escuta
netstat -an | findstr ":5433" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    rem Porta está aberta, aguardar mais um pouco para garantir que está pronto
    timeout /t 2 /nobreak >nul
    exit /b 0
)
if %TRY_COUNT% lss %MAX_TRIES% (
    timeout /t 2 /nobreak >nul
    goto check_postgres_loop
)
rem Se chegou aqui, não conseguiu verificar a porta
rem Mas continua mesmo assim (pode ser que PostgreSQL esteja em outra porta ou sem netstat)
exit /b 1

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