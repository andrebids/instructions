@echo off
REM ============================================
REM Docker validation functions
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" goto %~1

REM Load common functions
set "UTILS_DIR=%~dp0"

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

REM Exit if called directly (not to call a function)
exit /b 0

REM ============================================
REM Function: Check if Docker is installed
REM Returns: ERRORLEVEL 0 if installed, 1 if not
REM ============================================
:check_docker_installed
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "Docker não está instalado ou não está no PATH"
    call :print_info "Instale o Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit /b 1
)
call :print_success "Docker está instalado"
exit /b 0

REM ============================================
REM Function: Check if Docker is running
REM Returns: ERRORLEVEL 0 if running, 1 if not
REM ============================================
:check_docker_running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "Docker não está rodando"
    call :print_info "Inicie o Docker Desktop e tente novamente"
    exit /b 1
)
call :print_success "Docker está rodando"
exit /b 0

REM ============================================
REM Function: Check if docker-compose is available
REM Returns: ERRORLEVEL 0 if available, 1 if not
REM ============================================
:check_docker_compose
docker compose version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "COMPOSE_CMD=docker compose"
    call :print_success "docker compose (v2) está disponível"
    exit /b 0
)

docker-compose --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "COMPOSE_CMD=docker-compose"
    call :print_success "docker-compose (v1) está disponível"
    exit /b 0
)

call :print_error "docker-compose não está disponível"
call :print_info "Instale o Docker Compose ou atualize o Docker Desktop"
exit /b 1

REM ============================================
REM Function: Check if in correct project directory
REM Returns: ERRORLEVEL 0 if correct, 1 if not
REM ============================================
:check_project_directory
call "%UTILS_DIR%common.bat" :get_project_root
set "PROJECT_ROOT=%PROJECT_ROOT%"

if not exist "%PROJECT_ROOT%\docker-compose.dev.yml" (
    call :print_error "Arquivo docker-compose.dev.yml não encontrado"
    call :print_info "Execute o script a partir do diretório do projeto"
    exit /b 1
)

if not exist "%PROJECT_ROOT%\Dockerfile.dev" (
    call :print_error "Arquivo Dockerfile.dev não encontrado"
    call :print_info "Execute o script a partir do diretório do projeto"
    exit /b 1
)

call :print_success "Diretório do projeto verificado"
exit /b 0

REM ============================================
REM Function: Run all Docker checks
REM Returns: ERRORLEVEL 0 if all OK, 1 if any fails
REM ============================================
:check_all_docker
call :print_header "Verificando Pré-requisitos Docker"

call :check_docker_installed
if %ERRORLEVEL% neq 0 exit /b 1

call :check_docker_running
if %ERRORLEVEL% neq 0 exit /b 1

call :check_docker_compose
if %ERRORLEVEL% neq 0 exit /b 1

call :check_project_directory
if %ERRORLEVEL% neq 0 exit /b 1

call :print_success "Todas as verificações passaram"
exit /b 0

