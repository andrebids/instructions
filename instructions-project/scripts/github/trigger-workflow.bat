@echo off
REM ============================================
REM Trigger GitHub Actions Workflow
REM Dispara o workflow "Build and Push Docker Image" no GitHub
REM ============================================

setlocal enabledelayedexpansion

REM Load common functions
set "UTILS_DIR=%~dp0..\utils\"

REM Get project root
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
cd /d "%PROJECT_ROOT%"

REM Simple print functions
:print_info
echo [INFO] %~1
goto :eof

:print_success
echo [OK] %~1
goto :eof

:print_error
echo [ERRO] %~1
goto :eof

:print_warning
echo [AVISO] %~1
goto :eof

REM ============================================
REM Main Code
REM ============================================

echo.
echo ========================================
echo Trigger GitHub Actions Workflow
echo ========================================
echo.

REM Check if GitHub CLI is installed
where gh >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "GitHub CLI (gh) nao esta instalado"
    call :print_info "Instale o GitHub CLI: https://cli.github.com/"
    call :print_info "Ou use a opcao 2 do menu para build local"
    exit /b 1
)

call :print_success "GitHub CLI encontrado"

REM Check if user is logged in
gh auth status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "Voce nao esta autenticado no GitHub CLI"
    call :print_info "Execute: gh auth login"
    exit /b 1
)

call :print_success "Autenticado no GitHub CLI"

REM Get repository name from git remote
for /f "tokens=2 delims=: " %%r in ('git remote get-url origin 2^>nul') do set "REPO=%%r"
if "%REPO%"=="" (
    call :print_error "Nao foi possivel determinar o repositorio"
    call :print_info "Certifique-se de estar em um repositorio Git valido"
    exit /b 1
)

REM Remove .git suffix if present
set "REPO=%REPO:.git=%"

call :print_info "Repositorio: %REPO%"
call :print_info "Workflow: Build and Push Docker Image"
echo.

REM Ask for confirmation
call :print_info "Isso vai disparar o workflow no GitHub."
call :print_info "Deseja continuar? (S/N)"
set /p "CONFIRM="

if /i not "%CONFIRM%"=="S" (
    call :print_info "Operacao cancelada"
    exit /b 0
)

echo.
call :print_info "Disparando workflow no GitHub..."
echo.

REM Trigger the workflow using GitHub CLI
REM The workflow accepts an input: push_to_registry (boolean, default: true)
gh workflow run "Build and Push Docker Image" --repo %REPO% -f push_to_registry=true

if %ERRORLEVEL% equ 0 (
    echo.
    call :print_success "Workflow disparado com sucesso!"
    echo.
    call :print_info "Para acompanhar o progresso:"
    call :print_info "  https://github.com/%REPO%/actions"
    echo.
    call :print_info "Ou execute: gh run watch"
) else (
    echo.
    call :print_error "Falha ao disparar o workflow"
    call :print_info "Verifique se:"
    call :print_info "  - O workflow existe no repositorio"
    call :print_info "  - Voce tem permissao para disparar workflows"
    call :print_info "  - O nome do workflow esta correto"
    exit /b 1
)

endlocal
exit /b 0

