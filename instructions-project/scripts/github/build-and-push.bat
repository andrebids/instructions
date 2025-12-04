@echo off
REM ============================================
REM Build and push Docker image to GitHub Packages
REM ============================================

REM Jump to main code immediately (skip function definitions)
goto :main

REM Define simple wrapper functions (no colors, direct echo)
:print_color
echo %*
goto :eof

:print_success
echo [OK] %*
goto :eof

:print_error
echo [ERRO] %*
goto :eof

:print_warning
echo [AVISO] %*
goto :eof

:print_info
echo [INFO] %*
goto :eof

:print_header
echo.
echo ========================================
echo %*
echo ========================================
echo.
goto :eof

:print_separator
echo.
echo ---------------------------------------
echo.
goto :eof

:write_log
if "%LOG_FILE%"=="" (
    echo [DEBUG] write_log: LOG_FILE nao definido
    goto :eof
)
if not exist "%LOG_FILE%" (
    echo [DEBUG] write_log: Arquivo nao existe: %LOG_FILE%
    goto :eof
)
setlocal enabledelayedexpansion
set "MSG=%~1"
if "!MSG!"=="" (
    endlocal
    goto :eof
)
REM Get current timestamp using wmic for reliability
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value 2^>nul') do set "DT=%%a"
if "!DT!"=="" (
    REM Fallback to date/time commands
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"
) else (
    set "LOG_DATE=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!"
    set "LOG_TIME=!DT:~8,2!:!DT:~10,2!"
)
REM Write to log file
echo [!LOG_DATE! !LOG_TIME!] !MSG! >> "%LOG_FILE%" 2>&1
if !ERRORLEVEL! neq 0 (
    echo [DEBUG] write_log: Erro ao escrever no log
)
endlocal
goto :eof

REM Load docker-check functions (don't call directly, functions will be called individually)
REM call "%UTILS_DIR%docker-check.bat" >nul 2>&1

:check_docker_installed
call "%UTILS_DIR%docker-check.bat" :check_docker_installed
goto :eof

:check_docker_running
call "%UTILS_DIR%docker-check.bat" :check_docker_running
goto :eof

:check_docker_compose
call "%UTILS_DIR%docker-check.bat" :check_docker_compose
goto :eof

:check_project_directory
call "%UTILS_DIR%docker-check.bat" :check_project_directory
goto :eof

:check_all_docker
echo [DEBUG] Dentro de check_all_docker, chamando docker-check.bat...
call "%UTILS_DIR%docker-check.bat" :check_all_docker
set "CHECK_RESULT=%ERRORLEVEL%"
echo [DEBUG] check_all_docker retornou: %CHECK_RESULT%
exit /b %CHECK_RESULT%

REM ============================================
REM MAIN CODE STARTS HERE - Skip all function definitions above
REM ============================================
:main
setlocal enabledelayedexpansion
echo [DEBUG] Script iniciado

REM Load common functions
set "UTILS_DIR=%~dp0..\utils\"
echo [DEBUG] UTILS_DIR = %UTILS_DIR%

REM Get project root (go up from scripts/github/ to project root)
echo [DEBUG] Obtendo diretorio do projeto...
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
cd /d "%PROJECT_ROOT%"
echo [DEBUG] Diretorio do projeto: %PROJECT_ROOT%

REM Initialize log file using dedicated script (MUST BE FIRST!)
echo [DEBUG] Inicializando arquivo de log...
call "%UTILS_DIR%init-log.bat"
set "INIT_LOG_RESULT=%ERRORLEVEL%"
echo [DEBUG] init-log.bat retornou: %INIT_LOG_RESULT%
echo [DEBUG] LOG_FILE = %LOG_FILE%

if %INIT_LOG_RESULT% neq 0 (
    echo [ERRO] Falha ao inicializar arquivo de log
    exit /b 1
)

REM Debug: Show LOG_FILE value
if "%LOG_FILE%"=="" (
    echo [ERRO] LOG_FILE nao foi definido pelo init-log.bat
    exit /b 1
)
echo [DEBUG] LOG_FILE definido: %LOG_FILE%
echo [DEBUG] Continuando execucao do script...

REM Verify log file was created and LOG_FILE is set
if not exist "%LOG_FILE%" (
    echo [ERRO] Arquivo de log nao existe: %LOG_FILE%
    exit /b 1
)

echo [OK] Arquivo de log encontrado: %LOG_FILE%
echo [INFO] Arquivo de log inicializado: %LOG_FILE%

REM Write initial entry using direct echo to ensure it works
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value 2^>nul') do set "DT=%%a"
if "!DT!"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"
) else (
    set "LOG_DATE=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!"
    set "LOG_TIME=!DT:~8,2!:!DT:~10,2!"
)

echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Build e Push para GitHub Packages >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Processo iniciado >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Write to log directly before calling functions
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value 2^>nul') do set "DT=%%a"
if "!DT!"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"
) else (
    set "LOG_DATE=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!"
    set "LOG_TIME=!DT:~8,2!:!DT:~10,2!"
)

echo [!LOG_DATE! !LOG_TIME!] Iniciando verificacoes Docker... >> "%LOG_FILE%"
echo [DEBUG] Verificando Docker...
echo.
echo ========================================
echo Build e Push para GitHub Packages
echo ========================================
echo.

REM Check Docker prerequisites
echo [!LOG_DATE! !LOG_TIME!] Verificando pre-requisitos Docker... >> "%LOG_FILE%"
echo [INFO] Verificando Docker...
call :check_all_docker
set "DOCKER_CHECK_RESULT=%ERRORLEVEL%"
echo [DEBUG] Docker check result: %DOCKER_CHECK_RESULT%

if %DOCKER_CHECK_RESULT% equ 0 (
    echo [!LOG_DATE! !LOG_TIME!] Pre-requisitos Docker OK >> "%LOG_FILE%"
    echo [OK] Docker OK, continuando...
) else (
    echo [!LOG_DATE! !LOG_TIME!] ERRO: Verificacoes Docker falharam >> "%LOG_FILE%"
    echo [ERRO] Verificacoes Docker falharam
    echo [ERRO] Verificacoes falharam. Abortando.
    exit /b 1
)

REM Step 1: Load GitHub credentials
echo. >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Passo 1/7: Carregando credenciais do GitHub... >> "%LOG_FILE%"
echo [DEBUG] Passo 1: Carregando credenciais...
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 1/7: Carregando credenciais do GitHub...
set "LOGIN_SCRIPT=%~dp0login.bat"
echo [DEBUG] Chamando login.bat...
echo [DEBUG] LOGIN_SCRIPT = %LOGIN_SCRIPT%
call "%LOGIN_SCRIPT%" :load_github_credentials
set "LOAD_CREDS_RESULT=!ERRORLEVEL!"
echo [DEBUG] load_github_credentials retornou: !LOAD_CREDS_RESULT!
echo [DEBUG] Continuando apos chamada do login.bat...
echo [!LOG_DATE! !LOG_TIME!] Resultado do load_github_credentials: !LOAD_CREDS_RESULT! >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Continuando execucao apos load_github_credentials >> "%LOG_FILE%"
echo [DEBUG] Verificando LOAD_CREDS_RESULT: !LOAD_CREDS_RESULT!
echo [!LOG_DATE! !LOG_TIME!] LOAD_CREDS_RESULT: !LOAD_CREDS_RESULT! >> "%LOG_FILE%"

if !LOAD_CREDS_RESULT! equ 0 (
    echo [DEBUG] Entrando no bloco if (LOAD_CREDS_RESULT = 0)
    echo [!LOG_DATE! !LOG_TIME!] Entrando no bloco if >> "%LOG_FILE%"
    echo [!LOG_DATE! !LOG_TIME!] Carregando credenciais do arquivo .env >> "%LOG_FILE%"
    REM Read directly from .env file (simpler and more reliable)
    set "ENV_FILE=%PROJECT_ROOT%\.env"
    echo [DEBUG] Lendo arquivo .env: %ENV_FILE%
    echo [!LOG_DATE! !LOG_TIME!] Lendo arquivo .env: %ENV_FILE% >> "%LOG_FILE%"
    
    if exist "%ENV_FILE%" (
        echo [DEBUG] Arquivo .env encontrado, extraindo credenciais GitHub...
        echo [!LOG_DATE! !LOG_TIME!] Arquivo .env encontrado >> "%LOG_FILE%"
        REM Create a small temp file with only GitHub lines (avoids reading entire file)
        set "GITHUB_TEMP=%TEMP%\github_vars_%RANDOM%.tmp"
        findstr /b /i "GITHUB_" "%ENV_FILE%" > "%GITHUB_TEMP%" 2>nul
        echo [DEBUG] Arquivo temporario criado: %GITHUB_TEMP%
        echo [!LOG_DATE! !LOG_TIME!] Arquivo temporario criado >> "%LOG_FILE%"
        
        REM Read from the small temp file (only 3 lines)
        if exist "%GITHUB_TEMP%" (
            for /f "usebackq tokens=1,* delims==" %%a in ("%GITHUB_TEMP%") do (
                if /i "%%a"=="GITHUB_USERNAME" (
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_USERNAME=%%v"
                    echo [DEBUG] GITHUB_USERNAME definido: !GITHUB_USERNAME!
                    echo [!LOG_DATE! !LOG_TIME!] GITHUB_USERNAME=!GITHUB_USERNAME! >> "%LOG_FILE%"
                )
                if /i "%%a"=="GITHUB_TOKEN" (
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_TOKEN=%%v"
                    echo [DEBUG] GITHUB_TOKEN definido (primeiros 5): !GITHUB_TOKEN:~0,5!...
                    echo [!LOG_DATE! !LOG_TIME!] GITHUB_TOKEN definido >> "%LOG_FILE%"
                )
                if /i "%%a"=="GITHUB_REPO" (
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_REPO=%%v"
                    echo [DEBUG] GITHUB_REPO definido: !GITHUB_REPO!
                    echo [!LOG_DATE! !LOG_TIME!] GITHUB_REPO=!GITHUB_REPO! >> "%LOG_FILE%"
                )
            )
            del "%GITHUB_TEMP%" >nul 2>&1
            echo [DEBUG] Arquivo temporario removido
        )
        echo [DEBUG] Terminando leitura do arquivo .env
        echo [!LOG_DATE! !LOG_TIME!] Leitura do arquivo .env concluida >> "%LOG_FILE%"
    ) else (
        echo [ERRO] Arquivo .env nao encontrado: %ENV_FILE%
        echo [!LOG_DATE! !LOG_TIME!] ERRO: Arquivo .env nao encontrado: %ENV_FILE% >> "%LOG_FILE%"
        exit /b 1
    )
    
    echo [!LOG_DATE! !LOG_TIME!] Credenciais carregadas com sucesso >> "%LOG_FILE%"
    echo [DEBUG] GITHUB_USERNAME = !GITHUB_USERNAME!
    echo [DEBUG] GITHUB_REPO = !GITHUB_REPO!
    echo [DEBUG] GITHUB_TOKEN definido = !GITHUB_TOKEN:~0,5!...
    echo [!LOG_DATE! !LOG_TIME!] Usuario: !GITHUB_USERNAME! >> "%LOG_FILE%"
    echo [!LOG_DATE! !LOG_TIME!] Repositorio: !GITHUB_REPO! >> "%LOG_FILE%"
    echo [DEBUG] Credenciais OK: !GITHUB_USERNAME! / !GITHUB_REPO!
    echo [INFO] Usuario: !GITHUB_USERNAME!
    echo [INFO] Repositorio: !GITHUB_REPO!
    
    REM Verify variables are not empty
    if "!GITHUB_USERNAME!"=="" (
        echo [ERRO] GITHUB_USERNAME esta vazio apos carregar credenciais!
        echo [!LOG_DATE! !LOG_TIME!] ERRO: GITHUB_USERNAME vazio >> "%LOG_FILE%"
        exit /b 1
    )
    if "!GITHUB_REPO!"=="" (
        echo [ERRO] GITHUB_REPO esta vazio apos carregar credenciais!
        echo [!LOG_DATE! !LOG_TIME!] ERRO: GITHUB_REPO vazio >> "%LOG_FILE%"
        exit /b 1
    )
) else (
    echo [!LOG_DATE! !LOG_TIME!] ERRO: Falha ao carregar credenciais do arquivo .env >> "%LOG_FILE%"
    echo [ERRO] Falha ao carregar credenciais
    echo [ERRO] Falha ao carregar credenciais do arquivo .env
    exit /b 1
)

REM Validate repo format
echo [!LOG_DATE! !LOG_TIME!] Validando formato do repositorio: %GITHUB_REPO% >> "%LOG_FILE%"
echo [INFO] Validando formato do repositorio...
call "%LOGIN_SCRIPT%" :validate_github_repo_format "%GITHUB_REPO%"
set "VALIDATE_RESULT=%ERRORLEVEL%"
if %VALIDATE_RESULT% equ 0 (
    echo [!LOG_DATE! !LOG_TIME!] Formato do repositorio valido >> "%LOG_FILE%"
    echo [OK] Formato do repositorio valido
) else (
    echo [!LOG_DATE! !LOG_TIME!] ERRO: Formato do repositorio invalido >> "%LOG_FILE%"
    echo [ERRO] Formato do repositorio invalido
    exit /b 1
)

REM Step 2: Login to GitHub Container Registry
echo. >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Passo 2/7: Fazendo login no GitHub Container Registry... >> "%LOG_FILE%"
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 2/7: Fazendo login no GitHub Container Registry...
call "%LOGIN_SCRIPT%" :github_login "%GITHUB_USERNAME%" "%GITHUB_TOKEN%"
set "LOGIN_RESULT=%ERRORLEVEL%"
if %LOGIN_RESULT% equ 0 (
    echo [!LOG_DATE! !LOG_TIME!] Login realizado com sucesso >> "%LOG_FILE%"
    echo [OK] Login realizado com sucesso
) else (
    echo [!LOG_DATE! !LOG_TIME!] ERRO: Falha ao fazer login no GitHub Container Registry >> "%LOG_FILE%"
    echo [ERRO] Falha ao fazer login no GitHub Container Registry
    echo [INFO] Verifique se o GITHUB_TOKEN tem permissao 'write:packages'
    exit /b 1
)

REM Step 3: Get version (from package.json or use timestamp)
echo. >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Passo 3/7: Determinando versao da imagem... >> "%LOG_FILE%"
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 3/7: Determinando versao da imagem...
set "VERSION=latest"
if exist "%PROJECT_ROOT%\package.json" (
    echo [!LOG_DATE! !LOG_TIME!] Lendo versao do package.json... >> "%LOG_FILE%"
    echo [INFO] Lendo versao do package.json...
    for /f "tokens=2 delims=:," %%v in ('findstr /c:"\"version\"" "%PROJECT_ROOT%\package.json"') do (
        set "VERSION=%%v"
        set "VERSION=!VERSION: =!"
        set "VERSION=!VERSION:"=!"
        set "VERSION=!VERSION: =!"
    )
)

REM If version is still "latest" or empty, use timestamp
if "%VERSION%"=="latest" (
    echo [!LOG_DATE! !LOG_TIME!] Versao nao encontrada no package.json, usando timestamp... >> "%LOG_FILE%"
    echo [INFO] Versao nao encontrada no package.json, usando timestamp...
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a-%%b"
    set "TIME=!TIME: =0!"
    set "VERSION=!DATE!-!TIME!"
)
echo [!LOG_DATE! !LOG_TIME!] Versao determinada: %VERSION% >> "%LOG_FILE%"
echo [INFO] Versao determinada: %VERSION%

REM Step 4: Build image
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 4/7: Construindo imagem Docker de producao...
call :write_log "Passo 4/7: Construindo imagem Docker de producao..."
set "IMAGE_NAME=ghcr.io/%GITHUB_REPO%"
set "IMAGE_LATEST=%IMAGE_NAME%:latest"
set "IMAGE_VERSIONED=%IMAGE_NAME%:%VERSION%"

echo [INFO] Nome da imagem: %IMAGE_NAME%
echo [INFO] Tag 'latest': %IMAGE_LATEST%
echo [INFO] Tag versionada: %IMAGE_VERSIONED%
echo [INFO] Dockerfile: %PROJECT_ROOT%\Dockerfile
call :write_log "Nome da imagem: %IMAGE_NAME%"
call :write_log "Tag 'latest': %IMAGE_LATEST%"
call :write_log "Tag versionada: %IMAGE_VERSIONED%"
call :print_info ""
echo [INFO] Iniciando build (isso pode levar varios minutos)...
echo [INFO] Acompanhe o progresso abaixo:
call :write_log "Iniciando docker build..."
echo.

REM Build and capture output to log file
echo [INFO] Output completo do build sera salvo no log: %LOG_FILE%
call :write_log "Executando: docker build -t %IMAGE_LATEST% -t %IMAGE_VERSIONED% -f Dockerfile ."
docker build -t %IMAGE_LATEST% -t %IMAGE_VERSIONED% -f Dockerfile . >> "%LOG_FILE%" 2>&1
set "BUILD_RESULT=%ERRORLEVEL%"
call :write_log "Build concluido com codigo: %BUILD_RESULT%"
echo.
echo [INFO] Ver output completo no arquivo de log: %LOG_FILE%
echo.

if %BUILD_RESULT% neq 0 (
    echo [ERRO] Build da imagem falhou com codigo de erro: %BUILD_RESULT%
    echo [INFO] Verifique o arquivo de log para detalhes: %LOG_FILE%
    call :write_log "ERRO: Build falhou com codigo %BUILD_RESULT%"
    exit /b 1
)

echo [OK] Build concluido com sucesso!
call :write_log "Build concluido com sucesso!"
echo [INFO] Verificando imagens criadas...
call :write_log "Listando imagens criadas..."
docker images %IMAGE_NAME% --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" >> "%LOG_FILE%" 2>&1
docker images %IMAGE_NAME% --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo.

REM Step 5: Push image to GitHub Packages
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 5/7: Enviando imagem para GitHub Packages...
call :write_log "Passo 5/7: Enviando imagem para GitHub Packages..."
echo [INFO] URL do registro: ghcr.io
echo [INFO] Isso pode levar varios minutos dependendo do tamanho da imagem...
call :write_log "URL do registro: ghcr.io"
echo.

REM Push latest tag
echo [INFO] Enviando tag 'latest' para ghcr.io...
echo [INFO] Comando: docker push %IMAGE_LATEST%
echo.
REM Push and capture output to log file
call :write_log "Executando: docker push %IMAGE_LATEST%"
docker push %IMAGE_LATEST% >> "%LOG_FILE%" 2>&1
set "PUSH_LATEST_RESULT=%ERRORLEVEL%"
call :write_log "Push 'latest' concluido com codigo: %PUSH_LATEST_RESULT%"
echo.
echo [INFO] Ver output completo no arquivo de log: %LOG_FILE%
echo.

if %PUSH_LATEST_RESULT% neq 0 (
    echo [ERRO] Falha ao enviar tag 'latest' (codigo: %PUSH_LATEST_RESULT%)
    echo [INFO] Verifique o arquivo de log para detalhes: %LOG_FILE%
    echo [INFO] Verifique se:
    echo [INFO]   - O token tem permissao 'write:packages'
    echo [INFO]   - O repositorio existe e voce tem acesso
    echo [INFO]   - A conexao com a internet esta funcionando
    call :write_log "ERRO: Falha ao enviar tag 'latest' (codigo: %PUSH_LATEST_RESULT%)"
    exit /b 1
)
echo [OK] Tag 'latest' enviada com sucesso!
call :write_log "Tag 'latest' enviada com sucesso!"

REM Push versioned tag
echo.
echo ---------------------------------------
echo.
echo [INFO] Enviando tag '%VERSION%' para ghcr.io...
echo [INFO] Comando: docker push %IMAGE_VERSIONED%
echo.
REM Push versioned tag and capture output
call :write_log "Executando: docker push %IMAGE_VERSIONED%"
docker push %IMAGE_VERSIONED% >> "%LOG_FILE%" 2>&1
set "PUSH_VERSION_RESULT=%ERRORLEVEL%"
call :write_log "Push '%VERSION%' concluido com codigo: %PUSH_VERSION_RESULT%"
echo.
echo [INFO] Ver output completo no arquivo de log: %LOG_FILE%
echo.

if %PUSH_VERSION_RESULT% neq 0 (
    echo [AVISO] Falha ao enviar tag versionada (codigo: %PUSH_VERSION_RESULT%)
    echo [INFO] A tag 'latest' foi enviada com sucesso
    call :write_log "AVISO: Falha ao enviar tag versionada (codigo: %PUSH_VERSION_RESULT%)"
) else (
    echo [OK] Tag '%VERSION%' enviada com sucesso!
    call :write_log "Tag '%VERSION%' enviada com sucesso!"
)

echo [OK] Imagem enviada para GitHub Packages com sucesso!
call :write_log "Imagem enviada para GitHub Packages com sucesso!"

REM Step 6: Optional cleanup of local images
echo. >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Passo 6/7: Limpeza de imagens locais (opcional)... >> "%LOG_FILE%"
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 6/7: Limpeza de imagens locais (opcional)...
echo [INFO] Deseja remover as imagens locais apos o push?
call "%UTILS_DIR%common.bat" :confirm "Remover imagens locais"
if %ERRORLEVEL% equ 0 (
    echo [!LOG_DATE! !LOG_TIME!] Removendo imagens locais... >> "%LOG_FILE%"
    echo [INFO] Removendo imagens locais...
    docker rmi %IMAGE_LATEST% >> "%LOG_FILE%" 2>&1
    docker rmi %IMAGE_VERSIONED% >> "%LOG_FILE%" 2>&1
    echo [!LOG_DATE! !LOG_TIME!] Imagens locais removidas >> "%LOG_FILE%"
    echo [OK] Imagens locais removidas
) else (
    echo [!LOG_DATE! !LOG_TIME!] Imagens locais mantidas >> "%LOG_FILE%"
    echo [INFO] Imagens locais mantidas
)

REM Step 7: Show success message with pull command
echo. >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Passo 7/7: Resumo final... >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Build e push concluidos com sucesso! >> "%LOG_FILE%"
echo.
echo ---------------------------------------
echo.
echo [INFO] Passo 7/7: Resumo final...
echo [OK] Build e push concluidos com sucesso!
echo.
echo [INFO] =======================================
echo [INFO] Imagem disponivel no GitHub Packages:
echo [INFO]   %IMAGE_LATEST%
echo [INFO]   %IMAGE_VERSIONED%
echo [INFO] =======================================
echo [!LOG_DATE! !LOG_TIME!] Imagem: %IMAGE_LATEST% >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Imagem: %IMAGE_VERSIONED% >> "%LOG_FILE%"
echo.
echo [INFO] =======================================
echo [INFO] Arquivo de log criado:
echo [INFO]   %LOG_FILE%
echo [INFO] =======================================
echo [!LOG_DATE! !LOG_TIME!] Arquivo de log: %LOG_FILE% >> "%LOG_FILE%"
echo.
echo [INFO] Para visualizar no GitHub:
echo [INFO]   https://github.com/%GITHUB_REPO%/packages
echo [!LOG_DATE! !LOG_TIME!] GitHub Packages: https://github.com/%GITHUB_REPO%/packages >> "%LOG_FILE%"
echo.
echo [INFO] Para fazer pull da imagem:
echo [INFO]   docker pull %IMAGE_LATEST%
echo.
echo [INFO] Para executar a imagem:
echo [INFO]   docker run -d -p 5000:5000 --env-file .env %IMAGE_LATEST%
echo.
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] Log finalizado >> "%LOG_FILE%"
echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"

REM Final log entry
if exist "%LOG_FILE%" (
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value 2^>nul') do set "DT=%%a"
    if "!DT!"=="" (
        for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
        for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"
    ) else (
        set "LOG_DATE=!DT:~0,4!-!DT:~4,2!-!DT:~6,2!"
        set "LOG_TIME=!DT:~8,2!:!DT:~10,2!"
    )
    echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
    echo [!LOG_DATE! !LOG_TIME!] Script finalizado >> "%LOG_FILE%"
    echo [!LOG_DATE! !LOG_TIME!] ======================================== >> "%LOG_FILE%"
)

endlocal
exit /b 0

REM ============================================
REM Jump to main code (skip function definitions)
REM ============================================
goto :main

