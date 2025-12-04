@echo off
REM ============================================
REM Docker image cleanup functions
REM ============================================

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

REM ============================================
REM Function: Cleanup dangling images
REM ============================================
:cleanup_dangling_images
setlocal
call :print_info "Limpando imagens dangling (não utilizadas)..."

docker image prune -f >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :print_success "Imagens dangling removidas"
    endlocal
    exit /b 0
) else (
    call :print_warning "Nenhuma imagem dangling encontrada ou erro ao limpar"
    endlocal
    exit /b 0
)

REM ============================================
REM Function: Cleanup old project images (dev)
REM Keeps only the most recent image
REM ============================================
:cleanup_old_project_images
setlocal enabledelayedexpansion
set "IMAGE_PATTERN=%~1"
set "KEEP_TAG=%~2"

if "%IMAGE_PATTERN%"=="" (
    set "IMAGE_PATTERN=instructions-project"
)

if "%KEEP_TAG%"=="" (
    set "KEEP_TAG=latest"
)

call :print_info "Limpando imagens antigas do projeto: %IMAGE_PATTERN%"
call :print_info "Mantendo apenas a tag: %KEEP_TAG%"

REM Get all images matching the pattern
set "FOUND_IMAGES=0"
for /f "tokens=*" %%i in ('docker images --filter "reference=%IMAGE_PATTERN%*" --format "{{.Repository}}:{{.Tag}} {{.ID}}"') do (
    set "LINE=%%i"
    set "IMAGE_NAME=!LINE: =!"
    set "IMAGE_NAME=!IMAGE_NAME:~0,-13!"
    set "IMAGE_ID=!LINE:~-12!"
    
    REM Extract tag from image name
    for /f "tokens=2 delims=:" %%t in ("!IMAGE_NAME!") do set "TAG=%%t"
    
    REM Skip if it's the tag we want to keep
    if /i not "!TAG!"=="%KEEP_TAG%" (
        call :print_info "Removendo imagem antiga: !IMAGE_NAME!"
        docker rmi !IMAGE_NAME! >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            set /a FOUND_IMAGES+=1
        )
    )
)

if %FOUND_IMAGES% gtr 0 (
    call :print_success "%FOUND_IMAGES% imagem(ns) antiga(s) removida(s)"
) else (
    call :print_info "Nenhuma imagem antiga encontrada para remover"
)

endlocal
exit /b 0

REM ============================================
REM Function: Cleanup old dev images from compose
REM Identifies images by compose service name
REM ============================================
:cleanup_old_dev_images
setlocal enabledelayedexpansion
REM Get project root (go up from scripts/docker/ to project root)
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"

REM Try to get image name from docker-compose
set "COMPOSE_FILE=%PROJECT_ROOT%\docker-compose.dev.yml"
if not exist "%COMPOSE_FILE%" (
    call :print_warning "Arquivo docker-compose.dev.yml não encontrado"
    endlocal
    exit /b 1
)

REM Get service name and build context
REM Default pattern: instructions-project-app or similar
set "SERVICE_NAME=app"
set "IMAGE_PATTERN=instructions-project"

REM Try to find images created by this compose file
REM Look for images with the container name pattern
set "CONTAINER_NAME=instructions-dev"

REM Get image ID from container if it exists
for /f "tokens=*" %%i in ('docker ps -a --filter "name=%CONTAINER_NAME%" --format "{{.Image}}" 2^>nul') do (
    set "CURRENT_IMAGE=%%i"
    if not "!CURRENT_IMAGE!"=="" (
        REM Extract base name without tag
        for /f "tokens=1 delims=:" %%n in ("!CURRENT_IMAGE!") do set "IMAGE_BASE=%%n"
        call :cleanup_old_project_images "!IMAGE_BASE!" "latest"
        goto :found_image
    )
)
:found_image

REM Also cleanup by compose project name
REM Docker Compose creates images with pattern: projectname_servicename
for /f "tokens=*" %%i in ('docker images --format "{{.Repository}}:{{.Tag}}" ^| findstr /i "%IMAGE_PATTERN%"') do (
    set "IMG=%%i"
    REM Check if it's not the latest or current
    echo !IMG! | findstr /i "latest" >nul
    if !ERRORLEVEL! neq 0 (
        call :print_info "Removendo imagem: !IMG!"
        docker rmi !IMG! >nul 2>&1
    )
)

call :cleanup_dangling_images

endlocal
exit /b 0

REM ============================================
REM Function: Cleanup build cache (optional)
REM ============================================
:cleanup_build_cache
setlocal
call :print_info "Limpando cache de build do Docker..."

docker builder prune -f >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call :print_success "Cache de build limpo"
    endlocal
    exit /b 0
) else (
    call :print_warning "Erro ao limpar cache de build"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Full cleanup before build
REM ============================================
:cleanup_before_build
setlocal
call :print_header "Limpando Imagens Antigas (Antes do Build)"

call :cleanup_old_dev_images
call :cleanup_dangling_images

call :print_success "Limpeza concluída"
endlocal
exit /b 0

REM ============================================
REM Function: Full cleanup after build
REM ============================================
:cleanup_after_build
setlocal
call :print_header "Limpando Imagens Intermediárias (Após Build)"

call :cleanup_dangling_images
call :cleanup_old_dev_images

call :print_success "Limpeza pós-build concluída"
endlocal
exit /b 0

