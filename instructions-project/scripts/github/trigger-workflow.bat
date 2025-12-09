@echo off
REM ============================================
REM Trigger GitHub Actions Workflow
REM Dispara o workflow "Build and Push Docker Image" no GitHub
REM ============================================

setlocal enabledelayedexpansion

REM Load common functions
set "UTILS_DIR=%~dp0..\utils\"

REM Get project root first
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
cd /d "%PROJECT_ROOT%"

REM Find Git repository root using git command (more reliable)
for /f "tokens=*" %%g in ('git rev-parse --show-toplevel 2^>nul') do set "GIT_ROOT=%%g"
if "%GIT_ROOT%"=="" (
    REM Fallback: try going up from PROJECT_ROOT
    cd /d "%PROJECT_ROOT%"
    if exist "%PROJECT_ROOT%\.git" (
        set "GIT_ROOT=%PROJECT_ROOT%"
    ) else (
        cd /d ".."
        if exist "%CD%\.git" (
            set "GIT_ROOT=%CD%"
        ) else (
            set "GIT_ROOT=%PROJECT_ROOT%"
        )
    )
)
cd /d "%GIT_ROOT%"

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
for /f "tokens=*" %%r in ('git remote get-url origin 2^>nul') do set "REMOTE_URL=%%r"
if "%REMOTE_URL%"=="" (
    call :print_error "Nao foi possivel determinar o repositorio"
    call :print_info "Certifique-se de estar em um repositorio Git valido"
    exit /b 1
)

REM Extract repo name from URL (handles both https:// and git@ formats)
REM For https://github.com/user/repo.git or https://github.com/user/repo
REM For git@github.com:user/repo.git
set "REPO=%REMOTE_URL%"
set "REPO=%REPO:https://github.com/=%"
set "REPO=%REPO:git@github.com:=%"
set "REPO=%REPO:.git=%"
set "REPO=%REPO: =%"

REM Remove trailing slash if present
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
if "%REPO:~-1%"=="/" set "REPO=%REPO:~0,-1%"

call :print_info "Repositorio: %REPO%"
call :print_info "Diretorio Git: %GIT_ROOT%"
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
gh workflow list --repo %REPO% 2>&1
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
echo.

REM Get current branch
for /f "tokens=*" %%b in ('git branch --show-current 2^>nul') do set "CURRENT_BRANCH=%%b"
if "%CURRENT_BRANCH%"=="" (
    call :print_warning "Nao foi possivel detectar o branch atual, usando 'main'"
    set "CURRENT_BRANCH=main"
)
call :print_info "Branch atual: %CURRENT_BRANCH%"

REM Try to get workflow ID by name first
call :print_info "Procurando workflow 'Build and Push Docker Image'..."
for /f "tokens=*" %%w in ('gh workflow list --repo %REPO% --json name,id --jq ".[] | select(.name==\"Build and Push Docker Image\") | .id" 2^>nul') do set "WORKFLOW_ID=%%w"

if "%WORKFLOW_ID%"=="" (
    REM Try to get workflow ID by filename
    call :print_info "Tentando encontrar workflow pelo nome do arquivo..."
    for /f "tokens=*" %%w in ('gh workflow list --repo %REPO% --json name,id,path --jq ".[] | select(.path==\".github/workflows/docker-build.yml\") | .id" 2^>nul') do set "WORKFLOW_ID=%%w"
    
    if "%WORKFLOW_ID%"=="" (
        REM Try using the filename directly
        call :print_info "Tentando usar o nome do arquivo diretamente..."
        gh workflow run docker-build.yml --repo %REPO% --ref %CURRENT_BRANCH% -f push_to_registry=true 2>&1
        set "WORKFLOW_RESULT=%ERRORLEVEL%"
        if %WORKFLOW_RESULT% neq 0 (
            call :print_error "Falha ao disparar workflow com nome do arquivo"
            call :print_info "Codigo de erro: %WORKFLOW_RESULT%"
        )
    ) else (
        call :print_info "Workflow encontrado pelo caminho (ID: %WORKFLOW_ID%)"
        call :print_info "Disparando workflow via API..."
        call :print_info "Comando: gh api repos/%REPO%/actions/workflows/%WORKFLOW_ID%/dispatches -X POST -f ref=%CURRENT_BRANCH% -f inputs[push_to_registry]=true"
        gh api repos/%REPO%/actions/workflows/%WORKFLOW_ID%/dispatches -X POST -f ref=%CURRENT_BRANCH% -f inputs[push_to_registry]=true 2>&1
        set "WORKFLOW_RESULT=%ERRORLEVEL%"
        if %WORKFLOW_RESULT% neq 0 (
            call :print_error "Falha ao disparar workflow via API"
            call :print_info "Codigo de erro: %WORKFLOW_RESULT%"
        )
    )
) else (
    REM Use workflow ID with API (more reliable)
    call :print_info "Workflow encontrado pelo nome (ID: %WORKFLOW_ID%)"
    call :print_info "Disparando workflow via API..."
    call :print_info "Comando: gh api repos/%REPO%/actions/workflows/%WORKFLOW_ID%/dispatches -X POST -f ref=%CURRENT_BRANCH% -f inputs[push_to_registry]=true"
    gh api repos/%REPO%/actions/workflows/%WORKFLOW_ID%/dispatches -X POST -f ref=%CURRENT_BRANCH% -f inputs[push_to_registry]=true 2>&1
    set "WORKFLOW_RESULT=%ERRORLEVEL%"
    if %WORKFLOW_RESULT% neq 0 (
        call :print_error "Falha ao disparar workflow via API"
        call :print_info "Codigo de erro: %WORKFLOW_RESULT%"
    )
)

REM Ensure WORKFLOW_RESULT is set
if not defined WORKFLOW_RESULT (
    set "WORKFLOW_RESULT=1"
    call :print_error "Erro: WORKFLOW_RESULT nao foi definido"
)

if %WORKFLOW_RESULT% equ 0 (
    echo.
    call :print_success "Workflow disparado com sucesso!"
    echo.
    call :print_info "Para acompanhar o progresso:"
    call :print_info "  https://github.com/%REPO%/actions"
    echo.
    call :print_info "Ou execute: gh run watch --repo %REPO%"
    echo.
    call :print_info "Listando ultimas execucoes do workflow..."
    gh run list --repo %REPO% --workflow="Build and Push Docker Image" --limit 3
) else (
    echo.
    call :print_error "Falha ao disparar o workflow (codigo de erro: %WORKFLOW_RESULT%)"
    echo.
    call :print_info "Verifique se:"
    call :print_info "  - O workflow existe na raiz do repositorio (.github/workflows/)"
    call :print_info "  - Voce tem permissao para disparar workflows"
    call :print_info "  - O nome do workflow esta correto"
    call :print_info "  - O branch '%CURRENT_BRANCH%' existe no repositorio"
    call :print_warning "NOTA: Workflows em subdiretorios nao sao reconhecidos pelo GitHub Actions"
    echo.
    call :print_info "Tentando listar workflows disponiveis para debug..."
    gh workflow list --repo %REPO%
    exit /b 1
)

endlocal
exit /b 0

