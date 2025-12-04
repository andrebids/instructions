@echo off
REM ============================================
REM Build and push Docker image to GitHub Packages
REM ============================================

setlocal enabledelayedexpansion

REM Load common functions
set "UTILS_DIR=%~dp0..\utils\"

REM Load color variables
call "%UTILS_DIR%common.bat" >nul 2>&1

REM Define wrapper functions
:print_color
call "%UTILS_DIR%common.bat" :print_color %*
goto :eof

:print_success
call "%UTILS_DIR%common.bat" :print_success %*
goto :eof

:print_error
call "%UTILS_DIR%common.bat" :print_error %*
goto :eof

:print_warning
call "%UTILS_DIR%common.bat" :print_warning %*
goto :eof

:print_info
call "%UTILS_DIR%common.bat" :print_info %*
goto :eof

:print_header
call "%UTILS_DIR%common.bat" :print_header %*
goto :eof

:print_separator
call "%UTILS_DIR%common.bat" :print_separator
goto :eof

:write_log
call "%UTILS_DIR%common.bat" :write_log %*
goto :eof

REM Load docker-check functions
call "%UTILS_DIR%docker-check.bat" >nul 2>&1

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
call "%UTILS_DIR%docker-check.bat" :check_all_docker
goto :eof

REM Get project root (go up from scripts/github/ to project root)
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
cd /d "%PROJECT_ROOT%"

REM Initialize log file
call "%UTILS_DIR%common.bat" :init_log_file ""
if "%LOG_FILE%"=="" (
    REM Fallback if init failed - use scripts/logs directory
    set "SCRIPTS_DIR=%~dp0.."
    for %%i in ("%SCRIPTS_DIR%") do set "SCRIPTS_DIR=%%~fi"
    set "LOG_DIR=%SCRIPTS_DIR%\logs"
    if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a-%%b"
    set "TIME=!TIME: =0!"
    set "TIME=!TIME::=-!"
    set "LOG_FILE=%LOG_DIR%\build-%DATE%-%TIME%.log"
    (
        echo ========================================
        echo Log iniciado em: %DATE% %TIME%
        echo ========================================
        echo.
    ) > "%LOG_FILE%"
)
call :write_log "======================================="
call :write_log "Build e Push para GitHub Packages"
call :write_log "======================================="
call :print_info "Arquivo de log: %LOG_FILE%"

call :print_header "Build e Push para GitHub Packages"

REM Check Docker prerequisites
call :write_log "Verificando pre-requisitos Docker..."
call :check_all_docker
if %ERRORLEVEL% neq 0 (
    call :print_error "Verificacoes falharam. Abortando."
    call :write_log "ERRO: Verificacoes Docker falharam"
    exit /b 1
)
call :write_log "Pre-requisitos Docker OK"

REM Step 1: Load GitHub credentials
call :print_separator
call :print_info "Passo 1/7: Carregando credenciais do GitHub..."
call :write_log "Passo 1/7: Carregando credenciais do GitHub..."
set "LOGIN_SCRIPT=%~dp0login.bat"
call "%LOGIN_SCRIPT%" :load_github_credentials
if %ERRORLEVEL% neq 0 (
    call :print_error "Falha ao carregar credenciais do arquivo .env"
    call :write_log "ERRO: Falha ao carregar credenciais do arquivo .env"
    exit /b 1
)
call :print_info "Usuario: %GITHUB_USERNAME%"
call :print_info "Repositorio: %GITHUB_REPO%"
call :write_log "Usuario: %GITHUB_USERNAME%"
call :write_log "Repositorio: %GITHUB_REPO%"

REM Validate repo format
call :print_info "Validando formato do repositorio..."
call :write_log "Validando formato do repositorio: %GITHUB_REPO%"
call "%LOGIN_SCRIPT%" :validate_github_repo_format "%GITHUB_REPO%"
if %ERRORLEVEL% neq 0 (
    call :print_error "Formato do repositorio invalido"
    call :write_log "ERRO: Formato do repositorio invalido"
    exit /b 1
)
call :print_success "Formato do repositorio valido"
call :write_log "Formato do repositorio valido"

REM Step 2: Login to GitHub Container Registry
call :print_separator
call :print_info "Passo 2/7: Fazendo login no GitHub Container Registry..."
call :write_log "Passo 2/7: Fazendo login no GitHub Container Registry..."
call "%LOGIN_SCRIPT%" :github_login "%GITHUB_USERNAME%" "%GITHUB_TOKEN%"
if %ERRORLEVEL% neq 0 (
    call :print_error "Falha ao fazer login no GitHub Container Registry"
    call :print_info "Verifique se o GITHUB_TOKEN tem permissao 'write:packages'"
    call :write_log "ERRO: Falha ao fazer login no GitHub Container Registry"
    exit /b 1
)
call :print_success "Login realizado com sucesso"
call :write_log "Login realizado com sucesso"

REM Step 3: Get version (from package.json or use timestamp)
call :print_separator
call :print_info "Passo 3/7: Determinando versao da imagem..."
call :write_log "Passo 3/7: Determinando versao da imagem..."
set "VERSION=latest"
if exist "%PROJECT_ROOT%\package.json" (
    call :print_info "Lendo versao do package.json..."
    call :write_log "Lendo versao do package.json..."
    for /f "tokens=2 delims=:," %%v in ('findstr /c:"\"version\"" "%PROJECT_ROOT%\package.json"') do (
        set "VERSION=%%v"
        set "VERSION=!VERSION: =!"
        set "VERSION=!VERSION:"=!"
        set "VERSION=!VERSION: =!"
    )
)

REM If version is still "latest" or empty, use timestamp
if "%VERSION%"=="latest" (
    call :print_info "Versao nao encontrada no package.json, usando timestamp..."
    call :write_log "Versao nao encontrada no package.json, usando timestamp..."
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a-%%b"
    set "TIME=!TIME: =0!"
    set "VERSION=!DATE!-!TIME!"
)
call :print_info "Versao determinada: %VERSION%"
call :write_log "Versao determinada: %VERSION%"

REM Step 4: Build image
call :print_separator
call :print_info "Passo 4/7: Construindo imagem Docker de producao..."
call :write_log "Passo 4/7: Construindo imagem Docker de producao..."
set "IMAGE_NAME=ghcr.io/%GITHUB_REPO%"
set "IMAGE_LATEST=%IMAGE_NAME%:latest"
set "IMAGE_VERSIONED=%IMAGE_NAME%:%VERSION%"

call :print_info "Nome da imagem: %IMAGE_NAME%"
call :print_info "Tag 'latest': %IMAGE_LATEST%"
call :print_info "Tag versionada: %IMAGE_VERSIONED%"
call :print_info "Dockerfile: %PROJECT_ROOT%\Dockerfile"
call :write_log "Nome da imagem: %IMAGE_NAME%"
call :write_log "Tag 'latest': %IMAGE_LATEST%"
call :write_log "Tag versionada: %IMAGE_VERSIONED%"
call :print_info ""
call :print_info "Iniciando build (isso pode levar varios minutos)..."
call :print_info "Acompanhe o progresso abaixo:"
call :write_log "Iniciando docker build..."
echo.

REM Build and capture output to log file
call :print_info "Output completo do build sera salvo no log: %LOG_FILE%"
call :write_log "Executando: docker build -t %IMAGE_LATEST% -t %IMAGE_VERSIONED% -f Dockerfile ."
docker build -t %IMAGE_LATEST% -t %IMAGE_VERSIONED% -f Dockerfile . >> "%LOG_FILE%" 2>&1
set "BUILD_RESULT=%ERRORLEVEL%"
call :write_log "Build concluido com codigo: %BUILD_RESULT%"
echo.
call :print_info "Ver output completo no arquivo de log: %LOG_FILE%"
echo.

if %BUILD_RESULT% neq 0 (
    call :print_error "Build da imagem falhou com codigo de erro: %BUILD_RESULT%"
    call :print_info "Verifique o arquivo de log para detalhes: %LOG_FILE%"
    call :write_log "ERRO: Build falhou com codigo %BUILD_RESULT%"
    exit /b 1
)

call :print_success "Build concluido com sucesso!"
call :write_log "Build concluido com sucesso!"
call :print_info "Verificando imagens criadas..."
call :write_log "Listando imagens criadas..."
docker images %IMAGE_NAME% --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" >> "%LOG_FILE%" 2>&1
docker images %IMAGE_NAME% --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo.

REM Step 5: Push image to GitHub Packages
call :print_separator
call :print_info "Passo 5/7: Enviando imagem para GitHub Packages..."
call :write_log "Passo 5/7: Enviando imagem para GitHub Packages..."
call :print_info "URL do registro: ghcr.io"
call :print_info "Isso pode levar varios minutos dependendo do tamanho da imagem..."
call :write_log "URL do registro: ghcr.io"
echo.

REM Push latest tag
call :print_info "Enviando tag 'latest' para ghcr.io..."
call :print_info "Comando: docker push %IMAGE_LATEST%"
echo.
REM Push and capture output to log file
call :write_log "Executando: docker push %IMAGE_LATEST%"
docker push %IMAGE_LATEST% >> "%LOG_FILE%" 2>&1
set "PUSH_LATEST_RESULT=%ERRORLEVEL%"
call :write_log "Push 'latest' concluido com codigo: %PUSH_LATEST_RESULT%"
echo.
call :print_info "Ver output completo no arquivo de log: %LOG_FILE%"
echo.

if %PUSH_LATEST_RESULT% neq 0 (
    call :print_error "Falha ao enviar tag 'latest' (codigo: %PUSH_LATEST_RESULT%)"
    call :print_info "Verifique o arquivo de log para detalhes: %LOG_FILE%"
    call :print_info "Verifique se:"
    call :print_info "  - O token tem permissao 'write:packages'"
    call :print_info "  - O repositorio existe e voce tem acesso"
    call :print_info "  - A conexao com a internet esta funcionando"
    call :write_log "ERRO: Falha ao enviar tag 'latest' (codigo: %PUSH_LATEST_RESULT%)"
    exit /b 1
)
call :print_success "Tag 'latest' enviada com sucesso!"
call :write_log "Tag 'latest' enviada com sucesso!"

REM Push versioned tag
call :print_separator
call :print_info "Enviando tag '%VERSION%' para ghcr.io..."
call :print_info "Comando: docker push %IMAGE_VERSIONED%"
echo.
REM Push versioned tag and capture output
call :write_log "Executando: docker push %IMAGE_VERSIONED%"
docker push %IMAGE_VERSIONED% >> "%LOG_FILE%" 2>&1
set "PUSH_VERSION_RESULT=%ERRORLEVEL%"
call :write_log "Push '%VERSION%' concluido com codigo: %PUSH_VERSION_RESULT%"
echo.
call :print_info "Ver output completo no arquivo de log: %LOG_FILE%"
echo.

if %PUSH_VERSION_RESULT% neq 0 (
    call :print_warning "Falha ao enviar tag versionada (codigo: %PUSH_VERSION_RESULT%)"
    call :print_info "A tag 'latest' foi enviada com sucesso"
    call :write_log "AVISO: Falha ao enviar tag versionada (codigo: %PUSH_VERSION_RESULT%)"
) else (
    call :print_success "Tag '%VERSION%' enviada com sucesso!"
    call :write_log "Tag '%VERSION%' enviada com sucesso!"
)

call :print_success "Imagem enviada para GitHub Packages com sucesso!"
call :write_log "Imagem enviada para GitHub Packages com sucesso!"

REM Step 6: Optional cleanup of local images
call :print_separator
call :print_info "Passo 6/7: Limpeza de imagens locais (opcional)..."
call :write_log "Passo 6/7: Limpeza de imagens locais (opcional)..."
call :print_info "Deseja remover as imagens locais apos o push?"
call "%UTILS_DIR%common.bat" :confirm "Remover imagens locais"
if %ERRORLEVEL% equ 0 (
    call :print_info "Removendo imagens locais..."
    call :write_log "Removendo imagens locais..."
    docker rmi %IMAGE_LATEST% >> "%LOG_FILE%" 2>&1
    docker rmi %IMAGE_VERSIONED% >> "%LOG_FILE%" 2>&1
    call :print_success "Imagens locais removidas"
    call :write_log "Imagens locais removidas"
) else (
    call :print_info "Imagens locais mantidas"
    call :write_log "Imagens locais mantidas"
)

REM Step 7: Show success message with pull command
call :print_separator
call :print_info "Passo 7/7: Resumo final..."
call :write_log "Build e push concluidos com sucesso!"
call :print_success "Build e push concluidos com sucesso!"
echo.
call :print_info "======================================="
call :print_info "Imagem disponivel no GitHub Packages:"
call :print_info "  %IMAGE_LATEST%"
call :print_info "  %IMAGE_VERSIONED%"
call :print_info "======================================="
call :write_log "Imagem: %IMAGE_LATEST%"
call :write_log "Imagem: %IMAGE_VERSIONED%"
echo.
call :print_info "======================================="
call :print_info "Arquivo de log criado:"
call :print_info "  %LOG_FILE%"
call :print_info "======================================="
call :write_log "Arquivo de log: %LOG_FILE%"
echo.
call :print_info "Para visualizar no GitHub:"
call :print_info "  https://github.com/%GITHUB_REPO%/packages"
call :write_log "GitHub Packages: https://github.com/%GITHUB_REPO%/packages"
echo.
call :print_info "Para fazer pull da imagem:"
call :print_info "  docker pull %IMAGE_LATEST%"
echo.
call :print_info "Para executar a imagem:"
call :print_info "  docker run -d -p 5000:5000 --env-file .env %IMAGE_LATEST%"
echo.
call :write_log "======================================="
call :write_log "Log finalizado"
call :write_log "======================================="

endlocal
exit /b 0

