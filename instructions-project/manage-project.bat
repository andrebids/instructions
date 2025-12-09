@echo off
REM ============================================
REM Script Principal - Gerenciamento do Projeto
REM Menu interativo para operações Docker e GitHub
REM ============================================

setlocal enabledelayedexpansion

REM Get script directory and project root
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%"
cd /d "%PROJECT_ROOT%"

REM ============================================
REM Include common functions
REM ============================================
set "UTILS_DIR=%SCRIPT_DIR%scripts\utils\"

REM Define color variables (empty - no ANSI codes for compatibility)
set "COLOR_RESET="
set "COLOR_RED="
set "COLOR_GREEN="
set "COLOR_YELLOW="
set "COLOR_BLUE="
set "COLOR_MAGENTA="
set "COLOR_CYAN="
set "COLOR_WHITE="
set "COLOR_BOLD="

REM Jump to main menu (skip function definitions)
goto :main_menu

REM Define common functions inline
:print_color
setlocal
set "MSG=%~1"
REM Just print the message without color codes
echo %MSG%
endlocal
goto :eof

:print_success
call :print_color "[OK] %~1"
goto :eof

:print_error
call :print_color "[ERRO] %~1"
goto :eof

:print_warning
call :print_color "[AVISO] %~1"
goto :eof

:print_info
call :print_color "[INFO] %~1"
goto :eof

:print_header
setlocal
set "TITLE=%~1"
echo.
call :print_color "======================================="
call :print_color "%TITLE%"
call :print_color "======================================="
echo.
endlocal
goto :eof

:print_separator
echo.
call :print_color "---------------------------------------"
echo.
goto :eof

REM ============================================
REM Main Menu
REM ============================================
REM Start the script by going to main menu
goto :main_menu

:main_menu
cls
call :print_header "Gerenciamento do Projeto Instructions"

echo.
call :print_color "Escolha uma opcao:"
echo.
call :print_color "  [1]  Build DEV (Dockerfile.dev) - Ambiente de Desenvolvimento Local"
call :print_color "  [2]  Build PROD no GitHub (via Actions) + Push para GitHub Packages"
call :print_color "  [3]  Deploy Docker no Servidor (Producao)"
call :print_color "  [4]  Sair"
echo.
call :print_color "Opcao: "
set /p "MENU_CHOICE="

if "%MENU_CHOICE%"=="1" goto rebuild_dev
if "%MENU_CHOICE%"=="2" goto trigger_workflow
if "%MENU_CHOICE%"=="3" goto deploy_docker_server
if "%MENU_CHOICE%"=="4" goto exit_script
if "%MENU_CHOICE%"=="" goto :main_menu

call :print_error "Opcao invalida. Tente novamente."
timeout /t 2 >nul
goto :main_menu

REM ============================================
REM Option 1: Rebuild Dev Environment
REM ============================================
:rebuild_dev
call :print_separator
call :print_info "Iniciando rebuild do ambiente de DESENVOLVIMENTO..."
call :print_info "Usando: Dockerfile.dev (ambiente local com hot reload)"
echo.

call "%SCRIPT_DIR%scripts\docker\rebuild-dev.bat"
set "REBUILD_RESULT=%ERRORLEVEL%"

echo.
if %REBUILD_RESULT% equ 0 (
    call :print_success "Operacao concluida com sucesso!"
) else (
    call :print_error "Operacao falhou com codigo de erro: %REBUILD_RESULT%"
)

echo.
call :print_info "Pressione qualquer tecla para voltar ao menu..."
pause >nul
goto :main_menu

REM ============================================
REM Option 2: Trigger GitHub Actions Workflow
REM ============================================
:trigger_workflow
call :print_separator
call :print_info "Disparando GitHub Actions Workflow (Build de PRODUCAO no GitHub)..."
call :print_info "O build sera executado nos runners do GitHub (nao usa recursos locais)"
echo.

REM Execute script and ensure output is visible
REM Note: Using call to preserve ERRORLEVEL
call "%SCRIPT_DIR%scripts\github\trigger-workflow.bat"
set "WORKFLOW_RESULT=%ERRORLEVEL%"

echo.

if %WORKFLOW_RESULT% equ 0 (
    call :print_success "Workflow disparado com sucesso!"
) else (
    call :print_error "Falha ao disparar workflow com codigo de erro: %WORKFLOW_RESULT%"
)

echo.
call :print_info "Pressione qualquer tecla para voltar ao menu..."
pause >nul
goto :main_menu

REM ============================================
REM Option 3: Deploy Docker to Remote Server
REM ============================================
:deploy_docker_server
call :print_separator
call :print_info "Iniciando deploy Docker no servidor remoto..."
echo.

REM Verify script exists before calling
if not exist "%SCRIPT_DIR%scripts\deploy\deploy-docker-server.bat" (
    call :print_error "Script de deploy nao encontrado: %SCRIPT_DIR%scripts\deploy\deploy-docker-server.bat"
    echo.
    call :print_info "Pressione qualquer tecla para voltar ao menu..."
    pause >nul
    goto :main_menu
)

call "%SCRIPT_DIR%scripts\deploy\deploy-docker-server.bat" --from-menu
set "DEPLOY_RESULT=%ERRORLEVEL%"

echo.
if %DEPLOY_RESULT% equ 0 (
    call :print_success "Deploy concluido com sucesso!"
) else (
    call :print_error "Deploy falhou com codigo de erro: %DEPLOY_RESULT%"
)

echo.
call :print_info "Pressione qualquer tecla para voltar ao menu..."
pause >nul
goto :main_menu

REM ============================================
REM Exit Script
REM ============================================
:exit_script
call :print_separator
call :print_info "A sair..."
echo.
call :print_success "Ate logo!"
timeout /t 1 >nul
exit /b 0
