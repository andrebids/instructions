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

REM Check if workflows exist
call :print_info "Verificando workflows disponiveis..."
gh workflow list --repo %REPO% >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    call :print_error "Nenhum workflow encontrado no repositorio"
    call :print_warning "IMPORTANTE: GitHub Actions so reconhece workflows na raiz do repositorio"
    call :print_info "O workflow precisa estar em: .github/workflows/docker-build.yml"
    call :print_info "Mas parece estar em: instructions-project/.github/workflows/docker-build.yml"
    echo.
    call :print_info "Solucao: Mova o workflow para a raiz do repositorio ou crie um link simbolico"
    call :print_info "Ou use a opcao [2] para build local"
    exit /b 1
)

REM Try to get workflow ID by name first
call :print_info "Procurando workflow 'Build and Push Docker Image'..."
for /f "tokens=*" %%w in ('gh workflow list --repo %REPO% --json name,id --jq ".[] | select(.name==\"Build and Push Docker Image\") | .id" 2^>nul') do set "WORKFLOW_ID=%%w"

if "%WORKFLOW_ID%"=="" (
    REM Try using the filename instead
    call :print_info "Tentando usar o nome do arquivo..."
    gh workflow run docker-build.yml --repo %REPO% -f push_to_registry=true
    set "WORKFLOW_RESULT=%ERRORLEVEL%"
) else (
    REM Use workflow ID
    call :print_info "Workflow encontrado (ID: %WORKFLOW_ID%)"
    gh api repos/%REPO%/actions/workflows/%WORKFLOW_ID%/dispatches -X POST -f ref=main -f inputs[push_to_registry]=true
    set "WORKFLOW_RESULT=%ERRORLEVEL%"
)

if %WORKFLOW_RESULT% equ 0 (
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
    call :print_info "  - O workflow existe na raiz do repositorio (.github/workflows/)"
    call :print_info "  - Voce tem permissao para disparar workflows"
    call :print_info "  - O nome do workflow esta correto"
    call :print_warning "NOTA: Workflows em subdiretorios nao sao reconhecidos pelo GitHub Actions"
    exit /b 1
)

endlocal
exit /b 0

