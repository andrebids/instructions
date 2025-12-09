@echo off
REM ============================================
REM Container Utilities Module
REM Funções para gerenciamento de containers Docker
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" (
    REM Log that we're jumping to a function (if common.bat is available)
    if exist "%UTILS_DIR%common.bat" (
        call "%UTILS_DIR%common.bat" :print_info "[DEBUG] container-utils: Pulando para funcao %~1"
    )
    goto %~1
)

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
REM Initialize container config if not already set (when called directly)
if "%CONTAINER_NAME%"=="" (
    set "CONTAINER_NAME=instructions-prod"
)
REM Save CONTAINER_NAME before setlocal
set "SAVED_CONTAINER_NAME=%CONTAINER_NAME%"
setlocal enabledelayedexpansion
REM Restore CONTAINER_NAME in local scope
set "CONTAINER_NAME=!SAVED_CONTAINER_NAME!"

if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando se container '%CONTAINER_NAME%' existe..."

REM Check if container exists (use exact name match)
REM List all containers and filter for exact name match
set "EXISTING_CONTAINER="
for /f "tokens=*" %%c in ('ssh %SSH_ALIAS% "docker ps -a --format '{{.Names}}'" 2^>nul') do (
    set "CONTAINER_LINE=%%c"
    REM Check if this line matches exactly our container name
    if /i "!CONTAINER_LINE!"=="%CONTAINER_NAME%" (
        set "EXISTING_CONTAINER=!CONTAINER_LINE!"
    )
)

if not "!EXISTING_CONTAINER!"=="" (
    call "%COMMON_UTILS%" :print_info "Container encontrado: !EXISTING_CONTAINER!"
    
    REM Check if container is running (exact match)
    set "RUNNING_CONTAINER="
    for /f "tokens=*" %%s in ('ssh %SSH_ALIAS% "docker ps --format '{{.Names}}'" 2^>nul') do (
        set "RUNNING_LINE=%%s"
        REM Check if this line matches exactly our container name
        if /i "!RUNNING_LINE!"=="%CONTAINER_NAME%" (
            set "RUNNING_CONTAINER=!RUNNING_LINE!"
        )
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
    REM Try to remove container (force if running)
    call "%SSH_UTILS%" :execute_ssh_command "docker rm -f %CONTAINER_NAME%" "Falha ao remover container"
    if %ERRORLEVEL% neq 0 (
        REM If force remove failed, try normal remove
        call "%SSH_UTILS%" :execute_ssh_command "docker rm %CONTAINER_NAME%" "Falha ao remover container"
        if %ERRORLEVEL% neq 0 (
            call "%COMMON_UTILS%" :print_warning "Não foi possível remover o container. Tentando novamente..."
            REM Wait a moment and try again
            timeout /t 2 >nul 2>&1
            call "%SSH_UTILS%" :execute_ssh_command "docker rm -f %CONTAINER_NAME%" "Falha ao remover container após segunda tentativa"
            if %ERRORLEVEL% neq 0 (
                endlocal
                exit /b 1
            )
        )
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
REM Log entry point - try to log immediately
REM Use echo directly to ensure it's written even if common.bat has issues
echo [DEBUG] create_container: FUNCAO CHAMADA - Iniciando >> "%TEMP%\container-debug.log" 2>&1
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Iniciando função" 2>&1
echo [DEBUG] create_container: Apos chamar print_info >> "%TEMP%\container-debug.log" 2>&1

REM Initialize container config if not already set (when called directly)
if "%CONTAINER_NAME%"=="" (
    call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Inicializando variáveis de configuração"
    set "CONTAINER_NAME=instructions-prod"
    set "CONTAINER_PORT=5000:5000"
    set "CONTAINER_RESTART=unless-stopped"
    set "CONTAINER_NETWORK=bridge"
    set "VOLUME_HOST=/mnt/olimpo/.dev/web/thecore"
    set "VOLUME_CONTAINER=/app/server/public/uploads"
    set "ENV_FILE=~/apps/instructions-project/instructions-project/server/.env"
)
REM Save container config variables before setlocal
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Salvando variáveis antes de setlocal"
set "SAVED_CONTAINER_NAME=%CONTAINER_NAME%"
set "SAVED_CONTAINER_PORT=%CONTAINER_PORT%"
set "SAVED_CONTAINER_RESTART=%CONTAINER_RESTART%"
set "SAVED_CONTAINER_NETWORK=%CONTAINER_NETWORK%"
set "SAVED_VOLUME_HOST=%VOLUME_HOST%"
set "SAVED_VOLUME_CONTAINER=%VOLUME_CONTAINER%"
set "SAVED_ENV_FILE=%ENV_FILE%"
setlocal enabledelayedexpansion
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: setlocal ativado, restaurando variáveis"
REM Restore container config variables in local scope
set "CONTAINER_NAME=!SAVED_CONTAINER_NAME!"
set "CONTAINER_PORT=!SAVED_CONTAINER_PORT!"
set "CONTAINER_RESTART=!SAVED_CONTAINER_RESTART!"
set "CONTAINER_NETWORK=!SAVED_CONTAINER_NETWORK!"
set "VOLUME_HOST=!SAVED_VOLUME_HOST!"
set "VOLUME_CONTAINER=!SAVED_VOLUME_CONTAINER!"
set "ENV_FILE=!SAVED_ENV_FILE!"

REM Skip function name if it's the first argument
REM When called from another bat file: %~1 = function name, %~2 = image name
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Processando argumentos"
set "IMAGE_NAME=%~1"
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Argumento 1: %IMAGE_NAME%"
if "!IMAGE_NAME!"==":create_container" set "IMAGE_NAME=%~2"
if "!IMAGE_NAME!"=="" (
    if not "%~2"=="" set "IMAGE_NAME=%~2"
    if "!IMAGE_NAME!"=="" if not "%~3"=="" set "IMAGE_NAME=%~3"
)
if "!IMAGE_NAME!"=="" (
    call "%COMMON_UTILS%" :print_error "Nome da imagem não fornecido"
    call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: ERRO - Nome da imagem vazio"
    endlocal
    exit /b 1
)
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Nome da imagem: !IMAGE_NAME!"

if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: ERRO - SSH_ALIAS vazio"
    endlocal
    exit /b 1
)
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: SSH_ALIAS: %SSH_ALIAS%"

call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Exibindo informações do container"
call "%COMMON_UTILS%" :print_info "Criando container '%CONTAINER_NAME%'..."
call "%COMMON_UTILS%" :print_info "Imagem: %IMAGE_NAME%"
call "%COMMON_UTILS%" :print_info "Porta: %CONTAINER_PORT%"
call "%COMMON_UTILS%" :print_info "Restart: %CONTAINER_RESTART%"
call "%COMMON_UTILS%" :print_info "Network: %CONTAINER_NETWORK%"
call "%COMMON_UTILS%" :print_info "Volume: %VOLUME_HOST% -> %VOLUME_CONTAINER%"
call "%COMMON_UTILS%" :print_info "Env file: %ENV_FILE%"

REM Build docker run command
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Construindo comando Docker"
set "DOCKER_CMD=docker run -d --name %CONTAINER_NAME% -p %CONTAINER_PORT% --restart %CONTAINER_RESTART% --network %CONTAINER_NETWORK% --add-host host.docker.internal:host-gateway -v %VOLUME_HOST%:%VOLUME_CONTAINER% --env-file %ENV_FILE% %IMAGE_NAME%"

call "%COMMON_UTILS%" :print_info "Comando: %DOCKER_CMD%"
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Comando construído, preparando para executar via SSH"
echo.

REM Execute docker run via SSH
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: Chamando execute_ssh_command..."
call "%COMMON_UTILS%" :print_info "Executando comando Docker via SSH..."
call "%SSH_UTILS%" :execute_ssh_command "%DOCKER_CMD%" "Falha ao criar container"
set "CREATE_RESULT=%ERRORLEVEL%"
call "%COMMON_UTILS%" :print_info "[DEBUG] create_container: execute_ssh_command retornou: %CREATE_RESULT%"
call "%COMMON_UTILS%" :print_info "Comando Docker executado, resultado: %CREATE_RESULT%"

if %CREATE_RESULT% equ 0 (
    call "%COMMON_UTILS%" :print_success "Container criado com sucesso"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_error "Falha ao criar container (codigo: %CREATE_RESULT%)"
    call "%COMMON_UTILS%" :print_info "Verifique se:"
    call "%COMMON_UTILS%" :print_info "  - A imagem existe localmente no servidor"
    call "%COMMON_UTILS%" :print_info "  - O volume host existe: %VOLUME_HOST%"
    call "%COMMON_UTILS%" :print_info "  - O arquivo .env existe: %ENV_FILE%"
    call "%COMMON_UTILS%" :print_info "  - As portas não estão em uso"
    call "%COMMON_UTILS%" :print_info "  - O container anterior foi removido completamente"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Create frontend symlink
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:create_frontend_symlink
REM Initialize container config if not already set (when called directly)
if "%CONTAINER_NAME%"=="" (
    set "CONTAINER_NAME=instructions-prod"
)
REM Save CONTAINER_NAME before setlocal
set "SAVED_CONTAINER_NAME=%CONTAINER_NAME%"
setlocal enabledelayedexpansion
REM Restore CONTAINER_NAME in local scope
set "CONTAINER_NAME=!SAVED_CONTAINER_NAME!"

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
REM Initialize container config if not already set (when called directly)
if "%CONTAINER_NAME%"=="" (
    set "CONTAINER_NAME=instructions-prod"
)
REM Save CONTAINER_NAME before setlocal
set "SAVED_CONTAINER_NAME=%CONTAINER_NAME%"
setlocal enabledelayedexpansion
REM Restore CONTAINER_NAME in local scope
set "CONTAINER_NAME=!SAVED_CONTAINER_NAME!"

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

