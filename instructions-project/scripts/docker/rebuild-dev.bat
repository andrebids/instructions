@echo off
REM ============================================
REM Rebuild development environment
REM ============================================

setlocal enabledelayedexpansion

REM Load common functions
set "UTILS_DIR=%~dp0..\utils\"

REM Load color variables
call "%UTILS_DIR%common.bat" >nul 2>&1

REM Define wrapper functions that call common.bat functions
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

REM Get project root (go up from scripts/docker/ to project root)
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
cd /d "%PROJECT_ROOT%"

REM Container name
set "CONTAINER_NAME=instructions-dev"
set "COMPOSE_FILE=docker-compose.dev.yml"

call :print_header "Rebuild do Ambiente de Desenvolvimento"

REM Check Docker prerequisites
call :check_all_docker
if %ERRORLEVEL% neq 0 (
    call :print_error "Verificações falharam. Abortando."
    exit /b 1
)

REM Determine compose command
call :check_docker_compose
if %ERRORLEVEL% neq 0 (
    exit /b 1
)

REM Step 1: Stop and remove current container
call :print_separator
call :print_info "Parando e removendo container atual..."

docker ps -a --filter "name=%CONTAINER_NAME%" --format "{{.Names}}" | findstr /i "%CONTAINER_NAME%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :print_info "Parando container: %CONTAINER_NAME%"
    docker stop %CONTAINER_NAME% >nul 2>&1
    
    call :print_info "Removendo container: %CONTAINER_NAME%"
    docker rm %CONTAINER_NAME% >nul 2>&1
    
    call :print_success "Container removido"
) else (
    call :print_info "Container não está rodando"
)

REM Step 2: Cleanup old images before build
call :print_separator
set "CLEANUP_SCRIPT=%~dp0cleanup-images.bat"
call "%CLEANUP_SCRIPT%" :cleanup_before_build

REM Step 3: Build new image without cache
call :print_separator
call :print_info "Construindo nova imagem (sem cache)..."
call :print_info "Isso pode levar alguns minutos..."

%COMPOSE_CMD% -f %COMPOSE_FILE% build --no-cache
set "BUILD_RESULT=%ERRORLEVEL%"

if %BUILD_RESULT% neq 0 (
    call :print_error "Build falhou!"
    exit /b 1
)

call :print_success "Build concluída com sucesso"

REM Step 4: Start new container
call :print_separator
call :print_info "Iniciando novo container..."

%COMPOSE_CMD% -f %COMPOSE_FILE% up -d --force-recreate
set "UP_RESULT=%ERRORLEVEL%"

if %UP_RESULT% neq 0 (
    call :print_error "Falha ao iniciar container!"
    exit /b 1
)

call :print_success "Container iniciado"

REM Step 5: Cleanup after successful build
call :print_separator
set "CLEANUP_SCRIPT=%~dp0cleanup-images.bat"
call "%CLEANUP_SCRIPT%" :cleanup_after_build

REM Step 6: Show container status and logs
call :print_separator
call :print_info "Status do container:"
docker ps --filter "name=%CONTAINER_NAME%" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

call :print_separator
call :print_info "Últimas linhas dos logs:"
docker logs --tail 20 %CONTAINER_NAME% 2>&1

call :print_separator
call :print_success "Rebuild concluído com sucesso!"
call :print_info "Frontend: http://localhost:3003"
call :print_info "Backend:  http://localhost:5001"
call :print_info ""
call :print_info "Para ver os logs em tempo real:"
call :print_info "  docker logs -f %CONTAINER_NAME%"

endlocal
exit /b 0

