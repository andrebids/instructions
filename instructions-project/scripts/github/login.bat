@echo off
REM ============================================
REM GitHub Container Registry authentication
REM ============================================

setlocal enabledelayedexpansion

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
REM Function: Login to GitHub Container Registry
REM Requires: GITHUB_USERNAME and GITHUB_TOKEN in environment
REM Returns: ERRORLEVEL 0 if success, 1 if failure
REM ============================================
:github_login
setlocal
set "USERNAME=%~1"
set "TOKEN=%~2"

if "%USERNAME%"=="" (
    call :print_error "GITHUB_USERNAME não fornecido"
    endlocal
    exit /b 1
)

if "%TOKEN%"=="" (
    call :print_error "GITHUB_TOKEN não fornecido"
    endlocal
    exit /b 1
)

call :print_info "Fazendo login no GitHub Container Registry..."
call :print_info "Usuário: %USERNAME%"

REM Login to ghcr.io
echo %TOKEN% | docker login ghcr.io -u %USERNAME% --password-stdin >nul 2>&1
set "LOGIN_RESULT=%ERRORLEVEL%"

if %LOGIN_RESULT% neq 0 (
    call :print_error "Falha ao fazer login no GitHub Container Registry"
    call :print_info "Verifique se:"
    call :print_info "  - GITHUB_USERNAME está correto"
    call :print_info "  - GITHUB_TOKEN é válido e tem permissão 'write:packages'"
    call :print_info "  - Você tem acesso à internet"
    endlocal
    exit /b 1
)

call :print_success "Login realizado com sucesso"
endlocal
exit /b 0

REM ============================================
REM Function: Load GitHub credentials from .env
REM Sets: GITHUB_USERNAME, GITHUB_TOKEN, GITHUB_REPO
REM Returns: ERRORLEVEL 0 if success, 1 if failure
REM ============================================
:load_github_credentials
REM Get project root (go up from scripts/github/ to project root)
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"
set "ENV_FILE=%PROJECT_ROOT%\.env"

if not exist "%ENV_FILE%" (
    call :print_error "Arquivo .env não encontrado em: %PROJECT_ROOT%"
    call :print_info "Crie um arquivo .env com as seguintes variáveis:"
    call :print_info "  GITHUB_USERNAME=seu_usuario"
    call :print_info "  GITHUB_TOKEN=seu_personal_access_token"
    call :print_info "  GITHUB_REPO=username/repo-name"
    exit /b 1
)

REM Load .env file variables directly - read only the GitHub variables we need
REM Process line by line, setting variables directly (no setlocal, so they persist)
call :print_info "Lendo arquivo .env: %ENV_FILE%"
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    REM Skip empty variable names
    if not "%%a"=="" (
        REM Check if it starts with # (comment)
        echo %%a| findstr /b /c:"#" >nul 2>&1
        if errorlevel 1 (
            REM Not a comment, check if it's one of our variables (case insensitive)
            REM Remove leading spaces from variable name for comparison
            for /f "tokens=*" %%n in ("%%a") do (
                if /i "%%n"=="GITHUB_USERNAME" (
                    REM Remove leading spaces from value
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_USERNAME=%%v"
                )
                if /i "%%n"=="GITHUB_TOKEN" (
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_TOKEN=%%v"
                )
                if /i "%%n"=="GITHUB_REPO" (
                    for /f "tokens=*" %%v in ("%%b") do set "GITHUB_REPO=%%v"
                )
            )
        )
    )
)

REM Check if required variables are set
if "%GITHUB_USERNAME%"=="" (
    call :print_error "GITHUB_USERNAME não encontrado no arquivo .env"
    call :print_info "Arquivo .env localizado em: %ENV_FILE%"
    exit /b 1
)

if "%GITHUB_TOKEN%"=="" (
    call :print_error "GITHUB_TOKEN não encontrado no arquivo .env"
    call :print_info "Crie um Personal Access Token em: https://github.com/settings/tokens"
    call :print_info "Permissões necessárias: write:packages"
    exit /b 1
)

if "%GITHUB_REPO%"=="" (
    call :print_error "GITHUB_REPO não encontrado no arquivo .env"
    call :print_info "Formato esperado: username/repo-name"
    exit /b 1
)

call :print_success "Credenciais GitHub carregadas do .env"
call :print_info "Valores carregados:"
call :print_info "  GITHUB_USERNAME=!GITHUB_USERNAME!"
call :print_info "  GITHUB_REPO=!GITHUB_REPO!"
call :print_info "  GITHUB_TOKEN (primeiros 5): !GITHUB_TOKEN:~0,5!..."

REM Export variables to parent scope using temporary file
REM Write to temp file in project root (known location) - this persists through endlocal
set "TEMP_FILE=!PROJECT_ROOT!\.github_creds_temp.tmp"
call :print_info "Escrevendo arquivo temporario: !TEMP_FILE!"
(
    echo GITHUB_USERNAME=!GITHUB_USERNAME!
    echo GITHUB_TOKEN=!GITHUB_TOKEN!
    echo GITHUB_REPO=!GITHUB_REPO!
) > "!TEMP_FILE!"

REM Verify file was created
if exist "!TEMP_FILE!" (
    call :print_info "Arquivo temporario criado com sucesso"
) else (
    call :print_error "Falha ao criar arquivo temporario"
    endlocal
    exit /b 1
)

REM Exit the setlocal from top of script - this closes the setlocal from line 6
REM The temp file will be read by the calling script
endlocal

exit /b 0

REM ============================================
REM Function: Validate GitHub credentials format
REM ============================================
:validate_github_repo_format
setlocal
set "REPO=%~1"

REM Check if repo format is username/repo-name
echo %REPO% | findstr /r "^[^/]*/[^/]*$" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :print_error "Formato de GITHUB_REPO inválido: %REPO%"
    call :print_info "Formato esperado: username/repo-name"
    call :print_info "Exemplo: andrebids/instructions-project"
    endlocal
    exit /b 1
)

call :print_success "Formato do repositório válido"
endlocal
exit /b 0

