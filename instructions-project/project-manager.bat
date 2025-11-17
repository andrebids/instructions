@echo off
setlocal enabledelayedexpansion
title Project Manager - TheCore
color 0A

rem Prevenir fechamento inesperado - adicionar tratamento de erro
if not defined LOG_FILE (
    set "LOG_FILE=%~dp0project-manager.log"
)

rem Definir arquivo de log
set "LOG_FILE=%~dp0project-manager.log"

:menu
cls
echo ========================================
echo    PROJECT MANAGER - THECORE
echo ========================================
echo.
echo 1. 🚀 INICIAR PROJETO
echo 2. 📦 INSTALAR DEPENDÊNCIAS
echo 3. 📤 FAZER BUILD E ENVIAR PARA SERVIDOR
echo 4. 🗄️  VERIFICAR CONEXÃO BASE DE DADOS
echo 5. 🔄 VERIFICAR E ATUALIZAR PACOTES PWA
echo 6. ❌ SAIR
echo.
echo ========================================
set /p choice="Escolha uma opção (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto install_deps
if "%choice%"=="3" goto deploy_build
if "%choice%"=="4" goto check_db
if "%choice%"=="5" goto check_pwa_updates
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
echo [%DATE% %TIME%] [DEBUG] Chamando check_and_install_dependencies... >> "%LOG_FILE%" 2>&1
call :check_and_install_dependencies
set "DEPS_RESULT=%errorlevel%"
echo [DEBUG] check_and_install_dependencies retornou: %DEPS_RESULT%
echo [%DATE% %TIME%] [DEBUG] check_and_install_dependencies retornou: %DEPS_RESULT% >> "%LOG_FILE%" 2>&1
if %DEPS_RESULT% neq 0 (
    echo.
    echo ❌ Erro ao instalar dependências
    echo    Verifique as mensagens acima para mais detalhes
    echo [DEBUG] Pausando antes de voltar ao menu...
    echo [%DATE% %TIME%] [DEBUG] Pausando antes de voltar ao menu... >> "%LOG_FILE%" 2>&1
    pause
    goto menu
)
echo.
echo ✅ Dependências verificadas e instaladas!
echo [%DATE% %TIME%] Dependencias verificadas e instaladas! >> "%LOG_FILE%" 2>&1
echo.
echo [DEBUG] Dependencias OK, aguardando 2 segundos...
echo [%DATE% %TIME%] [DEBUG] Dependencias OK, aguardando 2 segundos... >> "%LOG_FILE%" 2>&1
timeout /t 2 /nobreak >nul
echo [DEBUG] Continuando apos dependencias...
echo [%DATE% %TIME%] [DEBUG] Continuando apos dependencias... >> "%LOG_FILE%" 2>&1
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
rem Verificacao - verificar se porta 3003 esta em uso (porta padrão do projeto)
set "FRONTEND_ALREADY_RUNNING=0"
echo [DEBUG] Verificando se porta 3003 esta em uso...
echo [%DATE% %TIME%] [DEBUG] Verificando se porta 3003 esta em uso... >> "%LOG_FILE%" 2>&1
netstat -ano | findstr ":3003" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Frontend já está a correr na porta 3003
    echo    Pulando inicialização...
    echo [DEBUG] Porta 3003 esta em uso, assumindo que frontend esta rodando
    echo [%DATE% %TIME%] [DEBUG] Porta 3003 esta em uso, assumindo que frontend esta rodando >> "%LOG_FILE%" 2>&1
    set "FRONTEND_ALREADY_RUNNING=1"
    goto frontend_already_running
) else (
    echo [DEBUG] Porta 3003 nao esta em uso, iniciando frontend...
    echo [%DATE% %TIME%] [DEBUG] Porta 3003 nao esta em uso, iniciando frontend... >> "%LOG_FILE%" 2>&1
)

rem Verificar também outras portas comuns do Vite antes de iniciar
for %%P in (5173 4173 3000 3001 3002 3005) do (
    netstat -ano | findstr ":%%P" | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 (
        echo [DEBUG] Porta %%P esta em uso, verificando se e Node.js...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P" ^| findstr "LISTENING"') do (
            tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe" >nul
            if not errorlevel 1 (
                echo ✅ Frontend já está a correr na porta %%P
                echo [DEBUG] Frontend detectado na porta %%P, pulando inicializacao
                echo [%DATE% %TIME%] [DEBUG] Frontend detectado na porta %%P, pulando inicializacao >> "%LOG_FILE%" 2>&1
                set "FRONTEND_ALREADY_RUNNING=1"
                goto frontend_already_running
            )
        )
    )
)

rem Se chegou aqui, frontend não está a correr - iniciar
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
rem Detectar porta do frontend antes de abrir browser
set "FRONTEND_PORT="
set "FRONTEND_FOUND=0"
echo [DEBUG] Detectando porta do frontend...
echo [%DATE% %TIME%] [DEBUG] Detectando porta do frontend... >> "%LOG_FILE%" 2>&1

rem Verificar porta 3003 primeiro (porta padrão)
echo [DEBUG] Testando porta 3003...
curl -s -m 2 http://localhost:3003 >nul 2>&1
if not errorlevel 1 (
    set "FRONTEND_PORT=3003"
    set "FRONTEND_FOUND=1"
    echo ✅ Frontend detectado na porta 3003
    echo [%DATE% %TIME%] [DEBUG] Frontend detectado na porta 3003 >> "%LOG_FILE%" 2>&1
    goto frontend_port_detected
)

rem Verificar outras portas comuns do Vite
for %%P in (5173 4173 3000 3001 3002 3005) do (
    if "%FRONTEND_FOUND%"=="0" (
        echo [DEBUG] Testando porta %%P...
        curl -s -m 2 http://localhost:%%P >nul 2>&1
        if not errorlevel 1 (
            set "FRONTEND_PORT=%%P"
            set "FRONTEND_FOUND=1"
            echo ✅ Frontend detectado na porta %%P
            echo [%DATE% %TIME%] [DEBUG] Frontend detectado na porta %%P >> "%LOG_FILE%" 2>&1
            goto frontend_port_detected
        )
    )
)

rem Se não encontrou nenhuma porta, usar padrão
if "%FRONTEND_FOUND%"=="0" (
    echo [DEBUG] Frontend nao detectado automaticamente, usando porta padrao 3003
    echo [%DATE% %TIME%] [DEBUG] Frontend nao detectado automaticamente, usando porta padrao 3003 >> "%LOG_FILE%" 2>&1
    set "FRONTEND_PORT=3003"
)

:frontend_port_detected
echo [DEBUG] Chegou ao label frontend_port_detected
echo [%DATE% %TIME%] [DEBUG] Chegou ao label frontend_port_detected >> "%LOG_FILE%" 2>&1
set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%"
echo [DEBUG] FRONTEND_URL definido como: %FRONTEND_URL%
echo [%DATE% %TIME%] [DEBUG] FRONTEND_URL definido como: %FRONTEND_URL% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando FRONTEND_ALREADY_RUNNING: [%FRONTEND_ALREADY_RUNNING%]
echo [%DATE% %TIME%] [DEBUG] Verificando FRONTEND_ALREADY_RUNNING: [%FRONTEND_ALREADY_RUNNING%] >> "%LOG_FILE%" 2>&1

rem Usar goto para evitar problemas com if/else em batch
echo [DEBUG] Antes do IF statement...
echo [%DATE% %TIME%] [DEBUG] Antes do IF statement... >> "%LOG_FILE%" 2>&1
if "%FRONTEND_ALREADY_RUNNING%"=="1" (
    echo [DEBUG] Dentro do IF - FRONTEND_ALREADY_RUNNING=1
    echo [%DATE% %TIME%] [DEBUG] Dentro do IF - FRONTEND_ALREADY_RUNNING=1 >> "%LOG_FILE%" 2>&1
    echo ✅ Frontend já estava a correr na porta %FRONTEND_PORT%
    echo [%DATE% %TIME%] [DEBUG] Frontend ja estava a correr na porta %FRONTEND_PORT% >> "%LOG_FILE%" 2>&1
    goto after_frontend_wait
)
echo [DEBUG] Apos o IF - FRONTEND_ALREADY_RUNNING nao e 1, continuando...
echo [%DATE% %TIME%] [DEBUG] Apos o IF - FRONTEND_ALREADY_RUNNING nao e 1, continuando... >> "%LOG_FILE%" 2>&1

rem Se chegou aqui, frontend foi iniciado agora
echo [DEBUG] Entrando no bloco de aguardar frontend...
echo [%DATE% %TIME%] [DEBUG] Entrando no bloco de aguardar frontend... >> "%LOG_FILE%" 2>&1
echo 🌐 Frontend: %FRONTEND_URL%
echo [%DATE% %TIME%] [DEBUG] Frontend iniciado, aguardando estar pronto... >> "%LOG_FILE%" 2>&1
echo Aguardando frontend estar pronto (7 segundos)...
echo [DEBUG] Executando timeout...
echo [%DATE% %TIME%] [DEBUG] Executando timeout... >> "%LOG_FILE%" 2>&1
timeout /t 7 /nobreak >nul
set "TIMEOUT_RESULT=%errorlevel%"
echo [DEBUG] Timeout concluido, errorlevel: %TIMEOUT_RESULT%
echo [%DATE% %TIME%] [DEBUG] Timeout concluido, errorlevel: %TIMEOUT_RESULT% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Aguardamento concluido
echo [%DATE% %TIME%] [DEBUG] Aguardamento concluido >> "%LOG_FILE%" 2>&1

:after_frontend_wait
echo.
echo [DEBUG] Preparando para abrir navegador...
echo [%DATE% %TIME%] [DEBUG] Preparando para abrir navegador... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Abrindo navegador em %FRONTEND_URL%...
echo [%DATE% %TIME%] [DEBUG] Abrindo navegador em %FRONTEND_URL%... >> "%LOG_FILE%" 2>&1
start "" "%FRONTEND_URL%"
set "BROWSER_START_RESULT=%errorlevel%"
echo [DEBUG] Comando start retornou errorlevel: %BROWSER_START_RESULT%
echo [%DATE% %TIME%] [DEBUG] Comando start retornou errorlevel: %BROWSER_START_RESULT% >> "%LOG_FILE%" 2>&1
if %BROWSER_START_RESULT% neq 0 (
    echo [DEBUG] Erro ao abrir navegador, tentando metodo alternativo...
    echo [%DATE% %TIME%] [DEBUG] Erro ao abrir navegador, tentando metodo alternativo... >> "%LOG_FILE%" 2>&1
    start "" "%FRONTEND_URL%"
)
echo.
echo ✅ Frontend aberto no browser na porta %FRONTEND_PORT%!
echo [%DATE% %TIME%] Frontend aberto no browser na porta %FRONTEND_PORT%! >> "%LOG_FILE%" 2>&1
echo.
echo ✅ Projeto iniciado com sucesso!
echo [%DATE% %TIME%] Projeto iniciado com sucesso! >> "%LOG_FILE%" 2>&1
echo [DEBUG] Script chegou ao final com sucesso
echo [%DATE% %TIME%] [DEBUG] Script chegou ao final com sucesso >> "%LOG_FILE%" 2>&1
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

echo [2/3] Parando processos Node.js nas portas do projeto...
rem Fechar apenas processos nas portas específicas do projeto
rem Porta 5000 - Backend
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo    Fechando processo na porta 5000 (PID: %%a)
        taskkill /f /pid %%a 2>nul
    )
)
rem Porta 3003 - Frontend
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003" ^| findstr "LISTENING"') do (
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo    Fechando processo na porta 3003 (PID: %%a)
        taskkill /f /pid %%a 2>nul
    )
)
rem Porta 5173 - Frontend alternativo
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo    Fechando processo na porta 5173 (PID: %%a)
        taskkill /f /pid %%a 2>nul
    )
)
echo ✅ Processos Node.js nas portas do projeto parados
echo.

echo [3/3] Limpando processos restantes...
rem Não fechar todos os nodemon, apenas os relacionados ao projeto
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
       echo 4. Reiniciar o servidor PM2
echo.
echo ⚠️  NOTA: O servidor remoto deve estar acessível via SSH
echo    Certifique-se de que a chave SSH está configurada
echo.
       echo 💡 O script irá executar automaticamente:
       echo    - pm2 restart instructions-server
       echo.
       echo ℹ️  Migrations não são necessárias (usando Supabase)
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
       echo 4. PM2 está instalado e configurado no servidor
    echo 6. Verifique os erros acima para mais detalhes
    echo.
    echo 💡 Para verificar o status do servidor:
    echo    ssh servidor 'pm2 status'
    echo    ssh servidor 'pm2 logs instructions-server --lines 50'
    echo.
)

pause
goto menu

:install_deps
cls
echo ========================================
echo    INSTALAR DEPENDÊNCIAS
echo ========================================
echo.
echo Logs sendo salvos em: %LOG_FILE%
echo ======================================== >> "%LOG_FILE%"
echo [%DATE% %TIME%] INSTALANDO DEPENDÊNCIAS >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo.
echo Este processo irá instalar todas as dependências necessárias:
echo - Dependências do servidor (server/)
echo - Dependências do cliente (client/)
echo.
echo Isso pode demorar alguns minutos...
echo.
pause
echo.
echo ========================================
echo    INSTALANDO DEPENDÊNCIAS
echo ========================================
echo.
call :check_and_install_dependencies
set "INSTALL_RESULT=%errorlevel%"
echo.
if %INSTALL_RESULT% equ 0 (
    echo ========================================
    echo    ✅ DEPENDÊNCIAS INSTALADAS COM SUCESSO!
    echo ========================================
    echo.
    echo Todas as dependências foram instaladas corretamente.
    echo.
) else (
    echo ========================================
    echo    ❌ ERRO AO INSTALAR DEPENDÊNCIAS
    echo ========================================
    echo.
    echo Houve um erro ao instalar as dependências.
    echo Verifique as mensagens acima para mais detalhes.
    echo.
    echo 💡 Tente executar manualmente:
    echo    cd server ^&^& npm install
    echo    cd client ^&^& npm install
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

:check_pwa_updates
cls
echo ========================================
echo    VERIFICAR E ATUALIZAR PACOTES PWA
echo ========================================
echo.
echo [%DATE% %TIME%] Verificando atualizações dos pacotes PWA... >> "%LOG_FILE%"
echo Verificando atualizações disponíveis para os pacotes PWA e dependências principais...
echo.

rem Configurar NODE_OPTIONS para preferir IPv4
set "NODE_OPTIONS=--dns-result-order=ipv4first"

rem Mudar para o diretório do cliente
cd /d "%~dp0client"
if errorlevel 1 (
    echo ❌ Erro ao acessar o diretório client
    echo [%DATE% %TIME%] Erro ao acessar diretorio client >> "%LOG_FILE%"
    pause
    goto menu
)

echo ========================================
echo    [1/3] VERIFICANDO PACOTES PWA
echo ========================================
echo [%DATE% %TIME%] Verificando pacotes PWA... >> "%LOG_FILE%"
echo.

rem Verificar atualizações disponíveis
echo Verificando atualizações disponíveis...
call npm outdated vite-plugin-pwa @vite-pwa/assets-generator workbox-core workbox-precaching workbox-routing workbox-strategies > "%TEMP%\pwa_updates.txt" 2>&1
set "HAS_UPDATES=0"

rem Verificar se o arquivo contém linhas de pacotes desatualizados
rem npm outdated mostra pacotes desatualizados em linhas que começam com o nome do pacote
findstr /B /C:"vite-plugin-pwa" "%TEMP%\pwa_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_UPDATES=1"

findstr /B /C:"@vite-pwa/assets-generator" "%TEMP%\pwa_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_UPDATES=1"

findstr /B /C:"workbox-core" "%TEMP%\pwa_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_UPDATES=1"

findstr /B /C:"workbox-precaching" "%TEMP%\pwa_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_UPDATES=1"

findstr /B /C:"workbox-routing" "%TEMP%\pwa_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_UPDATES=1"

findstr /B /C:"workbox-strategies" "%TEMP%\pwa_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_UPDATES=1"

if "%HAS_UPDATES%"=="1" (
    echo ========================================
    echo    ATUALIZAÇÕES DISPONÍVEIS
    echo ========================================
    echo.
    type "%TEMP%\pwa_updates.txt"
    echo.
    echo ========================================
    echo.
    set /p UPDATE_CHOICE="Deseja atualizar os pacotes PWA? (S/N): "
    
    rem Remover espaços extras e converter para maiúscula para comparação
    set "UPDATE_CHOICE=%UPDATE_CHOICE: =%"
    if "%UPDATE_CHOICE%"=="" set "UPDATE_CHOICE=N"
    
    rem Aceitar S, s, SIM, sim, Y, y, YES, yes
    if /i "%UPDATE_CHOICE%"=="S" goto do_update
    if /i "%UPDATE_CHOICE%"=="SIM" goto do_update
    if /i "%UPDATE_CHOICE%"=="Y" goto do_update
    if /i "%UPDATE_CHOICE%"=="YES" goto do_update
    
    rem Se não for nenhuma das opções acima, cancelar
    echo.
    echo Atualização cancelada pelo usuário.
    echo [%DATE% %TIME%] Atualizacao cancelada pelo usuario >> "%LOG_FILE%"
    goto after_update_choice
    
:do_update
    echo.
    echo Atualizando pacotes PWA...
    echo [%DATE% %TIME%] Iniciando atualizacao dos pacotes PWA... >> "%LOG_FILE%"
    echo.
    
    rem Atualizar cada pacote individualmente para melhor controle
    echo Atualizando vite-plugin-pwa...
    call npm install vite-plugin-pwa@latest --save-dev
    if errorlevel 1 (
        echo ❌ Erro ao atualizar vite-plugin-pwa
        echo [%DATE% %TIME%] Erro ao atualizar vite-plugin-pwa >> "%LOG_FILE%"
    ) else (
        echo ✅ vite-plugin-pwa atualizado com sucesso
        echo [%DATE% %TIME%] vite-plugin-pwa atualizado com sucesso >> "%LOG_FILE%"
    )
    
    echo.
    echo Atualizando @vite-pwa/assets-generator...
    call npm install @vite-pwa/assets-generator@latest --save-dev
    if errorlevel 1 (
        echo ❌ Erro ao atualizar @vite-pwa/assets-generator
        echo [%DATE% %TIME%] Erro ao atualizar @vite-pwa/assets-generator >> "%LOG_FILE%"
    ) else (
        echo ✅ @vite-pwa/assets-generator atualizado com sucesso
        echo [%DATE% %TIME%] @vite-pwa/assets-generator atualizado com sucesso >> "%LOG_FILE%"
    )
    
    echo.
    echo Atualizando pacotes workbox...
    call npm install workbox-core@latest workbox-precaching@latest workbox-routing@latest workbox-strategies@latest --save-dev
    if errorlevel 1 (
        echo ❌ Erro ao atualizar pacotes workbox
        echo [%DATE% %TIME%] Erro ao atualizar pacotes workbox >> "%LOG_FILE%"
    ) else (
        echo ✅ Pacotes workbox atualizados com sucesso
        echo [%DATE% %TIME%] Pacotes workbox atualizados com sucesso >> "%LOG_FILE%"
    )
    
    echo.
    echo ========================================
    echo    ATUALIZAÇÃO CONCLUÍDA
    echo ========================================
    echo.
    echo ⚠️  IMPORTANTE: Após atualizar os pacotes PWA:
    echo    1. Verifique se há breaking changes nas versões major
    echo    2. Teste o service worker em desenvolvimento
    echo    3. Faça um novo build antes de fazer deploy
    echo.
    echo [%DATE% %TIME%] Atualizacao dos pacotes PWA concluida >> "%LOG_FILE%"
    
:after_update_choice
) else (
    echo ✅ Todos os pacotes PWA estão atualizados!
    echo [%DATE% %TIME%] Todos os pacotes PWA estao atualizados >> "%LOG_FILE%"
    echo.
    echo Nenhuma atualização disponível para:
    echo   - vite-plugin-pwa
    echo   - @vite-pwa/assets-generator
    echo   - workbox-core
    echo   - workbox-precaching
    echo   - workbox-routing
    echo   - workbox-strategies
)

rem Limpar arquivo temporário
del "%TEMP%\pwa_updates.txt" >nul 2>&1

echo.
echo ========================================
echo    [2/3] VERIFICANDO DEPENDÊNCIAS PRINCIPAIS
echo ========================================
echo [%DATE% %TIME%] Verificando dependencias principais... >> "%LOG_FILE%"
echo.

rem Verificar atualizações de dependências principais
echo Verificando: Vite, React, React-DOM, TailwindCSS, Vite Plugin React...
call npm outdated vite react react-dom tailwindcss @vitejs/plugin-react @tailwindcss/vite > "%TEMP%\main_updates.txt" 2>&1
set "HAS_MAIN_UPDATES=0"

findstr /B /C:"vite" "%TEMP%\main_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_MAIN_UPDATES=1"

findstr /B /C:"react" "%TEMP%\main_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_MAIN_UPDATES=1"

findstr /B /C:"react-dom" "%TEMP%\main_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_MAIN_UPDATES=1"

findstr /B /C:"tailwindcss" "%TEMP%\main_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_MAIN_UPDATES=1"

findstr /B /C:"@vitejs/plugin-react" "%TEMP%\main_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_MAIN_UPDATES=1"

findstr /B /C:"@tailwindcss/vite" "%TEMP%\main_updates.txt" >nul 2>&1
if not errorlevel 1 set "HAS_MAIN_UPDATES=1"

if "%HAS_MAIN_UPDATES%"=="1" (
    echo ⚠️  Atualizações disponíveis para dependências principais:
    echo.
    type "%TEMP%\main_updates.txt"
    echo.
    echo ℹ️  Nota: Estas atualizações podem incluir breaking changes.
    echo    Revise o changelog antes de atualizar.
    echo.
) else (
    echo ✅ Todas as dependências principais estão atualizadas!
    echo.
)

del "%TEMP%\main_updates.txt" >nul 2>&1

echo ========================================
echo    [3/3] VERIFICANDO STATUS DO PWA
echo ========================================
echo [%DATE% %TIME%] Verificando status do PWA... >> "%LOG_FILE%"
echo.

rem Verificar se o service worker existe
if exist "public\sw.js" (
    echo ✅ Service Worker encontrado: public\sw.js
    echo [%DATE% %TIME%] Service Worker encontrado >> "%LOG_FILE%"
) else (
    echo ⚠️  Service Worker não encontrado em public\sw.js
    echo [%DATE% %TIME%] Service Worker nao encontrado >> "%LOG_FILE%"
)

rem Verificar se o manifest existe no build
if exist "dist\manifest.webmanifest" (
    echo ✅ Manifest encontrado no build: dist\manifest.webmanifest
    echo [%DATE% %TIME%] Manifest encontrado no build >> "%LOG_FILE%"
) else (
    echo ⚠️  Manifest não encontrado no build (execute 'npm run build' primeiro)
    echo [%DATE% %TIME%] Manifest nao encontrado no build >> "%LOG_FILE%"
)

rem Verificar versão do projeto
if exist "package.json" (
    echo.
    echo 📦 Versão do projeto:
    findstr /C:"\"version\"" "package.json"
    echo [%DATE% %TIME%] Versao do projeto verificada >> "%LOG_FILE%"
)

rem Verificar se há build recente
if exist "dist" (
    echo.
    echo 📁 Diretório dist encontrado
    echo    Execute 'npm run build' para gerar uma nova versão do PWA
    echo [%DATE% %TIME%] Diretorio dist encontrado >> "%LOG_FILE%"
) else (
    echo.
    echo ⚠️  Diretório dist não encontrado
    echo    Execute 'npm run build' para criar o build de produção
    echo [%DATE% %TIME%] Diretorio dist nao encontrado >> "%LOG_FILE%"
)

echo.
echo ========================================
echo    VERIFICAÇÃO CONCLUÍDA
echo ========================================
echo.
echo 💡 Próximos passos recomendados:
echo    1. Se houver atualizações, revise os changelogs
echo    2. Teste localmente após atualizar
echo    3. Execute 'npm run build' para gerar novo build
echo    4. Teste o service worker antes de fazer deploy
echo.

rem Voltar ao diretório raiz
cd /d "%~dp0"
echo.
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
echo [DEBUG] Iniciando verificacao de dependencias...
echo [%DATE% %TIME%] [DEBUG] Iniciando verificacao de dependencias... >> "%LOG_FILE%" 2>&1

rem Verificar se npm está disponível
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: npm não encontrado no PATH!
    echo [%DATE% %TIME%] ERRO: npm nao encontrado no PATH >> "%LOG_FILE%" 2>&1
    echo    -> Certifique-se de que Node.js está instalado e npm está no PATH
    pause
    exit /b 1
)
echo [DEBUG] npm encontrado e disponivel
echo [%DATE% %TIME%] [DEBUG] npm encontrado e disponivel >> "%LOG_FILE%" 2>&1

rem Verificar se diretórios existem
if not exist "%~dp0server" (
    echo ❌ ERRO: Diretório server não encontrado!
    echo [%DATE% %TIME%] ERRO: Diretorio server nao encontrado >> "%LOG_FILE%" 2>&1
    pause
    exit /b 1
)
if not exist "%~dp0client" (
    echo ❌ ERRO: Diretório client não encontrado!
    echo [%DATE% %TIME%] ERRO: Diretorio client nao encontrado >> "%LOG_FILE%" 2>&1
    pause
    exit /b 1
)
echo [DEBUG] Diretorios server e client encontrados
echo [%DATE% %TIME%] [DEBUG] Diretorios server e client encontrados >> "%LOG_FILE%" 2>&1

echo [1/3] Verificando dependências do servidor...
echo [%DATE% %TIME%] [1/3] Verificando dependencias do servidor... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Tentando acessar diretorio server...
echo [%DATE% %TIME%] [DEBUG] Tentando acessar diretorio server... >> "%LOG_FILE%" 2>&1
cd /d "%~dp0server"
set "CD_SERVER_RESULT=%errorlevel%"
echo [DEBUG] cd para server retornou: %CD_SERVER_RESULT%
echo [%DATE% %TIME%] [DEBUG] cd para server retornou: %CD_SERVER_RESULT% >> "%LOG_FILE%" 2>&1
if %CD_SERVER_RESULT% neq 0 (
    echo ❌ ERRO: Não foi possível acessar o diretório server
    echo [%DATE% %TIME%] ERRO: Nao foi possivel acessar diretorio server >> "%LOG_FILE%" 2>&1
    echo [DEBUG] Pausando antes de sair...
    pause
    exit /b 1
)
echo [DEBUG] Diretorio server acessado com sucesso. Diretorio atual: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio server acessado com sucesso: %CD% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando se node_modules existe...
echo [%DATE% %TIME%] [DEBUG] Verificando se node_modules existe... >> "%LOG_FILE%" 2>&1
set "SERVER_NEED_INSTALL=0"
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado no servidor. Instalando dependências...
    echo [%DATE% %TIME%] node_modules nao encontrado no servidor >> "%LOG_FILE%" 2>&1
    set "SERVER_NEED_INSTALL=1"
    echo [DEBUG] SERVER_NEED_INSTALL definido como 1
) else (
    echo [DEBUG] node_modules encontrado, verificando dependencias criticas...
    echo [%DATE% %TIME%] [DEBUG] node_modules encontrado, verificando dependencias criticas... >> "%LOG_FILE%" 2>&1
    rem Verificar se dependências críticas estão instaladas
    if not exist "node_modules\sharp" (
        echo ⚠️  sharp não encontrado. Reinstalando dependências...
        echo [%DATE% %TIME%] sharp nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\sequelize" (
        echo ⚠️  sequelize não encontrado. Reinstalando dependências...
        echo [%DATE% %TIME%] sequelize nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\express" (
        echo ⚠️  express não encontrado. Reinstalando dependências...
        echo [%DATE% %TIME%] express nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\pg" (
        echo ⚠️  pg não encontrado. Reinstalando dependências...
        echo [%DATE% %TIME%] pg nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
)
echo [DEBUG] Verificacao concluida. SERVER_NEED_INSTALL=%SERVER_NEED_INSTALL%
echo [%DATE% %TIME%] [DEBUG] Verificacao concluida. SERVER_NEED_INSTALL=%SERVER_NEED_INSTALL% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando se precisa instalar servidor...
echo [%DATE% %TIME%] [DEBUG] Verificando se precisa instalar servidor... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Valor de SERVER_NEED_INSTALL: [%SERVER_NEED_INSTALL%]
echo [%DATE% %TIME%] [DEBUG] Valor de SERVER_NEED_INSTALL: [%SERVER_NEED_INSTALL%] >> "%LOG_FILE%" 2>&1
echo [DEBUG] Testando comparacao antes do IF...
echo [%DATE% %TIME%] [DEBUG] Testando comparacao antes do IF... >> "%LOG_FILE%" 2>&1

rem Usar goto condicional em vez de if/else para evitar problemas
if "%SERVER_NEED_INSTALL%"=="1" goto install_server
goto skip_server_install

:install_server
echo [DEBUG] Comparacao string: SERVER_NEED_INSTALL == 1 - VERDADEIRO
echo [%DATE% %TIME%] [DEBUG] Comparacao string: SERVER_NEED_INSTALL == 1 - VERDADEIRO >> "%LOG_FILE%" 2>&1
echo [DEBUG] SERVER_NEED_INSTALL=1, entrando no bloco de instalacao...
echo [%DATE% %TIME%] [DEBUG] SERVER_NEED_INSTALL=1, entrando no bloco de instalacao... >> "%LOG_FILE%" 2>&1
echo 🔄 Instalando dependências do servidor...
echo [%DATE% %TIME%] Instalando dependencias do servidor... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Diretorio atual antes de instalar: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio atual antes de instalar: %CD% >> "%LOG_FILE%" 2>&1
set "INSTALL_ERROR=0"
if exist "package-lock.json" (
    echo    Usando npm ci (instalação limpa baseada em package-lock.json)...
    echo [%DATE% %TIME%] Executando npm ci no servidor... >> "%LOG_FILE%" 2>&1
    echo [DEBUG] Executando: npm ci
    npm ci
    set "INSTALL_ERROR=%errorlevel%"
    echo [DEBUG] npm ci retornou errorlevel: %INSTALL_ERROR%
    echo [%DATE% %TIME%] [DEBUG] npm ci retornou errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    if %INSTALL_ERROR% neq 0 (
        echo ⚠️  npm ci falhou, tentando npm install...
        echo [%DATE% %TIME%] npm ci falhou (errorlevel: %INSTALL_ERROR%), tentando npm install... >> "%LOG_FILE%" 2>&1
        echo [DEBUG] Executando: npm install
        npm install
        set "INSTALL_ERROR=%errorlevel%"
        echo [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR%
        echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    )
) else (
    echo    Usando npm install...
    echo [%DATE% %TIME%] Executando npm install no servidor... >> "%LOG_FILE%" 2>&1
    echo [DEBUG] Executando: npm install
    npm install
    set "INSTALL_ERROR=%errorlevel%"
    echo [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR%
    echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
)
if %INSTALL_ERROR% neq 0 (
    echo ❌ Erro ao instalar dependências do servidor (errorlevel: %INSTALL_ERROR%)
    echo [%DATE% %TIME%] ERRO ao instalar dependencias do servidor (errorlevel: %INSTALL_ERROR%) >> "%LOG_FILE%" 2>&1
    echo    -> Tente executar manualmente: cd server ^&^& npm install
    echo [DEBUG] Pausando antes de sair...
    pause
    cd /d "%~dp0"
    exit /b 1
)
echo [%DATE% %TIME%] Dependencias do servidor instaladas com sucesso >> "%LOG_FILE%" 2>&1
echo ✅ Dependências do servidor instaladas com sucesso!
rem Verificar novamente após instalação
if not exist "node_modules\sharp" (
    echo ❌ AVISO: sharp ainda não foi instalado após npm install
    echo    -> Execute manualmente: cd server ^&^& npm install sharp
    echo    -> O servidor pode não iniciar sem esta dependência!
)
goto after_server_check

:skip_server_install
echo [DEBUG] Comparacao string: SERVER_NEED_INSTALL != 1 - FALSO, pulando instalacao
echo [%DATE% %TIME%] [DEBUG] Comparacao string: SERVER_NEED_INSTALL != 1 - FALSO, pulando instalacao >> "%LOG_FILE%" 2>&1
echo [DEBUG] Servidor nao precisa instalar
echo [%DATE% %TIME%] [DEBUG] Servidor nao precisa instalar >> "%LOG_FILE%" 2>&1
echo ✅ Dependências do servidor já instaladas
echo [%DATE% %TIME%] Dependencias do servidor ja instaladas >> "%LOG_FILE%" 2>&1
echo [DEBUG] SERVER_NEED_INSTALL=0, pulando instalacao do servidor...
echo [%DATE% %TIME%] [DEBUG] SERVER_NEED_INSTALL=0, pulando instalacao do servidor... >> "%LOG_FILE%" 2>&1

:after_server_check
echo [DEBUG] Apos o IF/ELSE do servidor...
echo [%DATE% %TIME%] [DEBUG] Apos o IF/ELSE do servidor... >> "%LOG_FILE%" 2>&1
echo.
echo [DEBUG] Continuando para verificacao do cliente...
echo [%DATE% %TIME%] [DEBUG] Continuando para verificacao do cliente... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Linha de continuacao executada com sucesso
echo [%DATE% %TIME%] [DEBUG] Linha de continuacao executada com sucesso >> "%LOG_FILE%" 2>&1

echo [2/3] Verificando dependências do cliente...
echo [%DATE% %TIME%] [2/3] Verificando dependencias do cliente... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Tentando acessar diretorio client...
echo [%DATE% %TIME%] [DEBUG] Tentando acessar diretorio client... >> "%LOG_FILE%" 2>&1
cd /d "%~dp0client"
set "CD_CLIENT_RESULT=%errorlevel%"
echo [DEBUG] cd para client retornou: %CD_CLIENT_RESULT%
echo [%DATE% %TIME%] [DEBUG] cd para client retornou: %CD_CLIENT_RESULT% >> "%LOG_FILE%" 2>&1
if %CD_CLIENT_RESULT% neq 0 (
    echo ❌ ERRO: Não foi possível acessar o diretório client
    echo [%DATE% %TIME%] ERRO: Nao foi possivel acessar diretorio client >> "%LOG_FILE%" 2>&1
    echo [DEBUG] Pausando antes de sair...
    pause
    cd /d "%~dp0"
    exit /b 1
)
echo [DEBUG] Diretorio client acessado com sucesso. Diretorio atual: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio client acessado com sucesso: %CD% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando se node_modules existe no cliente...
echo [%DATE% %TIME%] [DEBUG] Verificando se node_modules existe no cliente... >> "%LOG_FILE%" 2>&1
set "NEED_INSTALL=0"
if not exist "node_modules" (
    echo ⚠️  node_modules não encontrado no cliente. Instalando dependências...
    echo [%DATE% %TIME%] node_modules nao encontrado no cliente >> "%LOG_FILE%" 2>&1
    set "NEED_INSTALL=1"
    echo [DEBUG] NEED_INSTALL definido como 1
) else (
    echo [DEBUG] node_modules encontrado no cliente, verificando dependencias criticas...
    echo [%DATE% %TIME%] [DEBUG] node_modules encontrado no cliente, verificando dependencias criticas... >> "%LOG_FILE%" 2>&1
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
echo [DEBUG] Verificacao do cliente concluida. NEED_INSTALL=%NEED_INSTALL%
echo [%DATE% %TIME%] [DEBUG] Verificacao do cliente concluida. NEED_INSTALL=%NEED_INSTALL% >> "%LOG_FILE%" 2>&1

rem Usar goto condicional em vez de if/else para evitar problemas
if "%NEED_INSTALL%"=="1" goto install_client
goto skip_client_install

:install_client
echo [DEBUG] NEED_INSTALL=1, entrando no bloco de instalacao do cliente...
echo [%DATE% %TIME%] [DEBUG] NEED_INSTALL=1, entrando no bloco de instalacao do cliente... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Diretorio atual antes de instalar cliente: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio atual antes de instalar cliente: %CD% >> "%LOG_FILE%" 2>&1
set "CLIENT_INSTALL_ERROR=0"
if exist "package-lock.json" (
        echo 🔄 Instalando dependências do cliente com npm ci...
        echo [%DATE% %TIME%] Instalando dependencias do cliente com npm ci... >> "%LOG_FILE%" 2>&1
        echo [DEBUG] Executando: npm ci
        npm ci
        set "CLIENT_INSTALL_ERROR=%errorlevel%"
        echo [DEBUG] npm ci retornou errorlevel: %CLIENT_INSTALL_ERROR%
        echo [%DATE% %TIME%] [DEBUG] npm ci retornou errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        if %CLIENT_INSTALL_ERROR% neq 0 (
            echo ⚠️  npm ci falhou, tentando npm install...
            echo [%DATE% %TIME%] npm ci falhou (errorlevel: %CLIENT_INSTALL_ERROR%), tentando npm install... >> "%LOG_FILE%" 2>&1
            echo [DEBUG] Executando: npm install
            npm install
            set "CLIENT_INSTALL_ERROR=%errorlevel%"
            echo [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR%
            echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        )
    ) else (
        echo 🔄 Instalando dependências do cliente com npm install...
        echo [%DATE% %TIME%] Instalando dependencias do cliente com npm install... >> "%LOG_FILE%" 2>&1
        echo [DEBUG] Executando: npm install
        npm install
        set "CLIENT_INSTALL_ERROR=%errorlevel%"
        echo [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR%
        echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    )
    if %CLIENT_INSTALL_ERROR% neq 0 (
        echo ❌ Erro ao instalar dependências do cliente (errorlevel: %CLIENT_INSTALL_ERROR%)
        echo [%DATE% %TIME%] ERRO ao instalar dependencias do cliente (errorlevel: %CLIENT_INSTALL_ERROR%) >> "%LOG_FILE%" 2>&1
        echo    -> Tente executar manualmente: cd client ^&^& npm install
        echo [DEBUG] Pausando antes de sair...
        pause
        cd /d "%~dp0"
        exit /b 1
    )
    echo [%DATE% %TIME%] Dependencias do cliente instaladas com sucesso >> "%LOG_FILE%" 2>&1
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
goto after_client_check

:skip_client_install
echo [DEBUG] NEED_INSTALL != 1 - FALSO, pulando instalacao do cliente
echo [%DATE% %TIME%] [DEBUG] NEED_INSTALL != 1 - FALSO, pulando instalacao do cliente >> "%LOG_FILE%" 2>&1
echo ✅ Dependências do cliente já instaladas
echo [%DATE% %TIME%] Dependencias do cliente ja instaladas >> "%LOG_FILE%" 2>&1

:after_client_check
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
echo [%DATE% %TIME%] Verificacao de dependencias concluida com sucesso >> "%LOG_FILE%" 2>&1
echo [DEBUG] Retornando ao diretorio raiz...
cd /d "%~dp0"
set "CD_ROOT_RESULT=%errorlevel%"
echo [DEBUG] cd para raiz retornou: %CD_ROOT_RESULT%
echo [%DATE% %TIME%] [DEBUG] cd para raiz retornou: %CD_ROOT_RESULT% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Funcao check_and_install_dependencies concluida com sucesso
echo [%DATE% %TIME%] [DEBUG] Funcao check_and_install_dependencies concluida com sucesso >> "%LOG_FILE%" 2>&1
exit /b 0

rem =====================
rem Paragem rápida (silenciosa) para reinício
rem =====================

:stop_quick
call :detect_docker >nul 2>&1
if "%DOCKER_AVAILABLE%"=="1" (
    %COMPOSE_CMD% -f "%~dp0docker-compose.dev.yml" down >nul 2>&1
)

rem Fechar apenas processos nas portas específicas do projeto
rem Porta 5000 - Backend
echo [DEBUG] Verificando processos na porta 5000 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [DEBUG] Encontrado processo na porta 5000: PID %%a
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo [DEBUG] Fechando processo Node.js na porta 5000 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

rem Porta 3003 - Frontend
echo [DEBUG] Verificando processos na porta 3003 (frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003" ^| findstr "LISTENING"') do (
    echo [DEBUG] Encontrado processo na porta 3003: PID %%a
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo [DEBUG] Fechando processo Node.js na porta 3003 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

rem Também verificar porta 5173 caso esteja em uso (fallback do Vite)
echo [DEBUG] Verificando processos na porta 5173 (frontend alternativo)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo [DEBUG] Encontrado processo na porta 5173: PID %%a
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo [DEBUG] Fechando processo Node.js na porta 5173 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

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