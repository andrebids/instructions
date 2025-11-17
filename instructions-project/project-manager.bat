@echo off
setlocal enabledelayedexpansion
title Project Manager - TheCore
color 0A

rem Definir arquivo de log
set "LOG_FILE=%~dp0project-manager.log"

:menu
cls
echo ========================================
echo    PROJECT MANAGER - THECORE
echo ========================================
echo.
echo 1. 🚀 INICIAR PROJETO
echo 2. 📊 VERIFICAR STATUS
echo 3. 🔄 REINICIAR PROJETO
echo 4. 📤 FAZER BUILD E ENVIAR PARA SERVIDOR
echo 5. 🗄️  VERIFICAR CONEXÃO BASE DE DADOS
echo 6. ❌ SAIR
echo.
echo ========================================
set /p choice="Escolha uma opção (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto status
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto deploy_build
if "%choice%"=="5" goto check_db
if "%choice%"=="6" goto exit
goto menu

:start
cls
echo ========================================
echo    INICIANDO PROJETO THECORE
echo ========================================
echo.
echo Logs sendo salvos em: %LOG_FILE%
echo ======================================== >> "%LOG_FILE%"
echo [%DATE% %TIME%] INICIANDO PROJETO >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo.
echo [DEBUG] Iniciando processo de inicializacao...
echo [%DATE% %TIME%] [DEBUG] Iniciando processo de inicializacao... >> "%LOG_FILE%"
echo [DEBUG] Diretorio atual: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio atual: %CD% >> "%LOG_FILE%"
echo [DEBUG] Diretorio do script: %~dp0
echo [%DATE% %TIME%] [DEBUG] Diretorio do script: %~dp0 >> "%LOG_FILE%"
echo.

rem Configurar NODE_OPTIONS para preferir IPv4 (resolve problema DNS Supabase)
rem IMPORTANTE: Deve ser definido no início para aplicar a todos os comandos Node.js
set "NODE_OPTIONS=--dns-result-order=ipv4first"
echo [DEBUG] NODE_OPTIONS configurado: %NODE_OPTIONS%
echo.

rem Parar rapidamente processos/portas antes de iniciar
echo [DEBUG] Parando processos anteriores...
echo [%DATE% %TIME%] [DEBUG] Parando processos anteriores... >> "%LOG_FILE%"
call :stop_quick
set "STOP_RESULT=%errorlevel%"
echo [%DATE% %TIME%] [DEBUG] stop_quick retornou: %STOP_RESULT% >> "%LOG_FILE%"
if %STOP_RESULT% neq 0 (
    echo [DEBUG] Aviso: stop_quick retornou erro, mas continuando...
    echo [%DATE% %TIME%] [DEBUG] Aviso: stop_quick retornou erro, mas continuando... >> "%LOG_FILE%"
) else (
    echo [DEBUG] Processos anteriores parados com sucesso
    echo [%DATE% %TIME%] [DEBUG] Processos anteriores parados com sucesso >> "%LOG_FILE%"
)
echo [DEBUG] Continuando apos stop_quick...
echo [%DATE% %TIME%] [DEBUG] Continuando apos stop_quick... >> "%LOG_FILE%"
echo.

rem Verificar pré-requisitos (Node, npm, Docker/Compose)
echo [DEBUG] Verificando pre-requisitos...
echo [%DATE% %TIME%] [DEBUG] Verificando pre-requisitos... >> "%LOG_FILE%"
call :ensure_prereqs
set "PREREQS_RESULT=%errorlevel%"
echo [%DATE% %TIME%] [DEBUG] ensure_prereqs retornou: %PREREQS_RESULT% >> "%LOG_FILE%"
if %PREREQS_RESULT% neq 0 (
    echo [DEBUG] ERRO: Pre-requisitos nao atendidos
    echo [%DATE% %TIME%] [DEBUG] ERRO: Pre-requisitos nao atendidos >> "%LOG_FILE%"
    pause
    goto menu
)
echo [DEBUG] Pre-requisitos verificados com sucesso
echo [%DATE% %TIME%] [DEBUG] Pre-requisitos verificados com sucesso >> "%LOG_FILE%"
echo.

rem Verificar e instalar dependências automaticamente
echo ========================================
echo    [0/5] INSTALANDO DEPENDÊNCIAS
echo ========================================
echo.
echo [DEBUG] Iniciando verificacao de dependencias...
echo Verificando e instalando dependências do projeto...
echo Isso pode demorar alguns minutos na primeira vez.
echo.
echo [%DATE% %TIME%] [DEBUG] Chamando check_and_install_dependencies... >> "%LOG_FILE%"
call :check_and_install_dependencies
set "DEPS_RESULT=%errorlevel%"
echo [DEBUG] check_and_install_dependencies retornou: %DEPS_RESULT%
echo [%DATE% %TIME%] [DEBUG] check_and_install_dependencies retornou: %DEPS_RESULT% >> "%LOG_FILE%"
if %DEPS_RESULT% neq 0 (
    echo.
    echo ❌ Erro ao instalar dependências
    echo    Verifique as mensagens acima para mais detalhes
    echo [DEBUG] Pausando antes de voltar ao menu...
    pause
    goto menu
)
echo.
echo ✅ Dependências verificadas e instaladas!
echo.
echo [DEBUG] Dependencias OK, aguardando 2 segundos...
timeout /t 2 /nobreak >nul
echo [DEBUG] Continuando apos dependencias...
echo.

rem Garantir que estamos na raiz do projeto antes de comandos subsequentes
cd /d "%~dp0"
echo [DEBUG] Mudado para diretorio raiz: %CD%

rem ========================================
rem BYPASS: Pular verificacoes de BD e migrations para teste rapido
rem ========================================
echo ========================================
echo    [BYPASS] PULANDO VERIFICAÇÕES DE BD
echo ========================================
echo.
echo [DEBUG] BYPASS ATIVO - Pulando verificacoes de BD e migrations
echo [%DATE% %TIME%] [DEBUG] BYPASS ATIVO - Pulando verificacoes de BD e migrations >> "%LOG_FILE%"
echo ⚠️  MODO TESTE: Verificações de base de dados e migrations desativadas
echo    Para reativar, remova o comentario do bloco BYPASS no script
echo.

echo ========================================
echo    [1/2] INICIANDO SERVIDOR BACKEND
echo ========================================
echo.
echo [DEBUG] Iniciando secao do backend...
echo [%DATE% %TIME%] [DEBUG] Iniciando secao do backend... >> "%LOG_FILE%"
rem Verificar se backend já está a correr
echo [DEBUG] Verificando se backend ja esta a correr...
echo [%DATE% %TIME%] [DEBUG] Verificando se backend ja esta a correr... >> "%LOG_FILE%"
echo [%DATE% %TIME%] [DEBUG] Executando curl para verificar backend... >> "%LOG_FILE%"
curl -s -m 2 http://localhost:5000/health >nul 2>&1
set "CURL_RESULT=%errorlevel%"
echo [DEBUG] curl retornou: %CURL_RESULT%
echo [%DATE% %TIME%] [DEBUG] curl retornou: %CURL_RESULT% >> "%LOG_FILE%"
if not errorlevel 1 (
    echo ✅ Backend já está a correr na porta 5000
    echo [%DATE% %TIME%] [DEBUG] Backend ja esta a correr, pulando inicializacao... >> "%LOG_FILE%"
    echo    Pulando inicialização...
    set "BACKEND_ONLINE=1"
    goto backend_already_running
)
echo [DEBUG] Backend nao esta a correr, continuando...
echo [%DATE% %TIME%] [DEBUG] Backend nao esta a correr, continuando... >> "%LOG_FILE%"

rem Verificar se há processo Node.js a usar a porta 5000
echo [DEBUG] Verificando se porta 5000 esta em uso...
echo [%DATE% %TIME%] [DEBUG] Verificando se porta 5000 esta em uso... >> "%LOG_FILE%"
rem Verificar se há processo Node.js a usar a porta 5000 (versao simplificada)
echo [DEBUG] Verificando porta 5000 de forma simplificada...
echo [%DATE% %TIME%] [DEBUG] Verificando porta 5000 de forma simplificada... >> "%LOG_FILE%"
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [DEBUG] Porta 5000 nao esta em uso - continuando...
    echo [%DATE% %TIME%] [DEBUG] Porta 5000 nao esta em uso - continuando... >> "%LOG_FILE%"
    goto porta_livre
)
echo [DEBUG] Porta 5000 esta em uso - verificando processo...
echo [%DATE% %TIME%] [DEBUG] Porta 5000 esta em uso - verificando processo... >> "%LOG_FILE%"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [DEBUG] Verificando PID: %%a
    echo [%DATE% %TIME%] [DEBUG] Verificando PID: %%a >> "%LOG_FILE%"
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe" >nul
    if not errorlevel 1 (
        echo    Processo Node.js encontrado na porta 5000 (PID: %%a)
        echo [%DATE% %TIME%] [DEBUG] Processo Node.js encontrado, pulando inicializacao... >> "%LOG_FILE%"
        echo    Se quiser reiniciar, use a opção 3 (REINICIAR PROJETO) ou feche manualmente
        set "BACKEND_ONLINE=1"
        goto backend_already_running
    )
)

:porta_livre
echo [DEBUG] Continuando para iniciar backend...
echo [%DATE% %TIME%] [DEBUG] Continuando para iniciar backend... >> "%LOG_FILE%"
echo [DEBUG] Porta 5000 nao esta em uso, continuando...
echo [%DATE% %TIME%] [DEBUG] Porta 5000 nao esta em uso, continuando... >> "%LOG_FILE%"
echo [DEBUG] Chegou ao ponto de iniciar o backend...
echo [%DATE% %TIME%] [DEBUG] Chegou ao ponto de iniciar o backend... >> "%LOG_FILE%"

echo Iniciando servidor backend...
echo [%DATE% %TIME%] [DEBUG] Iniciando servidor backend... >> "%LOG_FILE%"
echo [DEBUG] Configurando variaveis do backend...
rem Configurar NODE_OPTIONS para preferir IPv4 (resolve problema DNS Supabase)
set "NODE_OPTIONS=--dns-result-order=ipv4first"
echo [DEBUG] NODE_OPTIONS configurado: %NODE_OPTIONS%
echo [%DATE% %TIME%] [DEBUG] NODE_OPTIONS configurado: %NODE_OPTIONS% >> "%LOG_FILE%"
echo [DEBUG] Usando comando start simples (versao funcional)...
echo [%DATE% %TIME%] [DEBUG] Executando comando start para backend... >> "%LOG_FILE%"
rem Criar arquivo batch temporario para evitar problemas com aspas e caminhos com espacos
set "TEMP_BACKEND_BAT=%TEMP%\start_backend_thecore.bat"
set "BACKEND_DIR=%~dp0server"
echo [DEBUG] Criando arquivo batch temporario: %TEMP_BACKEND_BAT%
echo [DEBUG] Diretorio do backend: %BACKEND_DIR%
echo [%DATE% %TIME%] [DEBUG] Criando arquivo batch temporario: %TEMP_BACKEND_BAT% >> "%LOG_FILE%"
echo [%DATE% %TIME%] [DEBUG] Diretorio do backend: %BACKEND_DIR% >> "%LOG_FILE%"
(
echo @echo off
echo title Backend Server
echo set NODE_OPTIONS=--dns-result-order=ipv4first
echo cd /d "%BACKEND_DIR%"
echo npm run dev
echo pause
) > "%TEMP_BACKEND_BAT%"
if not exist "%TEMP_BACKEND_BAT%" (
    echo [DEBUG] ERRO: Nao foi possivel criar arquivo batch temporario
    echo [%DATE% %TIME%] [DEBUG] ERRO: Nao foi possivel criar arquivo batch temporario >> "%LOG_FILE%"
    goto menu
)
echo [DEBUG] Arquivo batch criado com sucesso
echo [%DATE% %TIME%] [DEBUG] Arquivo batch criado com sucesso >> "%LOG_FILE%"
echo [DEBUG] Executando start com arquivo batch temporario...
echo [%DATE% %TIME%] [DEBUG] Executando start com arquivo batch temporario... >> "%LOG_FILE%"
start "" /min cmd /k call "%TEMP_BACKEND_BAT%"
rem Aguardar um pouco para garantir que a janela abriu
ping 127.0.0.1 -n 2 >nul 2>&1
echo [DEBUG] DEPOIS de executar start - janela deve ter aberto
echo [%DATE% %TIME%] [DEBUG] DEPOIS de executar start - janela deve ter aberto >> "%LOG_FILE%"
echo [DEBUG] Chegou apos verificacao do start...
echo [%DATE% %TIME%] [DEBUG] Chegou apos verificacao do start... >> "%LOG_FILE%"
echo ✅ Servidor backend iniciado em http://localhost:5000
echo.
echo    Aguardando servidor estar pronto (5 segundos)...
echo [%DATE% %TIME%] [DEBUG] Aguardando servidor estar pronto... >> "%LOG_FILE%"
echo [DEBUG] Executando timeout...
echo [%DATE% %TIME%] [DEBUG] Executando timeout... >> "%LOG_FILE%"
timeout /t 5 /nobreak >nul
set "TIMEOUT_RESULT=%errorlevel%"
echo [DEBUG] Timeout concluido, errorlevel: %TIMEOUT_RESULT%
echo [%DATE% %TIME%] [DEBUG] Timeout concluido, errorlevel: %TIMEOUT_RESULT% >> "%LOG_FILE%"
echo [DEBUG] Aguardamento concluido, continuando...
echo [%DATE% %TIME%] [DEBUG] Aguardamento concluido, continuando... >> "%LOG_FILE%"

:backend_already_running
rem Verificar se o backend está realmente a correr
echo    Verificando se backend está online...
set "BACKEND_ONLINE=0"
for /L %%i in (1,1,10) do (
    if "%BACKEND_ONLINE%"=="0" (
        curl -s -m 3 http://localhost:5000/health >nul 2>&1
        if not errorlevel 1 (
            set "BACKEND_ONLINE=1"
            echo ✅ Backend está online e respondendo!
            goto backend_checked
        )
        if %%i lss 6 (
            echo    Tentativa %%i/6... aguardando mais 2 segundos...
            timeout /t 2 /nobreak >nul
        )
    )
)

:backend_checked
if "%BACKEND_ONLINE%"=="0" (
    echo ⚠️  AVISO: Backend pode não estar totalmente pronto
    echo    Verifique a janela "Backend Server" para erros
    echo    Erro comum: falta pacote 'sharp' - execute: cd server ^&^& npm install
)
echo.

echo ========================================
echo    [5/5] INICIANDO CLIENTE FRONTEND
echo ========================================
echo.
echo [DEBUG] Iniciando secao do frontend...
echo [%DATE% %TIME%] [DEBUG] Iniciando secao do frontend... >> "%LOG_FILE%"
rem Verificacao ultra-simplificada - apenas verificar se porta 5173 esta em uso
set "FRONTEND_ALREADY_RUNNING=0"
echo [DEBUG] Verificando se porta 5173 esta em uso...
echo [%DATE% %TIME%] [DEBUG] Verificando se porta 5173 esta em uso... >> "%LOG_FILE%"
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Frontend já está a correr na porta 5173
    echo    Pulando inicialização...
    echo [DEBUG] Porta 5173 esta em uso, assumindo que frontend esta rodando
    echo [%DATE% %TIME%] [DEBUG] Porta 5173 esta em uso, assumindo que frontend esta rodando >> "%LOG_FILE%"
    set "FRONTEND_ALREADY_RUNNING=1"
    goto frontend_already_running
) else (
    echo [DEBUG] Porta 5173 nao esta em uso, iniciando frontend...
    echo [%DATE% %TIME%] [DEBUG] Porta 5173 nao esta em uso, iniciando frontend... >> "%LOG_FILE%"
)

rem Verificar se há processos Node.js a usar portas do frontend (já verificado acima no loop)
rem Se chegou aqui, frontend não está a correr nas portas testadas

echo Iniciando cliente frontend...
echo [%DATE% %TIME%] [DEBUG] Iniciando cliente frontend... >> "%LOG_FILE%"
rem Criar arquivo batch temporario para evitar problemas com aspas e caminhos com espacos
set "TEMP_FRONTEND_BAT=%TEMP%\start_frontend_thecore.bat"
set "FRONTEND_DIR=%~dp0client"
echo [DEBUG] Criando arquivo batch temporario: %TEMP_FRONTEND_BAT%
echo [DEBUG] Diretorio do frontend: %FRONTEND_DIR%
echo [%DATE% %TIME%] [DEBUG] Criando arquivo batch temporario: %TEMP_FRONTEND_BAT% >> "%LOG_FILE%"
echo [%DATE% %TIME%] [DEBUG] Diretorio do frontend: %FRONTEND_DIR% >> "%LOG_FILE%"
rem Verificar se o diretorio existe
if not exist "%FRONTEND_DIR%" (
    echo [DEBUG] ERRO: Diretorio do frontend nao existe: %FRONTEND_DIR%
    echo [%DATE% %TIME%] [DEBUG] ERRO: Diretorio do frontend nao existe: %FRONTEND_DIR% >> "%LOG_FILE%"
    goto frontend_error
)
(
echo @echo off
echo title Frontend Client
echo cd /d "%FRONTEND_DIR%"
echo npm run dev
echo pause
) > "%TEMP_FRONTEND_BAT%"
if not exist "%TEMP_FRONTEND_BAT%" (
    echo [DEBUG] ERRO: Nao foi possivel criar arquivo batch temporario do frontend
    echo [%DATE% %TIME%] [DEBUG] ERRO: Nao foi possivel criar arquivo batch temporario do frontend >> "%LOG_FILE%"
    goto frontend_error
)
echo [DEBUG] Arquivo batch criado com sucesso
echo [%DATE% %TIME%] [DEBUG] Arquivo batch criado com sucesso >> "%LOG_FILE%"
echo [DEBUG] Executando start com arquivo batch temporario...
echo [%DATE% %TIME%] [DEBUG] Executando start com arquivo batch temporario... >> "%LOG_FILE%"
start "" /min cmd /k call "%TEMP_FRONTEND_BAT%"
if errorlevel 1 (
    echo [DEBUG] ERRO ao executar start para frontend, errorlevel: %errorlevel%
    echo [%DATE% %TIME%] [DEBUG] ERRO ao executar start para frontend, errorlevel: %errorlevel% >> "%LOG_FILE%"
) else (
    echo [DEBUG] Comando start executado para frontend com sucesso
    echo [%DATE% %TIME%] [DEBUG] Comando start executado para frontend com sucesso >> "%LOG_FILE%"
)
echo ✅ Cliente frontend iniciado
goto frontend_done

:frontend_error
echo [DEBUG] Erro ao iniciar frontend, mas continuando...
echo [%DATE% %TIME%] [DEBUG] Erro ao iniciar frontend, mas continuando... >> "%LOG_FILE%"

:frontend_done
echo.

:frontend_already_running
echo [DEBUG] Chegou ao final da inicializacao do frontend
echo [%DATE% %TIME%] [DEBUG] Chegou ao final da inicializacao do frontend >> "%LOG_FILE%"
echo ========================================
echo    PROJETO INICIADO COM SUCESSO!
echo ========================================
echo.
echo [%DATE% %TIME%] PROJETO INICIADO COM SUCESSO! >> "%LOG_FILE%"
echo [DEBUG] Exibindo informacoes finais...
echo 🔧 Backend:  http://localhost:5000
echo 🗄️  Database: localhost:5433
echo.
if "%FRONTEND_ALREADY_RUNNING%"=="1" (
    echo ✅ Frontend já estava a correr
    set "FRONTEND_URL=http://localhost:5173"
) else (
    echo 🌐 Frontend: http://localhost:5173 (ou porta configurada)
    echo Aguardando frontend estar pronto (7 segundos)...
    timeout /t 7 /nobreak >nul
    set "FRONTEND_URL=http://localhost:5173"
)
echo.
echo [DEBUG] Abrindo navegador em %FRONTEND_URL%...
echo [%DATE% %TIME%] [DEBUG] Abrindo navegador em %FRONTEND_URL%... >> "%LOG_FILE%"
start "" "%FRONTEND_URL%"
if errorlevel 1 (
    echo [DEBUG] Erro ao abrir navegador, tentando metodo alternativo...
    echo [%DATE% %TIME%] [DEBUG] Erro ao abrir navegador, tentando metodo alternativo... >> "%LOG_FILE%"
    start "" "http://localhost:5173"
)
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause >nul

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
echo    verifique:
echo    1. Backend está a correr (janela "Backend Server")
echo    2. Se falta 'sharp': execute cd server ^&^& npm install
echo    3. Se tabelas não existem: execute cd server ^&^& npm run setup
echo.
echo 📝 NOTA 2: Se aparecer "ECONNREFUSED" no frontend,
echo    significa que o backend não está a correr.
echo    Verifique a janela "Backend Server" para erros.
echo.
echo ========================================
echo    Script concluído. Janela mantida aberta.
echo ========================================
echo.
echo [DEBUG] Script chegou ao final com sucesso!
echo [%DATE% %TIME%] [DEBUG] Script chegou ao final com sucesso! >> "%LOG_FILE%"
echo [DEBUG] Pressione qualquer tecla para voltar ao menu...
echo [%DATE% %TIME%] [DEBUG] Aguardando usuario pressionar tecla... >> "%LOG_FILE%"
pause
echo [%DATE% %TIME%] [DEBUG] Usuario pressionou tecla, voltando ao menu... >> "%LOG_FILE%"
goto menu

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

:deploy_build
cls
echo ========================================
echo    BUILD E DEPLOY PARA SERVIDOR
echo ========================================
echo.
echo Este processo irá:
echo 1. Fazer build do cliente localmente
echo 2. Enviar ficheiros compilados para o servidor
echo 3. Atualizar o servidor com o novo build
echo 4. Executar migrations na base de dados
echo 5. Reiniciar o servidor PM2
echo.
echo ⚠️  NOTA: O servidor remoto deve estar acessível via SSH
echo    Certifique-se de que a chave SSH está configurada
echo.
echo 💡 O script irá executar automaticamente:
echo    - npm run setup (migrations)
echo    - pm2 restart instructions-server
echo.
echo Iniciando deploy automaticamente...
timeout /t 2 /nobreak >nul
echo.
echo ========================================
echo    EXECUTANDO BUILD E DEPLOY COMPLETO
echo ========================================
echo.

rem Verificar se o script PowerShell existe
if not exist "%~dp0upload-build.ps1" (
    echo ❌ Script upload-build.ps1 não encontrado!
    echo    Certifique-se de que o ficheiro existe na raiz do projeto.
    echo.
    pause
    goto menu
)

rem Executar o script PowerShell
echo Executando script de build e deploy...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0upload-build.ps1"
set "DEPLOY_SUCCESS=%errorlevel%"

echo.
if %DEPLOY_SUCCESS% equ 0 (
    echo ========================================
    echo    ✅ BUILD E DEPLOY CONCLUÍDO!
    echo ========================================
    echo.
    echo ✅ Build enviado para o servidor
    echo ✅ Migrations executadas
    echo ✅ Servidor reiniciado
    echo.
    echo O servidor remoto foi atualizado completamente.
    echo.
    echo 💡 Se houver problemas, verifique:
    echo    - Logs do PM2: ssh servidor 'pm2 logs instructions-server'
    echo    - Status do PM2: ssh servidor 'pm2 status'
    echo    - Health check: curl http://servidor:5000/health
    echo.
) else (
    echo ========================================
    echo    ❌ ERRO NO DEPLOY
    echo ========================================
    echo.
    echo O deploy falhou. Verifique:
    echo 1. Servidor está acessível via SSH
    echo 2. Chave SSH está configurada corretamente
    echo 3. Build local foi concluído com sucesso
    echo 4. Migrations executaram sem erros críticos
    echo 5. PM2 está instalado e configurado no servidor
    echo 6. Verifique os erros acima para mais detalhes
    echo.
    echo 💡 Para verificar o status do servidor:
    echo    ssh servidor 'pm2 status'
    echo    ssh servidor 'pm2 logs instructions-server --lines 50'
    echo.
)

pause
goto menu

:check_db
cls
echo ========================================
echo    VERIFICAÇÃO DE CONEXÃO BASE DE DADOS
echo ========================================
echo.

rem Configurar NODE_OPTIONS para preferir IPv4 (resolve problema DNS Supabase)
set "NODE_OPTIONS=--dns-result-order=ipv4first"

cd /d "%~dp0server"

rem Verificar se .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado em server\.env
    echo.
    echo    Crie o arquivo .env com as seguintes variáveis:
    echo.
    echo    Para PostgreSQL local:
    echo    DB_HOST=localhost
    echo    DB_PORT=5433
    echo    DB_NAME=instructions_demo
    echo    DB_USER=demo_user
    echo    DB_PASSWORD=demo_password
    echo.
    echo    Para Supabase:
    echo    DB_HOST=db.[PROJECT_REF].supabase.co
    echo    DB_PORT=5432  (ou 6543 para connection pooling - recomendado)
    echo    DB_NAME=postgres
    echo    DB_USER=postgres
    echo    DB_PASSWORD=[SUA_SENHA]
    echo    SUPABASE_URL=https://[PROJECT_REF].supabase.co
    echo    SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
    echo.
    pause
    cd /d "%~dp0"
    goto menu
)

echo [1/3] Verificando arquivo .env...
echo ✅ Arquivo .env encontrado
echo.

echo [2/3] Verificando variáveis de ambiente...
set "MISSING_VARS=0"
findstr /B /C:"DB_HOST=" ".env" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  DB_HOST não definida
    set "MISSING_VARS=1"
)
findstr /B /C:"DB_PORT=" ".env" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  DB_PORT não definida
    set "MISSING_VARS=1"
)
findstr /B /C:"DB_NAME=" ".env" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  DB_NAME não definida
    set "MISSING_VARS=1"
)
findstr /B /C:"DB_USER=" ".env" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  DB_USER não definida
    set "MISSING_VARS=1"
)
findstr /B /C:"DB_PASSWORD=" ".env" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  DB_PASSWORD não definida
    set "MISSING_VARS=1"
)

if "%MISSING_VARS%"=="1" (
    echo.
    echo ❌ Algumas variáveis obrigatórias estão em falta no .env
    echo    Configure todas as variáveis DB_* antes de continuar
    echo.
    pause
    cd /d "%~dp0"
    goto menu
) else (
    echo ✅ Todas as variáveis obrigatórias estão definidas
)
echo.

rem Verificar se é Supabase
findstr /B /C:"SUPABASE_URL=" ".env" >nul 2>&1
if errorlevel 1 (
    echo 📌 Modo: PostgreSQL Local/Remoto
) else (
    echo 📌 Modo: Supabase
    findstr /B /C:"SUPABASE_SERVICE_ROLE_KEY=" ".env" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  SUPABASE_SERVICE_ROLE_KEY não definida (opcional para storage)
    ) else (
        echo ✅ SUPABASE_SERVICE_ROLE_KEY definida
    )
)
echo.

echo [3/3] Testando conexão com a base de dados...
echo.
call npm run check-connection
set "CONNECTION_RESULT=%errorlevel%"
echo.

if %CONNECTION_RESULT% equ 0 (
    echo ========================================
    echo    ✅ CONEXÃO VERIFICADA COM SUCESSO!
    echo ========================================
    echo.
    echo A base de dados está acessível e funcionando corretamente.
    echo.
) else (
    echo ========================================
    echo    ❌ ERRO NA CONEXÃO
    echo ========================================
    echo.
    echo Não foi possível conectar à base de dados.
    echo.
    echo 💡 Verifique:
    echo    1. Credenciais no .env estão corretas
    echo    2. PostgreSQL está a correr (se usar localhost)
    echo    3. Ligação à internet (se usar Supabase)
    echo    4. Firewall não está a bloquear a conexão
    echo.
    echo Para mais detalhes, execute:
    echo    cd server ^&^& npm run check-connection
    echo.
)

cd /d "%~dp0"
pause
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
set "SERVER_NEED_INSTALL=0"
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado no servidor. Instalando dependências...
    set "SERVER_NEED_INSTALL=1"
) else (
    rem Verificar se dependências críticas estão instaladas
    if not exist "node_modules\sharp" (
        echo ⚠️  sharp não encontrado. Reinstalando dependências...
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\sequelize" (
        echo ⚠️  sequelize não encontrado. Reinstalando dependências...
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\express" (
        echo ⚠️  express não encontrado. Reinstalando dependências...
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\pg" (
        echo ⚠️  pg não encontrado. Reinstalando dependências...
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\@supabase\supabase-js" (
        echo ⚠️  @supabase/supabase-js não encontrado. Reinstalando dependências...
        set "SERVER_NEED_INSTALL=1"
    )
)

if "%SERVER_NEED_INSTALL%"=="1" (
    echo 🔄 Instalando dependências do servidor...
    if exist "package-lock.json" (
        npm ci
        if %errorlevel% neq 0 (
            echo ⚠️  npm ci falhou, tentando npm install...
            npm install
        )
    ) else (
        npm install
    )
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências do servidor
        echo    -> Tente executar manualmente: cd server ^&^& npm install
        exit /b 1
    )
    echo ✅ Dependências do servidor instaladas com sucesso!
    rem Verificar novamente após instalação
    if not exist "node_modules\sharp" (
        echo ❌ AVISO: sharp ainda não foi instalado após npm install
        echo    -> Execute manualmente: cd server ^&^& npm install sharp
        echo    -> O servidor pode não iniciar sem esta dependência!
    )
    if not exist "node_modules\@supabase\supabase-js" (
        echo ❌ AVISO: @supabase/supabase-js ainda não foi instalado após npm install
        echo    -> Execute manualmente: cd server ^&^& npm install @supabase/supabase-js
        echo    -> O servidor pode não iniciar sem esta dependência!
    )
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

:check_database_connection
rem Verificar se .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado
    echo    Crie o arquivo .env com as credenciais da base de dados
    exit /b 1
)

rem Verificar se node_modules existe
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado. Execute: npm install
    exit /b 1
)

rem Configurar NODE_OPTIONS para preferir IPv4 (resolve problema DNS Supabase)
rem IMPORTANTE: Deve ser definido ANTES de executar Node.js
set "NODE_OPTIONS=--dns-result-order=ipv4first"

rem Executar verificação de conexão (mostrar output)
call npm run check-connection
rem Capturar errorlevel IMEDIATAMENTE após o call, antes de qualquer outro comando
if errorlevel 1 (
    exit /b 1
) else (
    exit /b 0
)

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