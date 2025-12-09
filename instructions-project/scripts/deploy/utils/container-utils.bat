@echo off
REM ============================================
REM Container Utilities Module
REM Funções para gerenciamento de containers Docker
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" goto %~1

REM Load common functions
set "UTILS_DIR=%~dp0..\..\utils\"
set "COMMON_UTILS=%UTILS_DIR%common.bat"
set "SSH_UTILS=%~dp0ssh-utils.bat"

REM Container configuration
set "CONTAINER_NAME=instructions-prod"
set "CONTAINER_PORT=5000:5000"
set "CONTAINER_RESTART=unless-stopped"
set "CONTAINER_NETWORK=bridge"
set "VOLUME_HOST=/mnt/olimpo/.dev/web/thecore"
set "VOLUME_CONTAINER=/app/server/public/uploads"
set "ENV_FILE=~/apps/instructions-project/instructions-project/server/.env"

REM Exit if called directly (not to call a function)
exit /b 0

REM ============================================
REM Function: Check if Docker is installed on remote server
REM Returns: ERRORLEVEL 0 if installed, 1 if not
REM ============================================
:check_docker_remote
setlocal
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando se Docker está instalado no servidor remoto..."
call "%SSH_UTILS%" :execute_ssh_command "docker --version" "Docker não está instalado no servidor remoto"
set "DOCKER_CHECK=%ERRORLEVEL%"

if %DOCKER_CHECK% equ 0 (
    call "%COMMON_UTILS%" :print_success "Docker encontrado no servidor remoto"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_error "Docker não está instalado ou não está acessível no servidor remoto"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Stop and remove old container
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:stop_old_container
setlocal enabledelayedexpansion
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando se container '%CONTAINER_NAME%' existe..."

REM Check if container exists
call "%SSH_UTILS%" :execute_ssh_command "docker ps -a --filter name=%CONTAINER_NAME% --format '{{.Names}}'" "Erro ao verificar container"
set "CONTAINER_EXISTS=%ERRORLEVEL%"

REM Get container status
for /f "tokens=*" %%c in ('ssh %SSH_ALIAS% "docker ps -a --filter name=%CONTAINER_NAME% --format '{{.Names}}'" 2^>nul') do (
    set "EXISTING_CONTAINER=%%c"
)

if not "!EXISTING_CONTAINER!"=="" (
    call "%COMMON_UTILS%" :print_info "Container encontrado: !EXISTING_CONTAINER!"
    
    REM Check if container is running
    for /f "tokens=*" %%s in ('ssh %SSH_ALIAS% "docker ps --filter name=%CONTAINER_NAME% --format '{{.Names}}'" 2^>nul') do (
        set "RUNNING_CONTAINER=%%s"
    )
    
    if not "!RUNNING_CONTAINER!"=="" (
        call "%COMMON_UTILS%" :print_info "Parando container..."
        call "%SSH_UTILS%" :execute_ssh_command "docker stop %CONTAINER_NAME%" "Falha ao parar container"
        if %ERRORLEVEL% neq 0 (
            endlocal
            exit /b 1
        )
        call "%COMMON_UTILS%" :print_success "Container parado"
    )
    
    call "%COMMON_UTILS%" :print_info "Removendo container..."
    call "%SSH_UTILS%" :execute_ssh_command "docker rm %CONTAINER_NAME%" "Falha ao remover container"
    if %ERRORLEVEL% neq 0 (
        endlocal
        exit /b 1
    )
    call "%COMMON_UTILS%" :print_success "Container removido"
) else (
    call "%COMMON_UTILS%" :print_info "Container '%CONTAINER_NAME%' não existe, prosseguindo..."
)

endlocal
exit /b 0

REM ============================================
REM Function: Create new container
REM Usage: call :create_container "image_name:tag"
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:create_container
setlocal enabledelayedexpansion
set "IMAGE_NAME=%~1"
if "%IMAGE_NAME%"=="" (
    call "%COMMON_UTILS%" :print_error "Nome da imagem não fornecido"
    endlocal
    exit /b 1
)

if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Criando container '%CONTAINER_NAME%'..."
call "%COMMON_UTILS%" :print_info "Imagem: %IMAGE_NAME%"
call "%COMMON_UTILS%" :print_info "Porta: %CONTAINER_PORT%"
call "%COMMON_UTILS%" :print_info "Restart: %CONTAINER_RESTART%"
call "%COMMON_UTILS%" :print_info "Network: %CONTAINER_NETWORK%"
call "%COMMON_UTILS%" :print_info "Volume: %VOLUME_HOST% -> %VOLUME_CONTAINER%"
call "%COMMON_UTILS%" :print_info "Env file: %ENV_FILE%"

REM Build docker run command
set "DOCKER_CMD=docker run -d --name %CONTAINER_NAME% -p %CONTAINER_PORT% --restart %CONTAINER_RESTART% --network %CONTAINER_NETWORK% --add-host host.docker.internal:host-gateway -v %VOLUME_HOST%:%VOLUME_CONTAINER% --env-file %ENV_FILE% %IMAGE_NAME%"

call "%COMMON_UTILS%" :print_info "Comando: %DOCKER_CMD%"
echo.

REM Execute docker run via SSH
call "%SSH_UTILS%" :execute_ssh_command "%DOCKER_CMD%" "Falha ao criar container"
set "CREATE_RESULT=%ERRORLEVEL%"

if %CREATE_RESULT% equ 0 (
    call "%COMMON_UTILS%" :print_success "Container criado com sucesso"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_error "Falha ao criar container"
    call "%COMMON_UTILS%" :print_info "Verifique se:"
    call "%COMMON_UTILS%" :print_info "  - A imagem existe localmente no servidor"
    call "%COMMON_UTILS%" :print_info "  - O volume host existe: %VOLUME_HOST%"
    call "%COMMON_UTILS%" :print_info "  - O arquivo .env existe: %ENV_FILE%"
    call "%COMMON_UTILS%" :print_info "  - As portas não estão em uso"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Create frontend symlink
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:create_frontend_symlink
setlocal enabledelayedexpansion
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Criando symlink para frontend..."

REM Create directory structure first
call "%SSH_UTILS%" :execute_ssh_command "docker exec %CONTAINER_NAME% mkdir -p /app/client" "Falha ao criar diretório /app/client"
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao criar diretório no container"
    endlocal
    exit /b 1
)

REM Create symlink
call "%SSH_UTILS%" :execute_ssh_command "docker exec %CONTAINER_NAME% ln -sf /app/server/public/client /app/client/dist" "Falha ao criar symlink"
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "Falha ao criar symlink"
    endlocal
    exit /b 1
)

REM Verify symlink was created
call "%SSH_UTILS%" :execute_ssh_command "docker exec %CONTAINER_NAME% ls -la /app/client/dist" "Falha ao verificar symlink"
if %ERRORLEVEL% equ 0 (
    call "%COMMON_UTILS%" :print_success "Symlink criado com sucesso"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_warning "Symlink pode não ter sido criado corretamente"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Verify container is running
REM Returns: ERRORLEVEL 0 if running, 1 if not
REM ============================================
:verify_container_running
setlocal enabledelayedexpansion
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando se container '%CONTAINER_NAME%' está rodando..."

for /f "tokens=*" %%c in ('ssh %SSH_ALIAS% "docker ps --filter name=%CONTAINER_NAME% --format '{{.Names}}'" 2^>nul') do (
    set "RUNNING_CONTAINER=%%c"
)

if not "!RUNNING_CONTAINER!"=="" (
    call "%COMMON_UTILS%" :print_success "Container está rodando: !RUNNING_CONTAINER!"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_error "Container '%CONTAINER_NAME%' não está rodando"
    endlocal
    exit /b 1
)

