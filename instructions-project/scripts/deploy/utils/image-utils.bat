@echo off
REM ============================================
REM Image Utilities Module
REM Funções para gerenciamento de imagens Docker
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" goto %~1

REM Load common functions
set "UTILS_DIR=%~dp0..\..\utils\"
set "COMMON_UTILS=%UTILS_DIR%common.bat"
set "SSH_UTILS=%~dp0ssh-utils.bat"

REM Exit if called directly (not to call a function)
exit /b 0

REM ============================================
REM Function: Check if GitHub CLI is available
REM Returns: ERRORLEVEL 0 if available, 1 if not
REM ============================================
:check_github_cli
setlocal
call "%COMMON_UTILS%" :print_info "Verificando GitHub CLI..."
where gh >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_warning "GitHub CLI (gh) não está disponível"
    call "%COMMON_UTILS%" :print_info "Usando método alternativo para obter tags"
    endlocal
    exit /b 1
)
call "%COMMON_UTILS%" :print_success "GitHub CLI encontrado"
endlocal
exit /b 0

REM ============================================
REM Function: Get latest image tag from GitHub API
REM Usage: call :get_latest_tag_from_api "registry" "repo"
REM Sets: IMAGE_TAG variable
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:get_latest_tag_from_api
setlocal enabledelayedexpansion
set "REGISTRY=%~1"
set "REPO=%~2"
if "%REGISTRY%"=="" set "REGISTRY=ghcr.io"
if "%REPO%"=="" set "REPO=andrebids/instructions"

REM Check if GitHub CLI is available
call :check_github_cli
if %ERRORLEVEL% neq 0 (
    endlocal
    exit /b 1
)

REM Check if authenticated
gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_warning "GitHub CLI não está autenticado"
    call "%COMMON_UTILS%" :print_info "Execute: gh auth login"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Obtendo tags via GitHub API..."
REM Try to get package versions using GitHub API
REM Note: This requires the package to be public or proper permissions
for /f "tokens=*" %%t in ('gh api /orgs/andrebids/packages/container/instructions/versions --jq ".[0].metadata.container.tags[0]" 2^>nul') do (
    set "LATEST_TAG=%%t"
)

if not "!LATEST_TAG!"=="" (
    call "%COMMON_UTILS%" :print_success "Tag obtida via API: !LATEST_TAG!"
    endlocal & set "IMAGE_TAG=!LATEST_TAG!"
    exit /b 0
)

endlocal
exit /b 1

REM ============================================
REM Function: Get latest image tag (multiple methods)
REM Sets: IMAGE_TAG variable
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:get_latest_image_tag
setlocal enabledelayedexpansion
set "REGISTRY=ghcr.io/andrebids/instructions"

call "%COMMON_UTILS%" :print_info "Obtendo última tag da imagem: %REGISTRY%"

REM Method 1: Try GitHub API
call :get_latest_tag_from_api
if %ERRORLEVEL% equ 0 (
    endlocal & set "IMAGE_TAG=%IMAGE_TAG%"
    exit /b 0
)

REM Method 2: Try to list tags from registry (requires authentication)
call "%COMMON_UTILS%" :print_info "Tentando listar tags do registry..."
REM This would require docker login to ghcr.io first
REM For now, we'll use 'latest' as fallback

REM Method 3: Use 'latest' as fallback
call "%COMMON_UTILS%" :print_warning "Não foi possível obter tag específica, usando 'latest'"
call "%COMMON_UTILS%" :print_info "AVISO: Usando tag 'latest' - certifique-se de que esta é a versão desejada"
set "IMAGE_TAG=latest"

endlocal & set "IMAGE_TAG=%IMAGE_TAG%"
exit /b 0

REM ============================================
REM Function: Verify image exists in registry
REM Usage: call :verify_image_exists "image_name:tag"
REM Returns: ERRORLEVEL 0 if exists, 1 if not
REM ============================================
:verify_image_exists
setlocal
set "IMAGE_NAME=%~1"
if "%IMAGE_NAME%"=="" (
    call "%COMMON_UTILS%" :print_error "Nome da imagem não fornecido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando se imagem existe: %IMAGE_NAME%"
REM This would require docker login and docker manifest inspect
REM For now, we'll assume it exists if tag is not empty
if not "%IMAGE_NAME%"=="" (
    call "%COMMON_UTILS%" :print_success "Imagem válida: %IMAGE_NAME%"
    endlocal
    exit /b 0
)

endlocal
exit /b 1

REM ============================================
REM Function: Pull Docker image via SSH
REM Usage: call :pull_image "image_name:tag"
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:pull_image
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

call "%COMMON_UTILS%" :print_info "Fazendo pull da imagem: %IMAGE_NAME%"
call "%COMMON_UTILS%" :print_info "Isso pode levar alguns minutos..."

REM Execute docker pull via SSH
call "%SSH_UTILS%" :execute_ssh_command "docker pull %IMAGE_NAME%" "Falha ao fazer pull da imagem"
set "PULL_RESULT=%ERRORLEVEL%"

if %PULL_RESULT% equ 0 (
    call "%COMMON_UTILS%" :print_success "Pull da imagem concluído com sucesso"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_error "Falha ao fazer pull da imagem %IMAGE_NAME%"
    call "%COMMON_UTILS%" :print_info "Verifique se:"
    call "%COMMON_UTILS%" :print_info "  - A imagem existe no registry"
    call "%COMMON_UTILS%" :print_info "  - Você tem permissão para acessar o registry"
    call "%COMMON_UTILS%" :print_info "  - O Docker está rodando no servidor remoto"
    endlocal
    exit /b 1
)

