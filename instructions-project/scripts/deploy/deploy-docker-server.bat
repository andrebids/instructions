@echo off
REM ============================================
REM Deploy Docker Container to Remote Server
REM Script simplificado - chama script bash no servidor
REM ============================================

setlocal enabledelayedexpansion

REM Prevent terminal from closing on error
set "ERROR_OCCURRED=0"

REM Setup logging
set "SCRIPT_DIR=%~dp0"
for %%i in ("%SCRIPT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
set "LOG_DIR=%PROJECT_ROOT%\logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Generate log file name with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"
set "LOG_TIME=%LOG_TIME: =0%"
set "LOG_TIME=%LOG_TIME::=-%"
set "DEPLOY_LOG=%LOG_DIR%\deploy-%LOG_DATE%-%LOG_TIME%.log"

REM Initialize log file
(
    echo ========================================
    echo Deploy Log iniciado em: %LOG_DATE% %LOG_TIME%
    echo ========================================
    echo.
) > "%DEPLOY_LOG%"

REM Function to write to log
goto :skip_log_function
:write_log
setlocal enabledelayedexpansion
set "LOG_MSG=%~1"
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE_NOW=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME_NOW=%%a-%%b"
set "LOG_TIME_NOW=!LOG_TIME_NOW: =0!"
echo [!LOG_DATE_NOW! !LOG_TIME_NOW!] %LOG_MSG% >> "%DEPLOY_LOG%"
endlocal
goto :eof
:skip_log_function

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "DEPLOY_UTILS_DIR=%SCRIPT_DIR%utils\"
set "UTILS_DIR=%SCRIPT_DIR%..\utils\"
set "COMMON_UTILS=%UTILS_DIR%common.bat"

REM Verify common.bat exists
if not exist "%COMMON_UTILS%" (
    echo.
    echo [ERRO] Arquivo common.bat nao encontrado em: %COMMON_UTILS%
    set "ERROR_OCCURRED=1"
    goto :error_exit
)

REM Load module paths (only what we need)
set "SSH_UTILS=%DEPLOY_UTILS_DIR%ssh-utils.bat"
set "IMAGE_UTILS=%DEPLOY_UTILS_DIR%image-utils.bat"
set "CONTAINER_UTILS=%DEPLOY_UTILS_DIR%container-utils.bat"

REM Verify modules exist
if not exist "%SSH_UTILS%" (
    echo [ERRO] ssh-utils.bat nao encontrado em: %SSH_UTILS%
    set "ERROR_OCCURRED=1"
    goto :error_exit
)
if not exist "%IMAGE_UTILS%" (
    echo [ERRO] image-utils.bat nao encontrado em: %IMAGE_UTILS%
    set "ERROR_OCCURRED=1"
    goto :error_exit
)
if not exist "%CONTAINER_UTILS%" (
    echo [ERRO] container-utils.bat nao encontrado em: %CONTAINER_UTILS%
    set "ERROR_OCCURRED=1"
    goto :error_exit
)

REM Registry configuration (will be set dynamically from .env)
set "REGISTRY="
set "GITHUB_REPO="

REM Jump to main code
goto :main

REM ============================================
REM Function: Load GitHub Repository from .env
REM Sets: GITHUB_REPO variable
REM Returns: ERRORLEVEL 0 if success, 1 if failure
REM ============================================
:load_github_repo
setlocal enabledelayedexpansion
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
set "ENV_FILE=%PROJECT_ROOT%\.env"

if not exist "%ENV_FILE%" (
    call "%COMMON_UTILS%" :print_error "Arquivo .env não encontrado em: %PROJECT_ROOT%"
    call "%COMMON_UTILS%" :print_info "Crie um arquivo .env com a variável: GITHUB_REPO=username/repo-name"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Lendo GITHUB_REPO do arquivo .env..."
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    if not "%%a"=="" (
        echo %%a| findstr /b /c:"#" >nul 2>&1
        if errorlevel 1 (
            for /f "tokens=*" %%n in ("%%a") do (
                if /i "%%n"=="GITHUB_REPO" (
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_REPO=%%v"
                )
            )
        )
    )
)

if "!GITHUB_REPO!"=="" (
    call "%COMMON_UTILS%" :print_error "GITHUB_REPO não encontrado no arquivo .env"
    call "%COMMON_UTILS%" :print_info "Formato esperado: GITHUB_REPO=username/repo-name"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_success "GITHUB_REPO carregado: !GITHUB_REPO!"
endlocal & set "GITHUB_REPO=%GITHUB_REPO%"
exit /b 0

REM ============================================
REM Function: Safe Exit (with pause if run directly)
REM Usage: call :safe_exit [exit_code]
REM ============================================
:safe_exit
setlocal
set "EXIT_CODE=%~1"
if "%EXIT_CODE%"=="" set "EXIT_CODE=0"

call :write_log "SAFE_EXIT chamado com codigo: %EXIT_CODE%"

if %RUN_DIRECTLY% equ 1 (
    echo.
    echo Pressione qualquer tecla para sair...
    call :write_log "Pausando antes de sair (executado diretamente)"
    pause >nul
)

call :write_log "Saindo do script com codigo: %EXIT_CODE%"
endlocal
exit /b %EXIT_CODE%

REM ============================================
REM Error Exit Handler
REM ============================================
:error_exit
if %ERROR_OCCURRED% equ 1 (
    echo.
    echo [ERRO] Erro critico detectado. Verifique os mensagens acima.
    echo.
    call :safe_exit 1
)
call :safe_exit 0

REM ============================================
REM Main Code
REM ============================================
:main

call :write_log "========================================"
call :write_log "Iniciando script de deploy (versao simplificada)"
call :write_log "========================================"

REM Check if script is being run directly (not from manage-project.bat)
set "RUN_DIRECTLY=1"
if not "%1"=="" if "%1"=="--from-menu" set "RUN_DIRECTLY=0"

call :write_log "RUN_DIRECTLY=%RUN_DIRECTLY%"

call "%COMMON_UTILS%" :print_header "Deploy Docker no Servidor Remoto"
echo.
call :write_log "Header exibido"

REM ============================================
REM Step 0: Load GitHub Repository from .env
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 0/4: Carregando Configuração do Registry"
echo.

call :write_log "Carregando GITHUB_REPO do .env..."
call :load_github_repo
if %ERRORLEVEL% neq 0 (
    call :write_log "ERRO: Falha ao carregar GITHUB_REPO do .env"
    call "%COMMON_UTILS%" :print_error "Falha ao carregar GITHUB_REPO do .env. Abortando."
    if %RUN_DIRECTLY% equ 1 (
        echo.
        echo Pressione qualquer tecla para sair...
        pause >nul
    )
    call :write_log "Saindo com erro 1 (GITHUB_REPO)"
    exit /b 1
)
call :write_log "GITHUB_REPO carregado com sucesso"

REM Set registry dynamically
set "REGISTRY=ghcr.io/%GITHUB_REPO%"
call "%COMMON_UTILS%" :print_success "Registry configurado: %REGISTRY%"
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 1: Environment Checks
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 1/4: Verificações de Ambiente"
echo.

REM 1.1 Check SSH
call :write_log "Verificando SSH instalado..."
call "%SSH_UTILS%" :verify_ssh_installed
if %ERRORLEVEL% neq 0 (
    call :write_log "ERRO: SSH não está disponível"
    call "%COMMON_UTILS%" :print_error "SSH não está disponível. Abortando."
    exit /b 1
)
call :write_log "SSH verificado com sucesso"
echo.

REM 1.2 Check SSH connection
set "SSH_ALIAS="
call :write_log "Verificando conexão SSH..."
call "%SSH_UTILS%" :check_ssh_connection
if %ERRORLEVEL% neq 0 (
    call :write_log "ERRO: Não foi possível estabelecer conexão SSH"
    call "%COMMON_UTILS%" :print_error "Não foi possível estabelecer conexão SSH. Abortando."
    exit /b 1
)
call :write_log "Conexão SSH estabelecida"

if "!SSH_ALIAS!"=="" (
    set "SSH_ALIAS=dev"
    call "%COMMON_UTILS%" :print_warning "Usando alias padrão 'dev'"
)
echo.
call "%COMMON_UTILS%" :print_success "Conexão SSH estabelecida: !SSH_ALIAS!"
echo.

REM 1.3 Check Docker on remote server
call :write_log "Verificando Docker no servidor remoto..."
call "%CONTAINER_UTILS%" :check_docker_remote
if %ERRORLEVEL% neq 0 (
    call :write_log "ERRO: Docker não está disponível no servidor remoto"
    call "%COMMON_UTILS%" :print_error "Docker não está disponível no servidor remoto. Abortando."
    exit /b 1
)
call :write_log "Docker verificado no servidor remoto"
echo.

call "%COMMON_UTILS%" :print_success "Verificações de ambiente concluídas"
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 1.5: Verify Docker Authentication on Remote Server
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 1.5/4: Verificando Autenticação Docker no Servidor Remoto"
echo.

REM Load GitHub credentials from .env for authentication
set "LOGIN_SCRIPT=%SCRIPT_DIR%..\github\login.bat"
set "GITHUB_USERNAME="
set "GITHUB_TOKEN="

if exist "%LOGIN_SCRIPT%" (
    call "%COMMON_UTILS%" :print_info "Carregando credenciais do .env..."
    call "%LOGIN_SCRIPT%" :load_github_credentials
    if %ERRORLEVEL% equ 0 (
        set "TEMP_FILE=%PROJECT_ROOT%\.github_creds_temp.tmp"
        if exist "%TEMP_FILE%" (
            for /f "usebackq tokens=1,* delims==" %%a in ("%TEMP_FILE%") do (
                if /i "%%a"=="GITHUB_USERNAME" set "GITHUB_USERNAME=%%b"
                if /i "%%a"=="GITHUB_TOKEN" set "GITHUB_TOKEN=%%b"
            )
            del "%TEMP_FILE%" >nul 2>&1
        )
    )
)

REM Check if server is authenticated to ghcr.io
call "%COMMON_UTILS%" :print_info "Verificando autenticação no GitHub Container Registry..."
call "%SSH_UTILS%" :execute_ssh_command "docker manifest inspect %REGISTRY%:latest >nul 2>&1" "Verificando autenticação"
set "AUTH_CHECK=%ERRORLEVEL%"

REM If authentication failed and we have credentials, try to login
if %AUTH_CHECK% neq 0 (
    if not "!GITHUB_USERNAME!"=="" if not "!GITHUB_TOKEN!"=="" (
        call "%COMMON_UTILS%" :print_warning "Servidor remoto não está autenticado no ghcr.io"
        call "%COMMON_UTILS%" :print_info "Tentando fazer login usando credenciais do .env..."
        
        call "%SSH_UTILS%" :execute_ssh_command "echo !GITHUB_TOKEN! | docker login ghcr.io -u !GITHUB_USERNAME! --password-stdin" "Fazendo login no servidor remoto"
        if %ERRORLEVEL% equ 0 (
            call "%COMMON_UTILS%" :print_success "Login realizado com sucesso no servidor remoto"
        ) else (
            call "%COMMON_UTILS%" :print_warning "Falha ao fazer login automaticamente"
            call "%COMMON_UTILS%" :print_info "O pull pode falhar se a imagem for privada"
            call "%COMMON_UTILS%" :print_info "Você pode fazer login manualmente com:"
            call "%COMMON_UTILS%" :print_info "  ssh !SSH_ALIAS! \"echo SEU_TOKEN | docker login ghcr.io -u SEU_USUARIO --password-stdin\""
        )
    ) else (
        call "%COMMON_UTILS%" :print_warning "Credenciais GitHub não disponíveis"
        call "%COMMON_UTILS%" :print_info "O pull pode falhar se a imagem for privada"
        call "%COMMON_UTILS%" :print_info "Certifique-se de que o servidor remoto está autenticado no ghcr.io"
    )
) else (
    call "%COMMON_UTILS%" :print_success "Servidor remoto já está autenticado"
)
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 2: Get Latest Image Tag
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 2/4: Obtendo Última Versão da Imagem"
echo.

call :write_log "Obtendo última tag da imagem..."
call "%IMAGE_UTILS%" :get_latest_image_tag
if %ERRORLEVEL% neq 0 (
    call :write_log "ERRO: Falha ao obter tag da imagem"
    call "%COMMON_UTILS%" :print_error "Falha ao obter tag da imagem. Abortando."
    exit /b 1
)
call :write_log "Tag da imagem obtida: %IMAGE_TAG%"

set "FULL_IMAGE_NAME=%REGISTRY%:%IMAGE_TAG%"
call "%COMMON_UTILS%" :print_success "Tag obtida: %IMAGE_TAG%"
call "%COMMON_UTILS%" :print_info "Imagem completa: %FULL_IMAGE_NAME%"
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 3: Executar Script de Deploy no Servidor
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 3/4: Executando Deploy no Servidor"
echo.

REM Path to deploy script on server (using absolute path for reliability)
REM Note: Adjust /home/bids if your user is different
set "DEPLOY_SCRIPT_PATH=/home/bids/apps/instructions-project/instructions-project/deploy-docker.sh"

call :write_log "Chamando script de deploy no servidor..."
call "%COMMON_UTILS%" :print_info "Executando script de deploy no servidor remoto..."
call "%COMMON_UTILS%" :print_info "Script: %DEPLOY_SCRIPT_PATH%"
call "%COMMON_UTILS%" :print_info "Imagem: %FULL_IMAGE_NAME%"
echo.

REM Execute script on remote server via SSH
REM Using bash -c to properly handle arguments with special characters
REM Escape the image name properly for shell execution
call "%SSH_UTILS%" :execute_ssh_command "bash %DEPLOY_SCRIPT_PATH% '%FULL_IMAGE_NAME%'" "Falha ao executar script de deploy no servidor"
set "DEPLOY_RESULT=%ERRORLEVEL%"

call :write_log "Script de deploy executado, resultado: %DEPLOY_RESULT%"
echo.

if %DEPLOY_RESULT% equ 0 (
    call :write_log "Deploy concluído com sucesso!"
    call "%COMMON_UTILS%" :print_success "Deploy concluído com sucesso!"
) else (
    call :write_log "ERRO: Deploy falhou com codigo: %DEPLOY_RESULT%"
    call "%COMMON_UTILS%" :print_error "Deploy falhou com código de erro: %DEPLOY_RESULT%"
    call "%COMMON_UTILS%" :print_info "Verifique os logs acima para mais detalhes"
    echo.
    call "%COMMON_UTILS%" :print_info "Para verificar logs do container:"
    call "%COMMON_UTILS%" :print_info "  ssh !SSH_ALIAS! \"docker logs instructions-prod --tail 50\""
    echo.
    call :write_log "Saindo com erro (codigo %DEPLOY_RESULT%)"
    call "%COMMON_UTILS%" :print_info "Log do deploy salvo em: %DEPLOY_LOG%"
    if %RUN_DIRECTLY% equ 1 (
        echo.
        echo Pressione qualquer tecla para sair...
        pause >nul
    )
    exit /b %DEPLOY_RESULT%
)

echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Final Summary
REM ============================================
call "%COMMON_UTILS%" :print_header "Resumo do Deploy"
echo.

call :write_log "Deploy concluído com sucesso!"
call "%COMMON_UTILS%" :print_success "Deploy concluído com sucesso!"
echo.
call "%COMMON_UTILS%" :print_info "Container: instructions-prod"
call "%COMMON_UTILS%" :print_info "Imagem: %FULL_IMAGE_NAME%"
call "%COMMON_UTILS%" :print_info "Porta: 5000:5000"
echo.
call "%COMMON_UTILS%" :print_info "Para verificar logs:"
if defined SSH_ALIAS (
    call "%COMMON_UTILS%" :print_info "  ssh %SSH_ALIAS% docker logs instructions-prod --tail 50"
) else (
    call "%COMMON_UTILS%" :print_info "  ssh dev docker logs instructions-prod --tail 50"
)
echo.
call "%COMMON_UTILS%" :print_info "Para parar o container:"
if defined SSH_ALIAS (
    call "%COMMON_UTILS%" :print_info "  ssh %SSH_ALIAS% docker stop instructions-prod"
) else (
    call "%COMMON_UTILS%" :print_info "  ssh dev docker stop instructions-prod"
)
echo.
call :write_log "Saindo com sucesso (codigo 0)"
call "%COMMON_UTILS%" :print_info "Log do deploy salvo em: %DEPLOY_LOG%"

if %RUN_DIRECTLY% equ 1 (
    echo.
    echo Pressione qualquer tecla para sair...
    pause >nul
)

call :write_log "Script finalizado normalmente"
call :write_log "========================================"
endlocal
exit /b 0
