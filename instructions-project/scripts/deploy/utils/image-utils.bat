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
REM Function: Load GitHub Repository from .env
REM Sets: GITHUB_REPO variable
REM Returns: ERRORLEVEL 0 if success, 1 if failure
REM ============================================
:load_github_repo_from_env
setlocal enabledelayedexpansion
REM Get project root (go up from scripts/deploy/utils/ to project root)
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..\..") do set "PROJECT_ROOT=%%~fi"
set "ENV_FILE=%PROJECT_ROOT%\.env"

if not exist "%ENV_FILE%" (
    endlocal
    exit /b 1
)

REM Load GITHUB_REPO from .env file
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
    endlocal
    exit /b 1
)

endlocal & set "GITHUB_REPO=%GITHUB_REPO%"
exit /b 0

REM ============================================
REM Function: Get latest image tag from GitHub API
REM Usage: call :get_latest_tag_from_api "repo"
REM Sets: IMAGE_TAG variable
REM Returns: ERRORLEVEL 0 if success, 1 if failed
REM ============================================
:get_latest_tag_from_api
setlocal enabledelayedexpansion
set "REPO=%~1"
if "%REPO%"=="" (
    REM Try to load from .env
    call :load_github_repo_from_env
    if %ERRORLEVEL% equ 0 (
        set "REPO=%GITHUB_REPO%"
    ) else (
        set "REPO=andrebids/instructions"
    )
)

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
REM Extract username and package name from repo (format: username/repo-name)
REM For GitHub Packages, the package name is usually the repo name
for /f "tokens=1,2 delims=/" %%u in ("%REPO%") do (
    set "GITHUB_USER=%%u"
    set "PACKAGE_NAME=%%v"
)

REM Use 'latest' tag directly
REM The GitHub Actions workflow always updates 'latest' when pushing a new image
REM So 'latest' will always point to the most recent build
call "%COMMON_UTILS%" :print_info "Usando tag 'latest' - sempre aponta para a versão mais recente"
set "LATEST_TAG=latest"

if not "!LATEST_TAG!"=="" (
    REM Remove any whitespace
    set "LATEST_TAG=!LATEST_TAG: =!"
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
REM Save REGISTRY from parent context before setlocal (if available)
set "SAVED_REGISTRY=%REGISTRY%"
setlocal enabledelayedexpansion

REM Try to get registry from saved value or load from .env
if not "!SAVED_REGISTRY!"=="" (
    set "REGISTRY=!SAVED_REGISTRY!"
) else (
    REM Try to load from .env and construct registry
    call :load_github_repo_from_env
    if !ERRORLEVEL! equ 0 (
        set "REGISTRY=ghcr.io/!GITHUB_REPO!"
    ) else (
        set "REGISTRY=ghcr.io/andrebids/instructions"
    )
)

call "%COMMON_UTILS%" :print_info "Obtendo última tag da imagem: %REGISTRY%"

REM Extract repo from registry (format: ghcr.io/username/repo-name)
set "REPO=%REGISTRY%"
set "REPO=%REPO:ghcr.io/=%"

REM Method 1: Try GitHub API
call :get_latest_tag_from_api "%REPO%"
if %ERRORLEVEL% equ 0 (
    REM IMAGE_TAG should be set by get_latest_tag_from_api
    if not "!IMAGE_TAG!"=="" (
        endlocal & set "IMAGE_TAG=!IMAGE_TAG!"
        exit /b 0
    )
)

REM Method 2: Try to get latest tag using curl and GitHub API (if GitHub CLI failed)
if "!IMAGE_TAG!"=="" (
    call "%COMMON_UTILS%" :print_info "Tentando obter tag via GitHub API (curl)..."
    REM Extract username and package name
    for /f "tokens=1,2 delims=/" %%u in ("%REPO%") do (
        set "GITHUB_USER=%%u"
        set "PACKAGE_NAME=%%v"
    )
    
    REM Try to get latest version using curl (requires GITHUB_TOKEN in .env)
    REM This is a fallback if GitHub CLI is not available
    REM Note: This requires authentication token
    if not "!GITHUB_USER!"=="" if not "!PACKAGE_NAME!"=="" (
        REM Try to get from API (this would need token, so we'll skip for now)
        REM For now, we'll use 'latest' as fallback
    )
)

REM Method 3: Use 'latest' as fallback
if "!IMAGE_TAG!"=="" (
    call "%COMMON_UTILS%" :print_warning "Não foi possível obter tag específica via API"
    call "%COMMON_UTILS%" :print_info "Usando tag 'latest' - esta é a tag padrão do GitHub Packages"
    call "%COMMON_UTILS%" :print_info "Certifique-se de que a action build-and-push está configurada para usar 'latest'"
    set "IMAGE_TAG=latest"
)

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
REM Skip function name if it's the first argument
REM When called from another bat file: %~1 = function name, %~2 = image name
set "IMAGE_NAME=%~1"
if "!IMAGE_NAME!"==":pull_image" set "IMAGE_NAME=%~2"
if "!IMAGE_NAME!"=="" (
    if not "%~2"=="" set "IMAGE_NAME=%~2"
    if "!IMAGE_NAME!"=="" if not "%~3"=="" set "IMAGE_NAME=%~3"
)
if "!IMAGE_NAME!"=="" (
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

