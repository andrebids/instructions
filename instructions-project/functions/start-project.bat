@echo off
setlocal enabledelayedexpansion
rem =====================
rem Iniciar projeto completo
rem =====================

rem Garantir que LOG_FILE está definido (portabilidade entre computadores)
if not defined LOG_FILE (
    rem Calcular diretório raiz do projeto (um nível acima de functions)
    pushd "%~dp0.."
    set "LOG_FILE=%CD%\project-manager.log"
    popd
)

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
call "%~dp0process-utils.bat" :stop_quick
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

rem Verificar pré-requisitos (Node, npm)
echo [DEBUG] Verificando pre-requisitos...
echo [%DATE% %TIME%] [DEBUG] Verificando pre-requisitos... >> "%LOG_FILE%"
call "%~dp0prereqs-utils.bat" :ensure_prereqs
set "PREREQS_RESULT=%errorlevel%"
echo [%DATE% %TIME%] [DEBUG] ensure_prereqs retornou: %PREREQS_RESULT% >> "%LOG_FILE%"
if %PREREQS_RESULT% neq 0 (
    echo [DEBUG] ERRO: Pre-requisitos nao atendidos
    echo [%DATE% %TIME%] [DEBUG] ERRO: Pre-requisitos nao atendidos >> "%LOG_FILE%"
    pause
    exit /b 1
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
call "%~dp0dependencies-utils.bat" :check_and_install_dependencies
set "DEPS_RESULT=%errorlevel%"
echo [DEBUG] check_and_install_dependencies retornou: %DEPS_RESULT%
echo [%DATE% %TIME%] [DEBUG] check_and_install_dependencies retornou: %DEPS_RESULT% >> "%LOG_FILE%" 2>&1
if %DEPS_RESULT% neq 0 (
    echo.
    echo ERRO: Erro ao instalar dependencias
    echo    Verifique as mensagens acima para mais detalhes
    echo [DEBUG] Pausando antes de voltar ao menu...
    echo [%DATE% %TIME%] [DEBUG] Pausando antes de voltar ao menu... >> "%LOG_FILE%" 2>&1
    pause
    exit /b 1
)
echo.
echo OK: Dependencias verificadas e instaladas!
echo [%DATE% %TIME%] Dependencias verificadas e instaladas! >> "%LOG_FILE%" 2>&1
echo.
echo [DEBUG] Dependencias OK, aguardando 2 segundos...
echo [%DATE% %TIME%] [DEBUG] Dependencias OK, aguardando 2 segundos... >> "%LOG_FILE%" 2>&1
timeout /t 2 /nobreak >nul
echo [DEBUG] Continuando apos dependencias...
echo [%DATE% %TIME%] [DEBUG] Continuando apos dependencias... >> "%LOG_FILE%" 2>&1
echo.

rem Definir diretório raiz do projeto de forma portável
rem Navegar para o diretório pai (raiz do projeto) e capturar o caminho
pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"
popd

rem Garantir que estamos na raiz do projeto antes de comandos subsequentes
cd /d "%PROJECT_ROOT%"
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
echo AVISO: MODO TESTE - Verificacoes de base de dados e migrations desativadas
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
    echo OK: Backend ja esta a correr na porta 5000
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
set "BACKEND_DIR=%PROJECT_ROOT%\server"
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
    exit /b 1
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
echo OK: Servidor backend iniciado em http://localhost:5000
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
    if "!BACKEND_ONLINE!"=="0" (
        curl -s -m 3 http://localhost:5000/health >nul 2>&1
        if not errorlevel 1 (
            set "BACKEND_ONLINE=1"
            echo OK: Backend esta online e respondendo!
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
    echo AVISO: Backend pode nao estar totalmente pronto
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
    echo OK: Frontend ja esta a correr na porta 3003
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
                echo OK: Frontend ja esta a correr na porta %%P
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
set "FRONTEND_DIR=%PROJECT_ROOT%\client"
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
echo OK: Cliente frontend iniciado
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
echo Backend:  http://localhost:5000
echo Database: localhost:5433
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
    echo OK: Frontend detectado na porta 3003
    echo [%DATE% %TIME%] [DEBUG] Frontend detectado na porta 3003 >> "%LOG_FILE%" 2>&1
    goto frontend_port_detected
)

rem Verificar outras portas comuns do Vite
for %%P in (5173 4173 3000 3001 3002 3005) do (
    if "!FRONTEND_FOUND!"=="0" (
        echo [DEBUG] Testando porta %%P...
        curl -s -m 2 http://localhost:%%P >nul 2>&1
        if not errorlevel 1 (
            set "FRONTEND_PORT=%%P"
            set "FRONTEND_FOUND=1"
            echo OK: Frontend detectado na porta %%P
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
    echo OK: Frontend ja estava a correr na porta %FRONTEND_PORT%
    echo [%DATE% %TIME%] [DEBUG] Frontend ja estava a correr na porta %FRONTEND_PORT% >> "%LOG_FILE%" 2>&1
    goto after_frontend_wait
)
echo [DEBUG] Apos o IF - FRONTEND_ALREADY_RUNNING nao e 1, continuando...
echo [%DATE% %TIME%] [DEBUG] Apos o IF - FRONTEND_ALREADY_RUNNING nao e 1, continuando... >> "%LOG_FILE%" 2>&1

rem Se chegou aqui, frontend foi iniciado agora
echo [DEBUG] Entrando no bloco de aguardar frontend...
echo [%DATE% %TIME%] [DEBUG] Entrando no bloco de aguardar frontend... >> "%LOG_FILE%" 2>&1
echo Frontend: %FRONTEND_URL%
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
echo OK: Frontend aberto no browser na porta %FRONTEND_PORT%!
echo [%DATE% %TIME%] Frontend aberto no browser na porta %FRONTEND_PORT%! >> "%LOG_FILE%" 2>&1
echo.
echo OK: Projeto iniciado com sucesso!
echo [%DATE% %TIME%] Projeto iniciado com sucesso! >> "%LOG_FILE%" 2>&1
echo [DEBUG] Script chegou ao final com sucesso
echo [%DATE% %TIME%] [DEBUG] Script chegou ao final com sucesso >> "%LOG_FILE%" 2>&1
echo.
echo NOTA: Se aparecerem erros 500 (Internal Server Error) no frontend,
echo    verifique:
echo    1. Backend está a correr (janela "Backend Server")
echo    2. Se falta 'sharp': execute cd server ^&^& npm install
echo    3. Se tabelas não existem: execute cd server ^&^& npm run setup
echo.
echo NOTA 2: Se aparecer "ECONNREFUSED" no frontend,
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
exit /b 0

