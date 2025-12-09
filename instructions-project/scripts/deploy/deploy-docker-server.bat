@echo off
REM ============================================
REM Deploy Docker Container to Remote Server
REM Script principal para deploy automatizado
REM ============================================

setlocal enabledelayedexpansion

REM Prevent terminal from closing on error
set "ERROR_OCCURRED=0"

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "DEPLOY_UTILS_DIR=%SCRIPT_DIR%utils\"
REM Go up from scripts/deploy/ to scripts/, then to scripts/utils/
set "UTILS_DIR=%SCRIPT_DIR%..\utils\"
set "COMMON_UTILS=%UTILS_DIR%common.bat"

REM Verify common.bat exists (for debugging)
if not exist "%COMMON_UTILS%" (
    echo.
    echo [ERRO] Arquivo common.bat nao encontrado em: %COMMON_UTILS%
    echo [DEBUG] SCRIPT_DIR=%SCRIPT_DIR%
    echo [DEBUG] UTILS_DIR=%UTILS_DIR%
    echo [DEBUG] Verificando caminhos...
    if exist "%SCRIPT_DIR%" echo   SCRIPT_DIR existe: SIM
    if not exist "%SCRIPT_DIR%" echo   SCRIPT_DIR existe: NAO
    if exist "%UTILS_DIR%" echo   UTILS_DIR existe: SIM
    if not exist "%UTILS_DIR%" echo   UTILS_DIR existe: NAO
    echo.
    echo Pressione qualquer tecla para continuar...
    pause >nul
    set "ERROR_OCCURRED=1"
    goto :error_exit
)

REM Load module paths
set "SSH_UTILS=%DEPLOY_UTILS_DIR%ssh-utils.bat"
set "IMAGE_UTILS=%DEPLOY_UTILS_DIR%image-utils.bat"
set "CONTAINER_UTILS=%DEPLOY_UTILS_DIR%container-utils.bat"
set "VERIFY_UTILS=%DEPLOY_UTILS_DIR%verify-utils.bat"

REM Verify all modules exist
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
if not exist "%VERIFY_UTILS%" (
    echo [ERRO] verify-utils.bat nao encontrado em: %VERIFY_UTILS%
    set "ERROR_OCCURRED=1"
    goto :error_exit
)

REM Registry configuration (will be set dynamically from .env)
set "REGISTRY="
set "GITHUB_REPO="

REM Jump to main code (skip error_exit label)
goto :main

REM ============================================
REM Function: Load GitHub Repository from .env
REM Sets: GITHUB_REPO variable
REM Returns: ERRORLEVEL 0 if success, 1 if failure
REM ============================================
:load_github_repo
setlocal enabledelayedexpansion
REM Get project root (go up from scripts/deploy/ to project root)
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

REM Load GITHUB_REPO from .env file
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
REM Error Exit Handler
REM ============================================
:error_exit
if %ERROR_OCCURRED% equ 1 (
    echo.
    echo [ERRO] Erro critico detectado. Verifique os mensagens acima.
    echo.
    endlocal
    exit /b 1
)
endlocal
exit /b 0

REM ============================================
REM Main Code
REM ============================================
:main

call "%COMMON_UTILS%" :print_header "Deploy Docker no Servidor Remoto"
echo.

REM ============================================
REM Step 0: Load GitHub Repository from .env
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 0/8: Carregando Configuração do Registry"
echo.

call :load_github_repo
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao carregar GITHUB_REPO do .env. Abortando."
    exit /b 1
)

REM Set registry dynamically
set "REGISTRY=ghcr.io/%GITHUB_REPO%"
call "%COMMON_UTILS%" :print_success "Registry configurado: %REGISTRY%"
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 1: Environment Checks
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 1/8: Verificações de Ambiente"
echo.

REM 1.1 Check SSH
call "%SSH_UTILS%" :verify_ssh_installed
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "SSH não está disponível. Abortando."
    exit /b 1
)
echo.

REM 1.2 Check SSH connection
REM Initialize SSH_ALIAS as empty before calling the function
set "SSH_ALIAS="
call "%SSH_UTILS%" :check_ssh_connection
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Não foi possível estabelecer conexão SSH. Abortando."
    exit /b 1
)

REM SSH_ALIAS should be set by check_ssh_connection via temp file
REM If still empty, use default
if "!SSH_ALIAS!"=="" (
    set "SSH_ALIAS=dev"
    call "%COMMON_UTILS%" :print_warning "Usando alias padrão 'dev'"
)
echo.
call "%COMMON_UTILS%" :print_success "Conexão SSH estabelecida: !SSH_ALIAS!"
echo.

REM Ensure SSH_ALIAS is available to all modules (already set globally)

REM 1.3 Check Docker on remote server
call "%CONTAINER_UTILS%" :check_docker_remote
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Docker não está disponível no servidor remoto. Abortando."
    exit /b 1
)
echo.

REM 1.4 Check curl (optional but recommended)
call "%VERIFY_UTILS%" :check_curl_available
set "CURL_AVAILABLE=%ERRORLEVEL%"
echo.

call "%COMMON_UTILS%" :print_success "Verificações de ambiente concluídas"
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 1.5: Verify Docker Authentication on Remote Server
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 1.5/8: Verificando Autenticação Docker no Servidor Remoto"
echo.

REM Load GitHub credentials from .env for authentication
set "LOGIN_SCRIPT=%SCRIPT_DIR%..\github\login.bat"
set "GITHUB_USERNAME="
set "GITHUB_TOKEN="

if exist "%LOGIN_SCRIPT%" (
    call "%COMMON_UTILS%" :print_info "Carregando credenciais do .env..."
    call "%LOGIN_SCRIPT%" :load_github_credentials
    if %ERRORLEVEL% equ 0 (
        REM Read credentials from temp file created by login.bat
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

REM Check if server is authenticated to ghcr.io by trying to inspect a manifest
call "%COMMON_UTILS%" :print_info "Verificando autenticação no GitHub Container Registry..."
call "%SSH_UTILS%" :execute_ssh_command "docker manifest inspect %REGISTRY%:latest >nul 2>&1" "Verificando autenticação"
set "AUTH_CHECK=%ERRORLEVEL%"

REM If authentication failed and we have credentials, try to login
if %AUTH_CHECK% neq 0 (
    if not "!GITHUB_USERNAME!"=="" if not "!GITHUB_TOKEN!"=="" (
        call "%COMMON_UTILS%" :print_warning "Servidor remoto não está autenticado no ghcr.io"
        call "%COMMON_UTILS%" :print_info "Tentando fazer login usando credenciais do .env..."
        
        REM Try to login on remote server via SSH
        REM Note: We need to escape the pipe for SSH
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
call "%COMMON_UTILS%" :print_header "Passo 2/8: Obtendo Última Versão da Imagem"
echo.

REM REGISTRY is already set and will be available in image-utils.bat context
call "%IMAGE_UTILS%" :get_latest_image_tag
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao obter tag da imagem. Abortando."
    exit /b 1
)

set "FULL_IMAGE_NAME=%REGISTRY%:%IMAGE_TAG%"
call "%COMMON_UTILS%" :print_success "Tag obtida: %IMAGE_TAG%"
call "%COMMON_UTILS%" :print_info "Imagem completa: %FULL_IMAGE_NAME%"
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 3: Stop and Remove Old Container
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 3/8: Parando e Removendo Container Antigo"
echo.

call "%CONTAINER_UTILS%" :stop_old_container
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao parar/remover container antigo. Abortando."
    exit /b 1
)
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 4: Pull Image
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 4/8: Fazendo Pull da Imagem"
echo.

call "%IMAGE_UTILS%" :pull_image "%FULL_IMAGE_NAME%"
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao fazer pull da imagem. Abortando."
    exit /b 1
)
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 5: Create Container
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 5/8: Criando Container"
echo.

call "%CONTAINER_UTILS%" :create_container "%FULL_IMAGE_NAME%"
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao criar container. Abortando."
    exit /b 1
)
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 6: Create Frontend Symlink
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 6/8: Criando Symlink do Frontend"
echo.

REM Wait a moment for container to be fully started
call "%COMMON_UTILS%" :print_info "Aguardando container iniciar..."
timeout /t 3 >nul 2>&1

call "%CONTAINER_UTILS%" :create_frontend_symlink
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_warning "Falha ao criar symlink - container pode não estar totalmente iniciado"
    call "%COMMON_UTILS%" :print_info "Tentando novamente em 5 segundos..."
    timeout /t 5 >nul 2>&1
    call "%CONTAINER_UTILS%" :create_frontend_symlink
    if %ERRORLEVEL% neq 0 (
        call "%COMMON_UTILS%" :print_error "Falha ao criar symlink após segunda tentativa"
        call "%COMMON_UTILS%" :print_info "Você pode criar manualmente com:"
        call "%COMMON_UTILS%" :print_info "  ssh %SSH_ALIAS% \"docker exec instructions-prod mkdir -p /app/client && docker exec instructions-prod ln -sf /app/server/public/client /app/client/dist\""
    )
)
echo.
call "%COMMON_UTILS%" :print_separator

REM ============================================
REM Step 7: Verify Deployment
REM ============================================
call "%COMMON_UTILS%" :print_header "Passo 7/8: Verificações Pós-Deploy"
echo.

REM Wait a bit more for services to be ready
call "%COMMON_UTILS%" :print_info "Aguardando serviços iniciarem..."
timeout /t 5 >nul 2>&1

call "%VERIFY_UTILS%" :verify_deployment
set "VERIFY_RESULT=%ERRORLEVEL%"
echo.

REM ============================================
REM Final Summary
REM ============================================
call "%COMMON_UTILS%" :print_separator
call "%COMMON_UTILS%" :print_header "Resumo do Deploy"
echo.

if %VERIFY_RESULT% equ 0 (
    call "%COMMON_UTILS%" :print_success "Deploy concluído com sucesso!"
    echo.
    call "%COMMON_UTILS%" :print_info "Container: instructions-prod"
    call "%COMMON_UTILS%" :print_info "Imagem: %FULL_IMAGE_NAME%"
    call "%COMMON_UTILS%" :print_info "Porta: 5000:5000"
    echo.
    call "%COMMON_UTILS%" :print_info "Para verificar logs:"
    call "%COMMON_UTILS%" :print_info "  ssh %SSH_ALIAS% \"docker logs instructions-prod --tail 50\""
    echo.
    call "%COMMON_UTILS%" :print_info "Para parar o container:"
    call "%COMMON_UTILS%" :print_info "  ssh %SSH_ALIAS% \"docker stop instructions-prod\""
    echo.
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_warning "Deploy concluído, mas algumas verificações falharam"
    call "%COMMON_UTILS%" :print_info "Verifique os logs acima para mais detalhes"
    echo.
    call "%COMMON_UTILS%" :print_info "Para verificar logs:"
    call "%COMMON_UTILS%" :print_info "  ssh %SSH_ALIAS% \"docker logs instructions-prod --tail 50\""
    echo.
    endlocal
    exit /b 1
)

endlocal
exit /b 0

