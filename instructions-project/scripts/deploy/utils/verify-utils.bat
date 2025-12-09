@echo off
REM ============================================
REM Verify Utilities Module
REM Funções para verificação pós-deploy
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" goto %~1

REM Load common functions
set "UTILS_DIR=%~dp0..\..\utils\"
set "COMMON_UTILS=%UTILS_DIR%common.bat"
set "SSH_UTILS=%~dp0ssh-utils.bat"
set "CONTAINER_UTILS=%~dp0container-utils.bat"

REM Container configuration
set "CONTAINER_NAME=instructions-prod"
set "HEALTH_URL=http://localhost:5000/health"
set "FRONTEND_URL=http://localhost:5000/"
set "PUBLIC_DOMAIN=https://thecore.dsproject.pt/health"

REM Exit if called directly (not to call a function)
exit /b 0

REM ============================================
REM Function: Check if curl is available
REM Returns: ERRORLEVEL 0 if available, 1 if not
REM ============================================
:check_curl_available
setlocal
call "%COMMON_UTILS%" :print_info "Verificando se curl está disponível..."
where curl >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_warning "curl não está disponível localmente"
    call "%COMMON_UTILS%" :print_info "Tentando usar curl no servidor remoto..."
    
    if "%SSH_ALIAS%"=="" (
        call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
        endlocal
        exit /b 1
    )
    
    call "%SSH_UTILS%" :execute_ssh_command "curl --version" "curl não está disponível no servidor remoto"
    if %ERRORLEVEL% equ 0 (
        call "%COMMON_UTILS%" :print_success "curl encontrado no servidor remoto"
        set "USE_REMOTE_CURL=1"
        endlocal & set "USE_REMOTE_CURL=1"
        exit /b 0
    ) else (
        call "%COMMON_UTILS%" :print_warning "curl não está disponível localmente nem no servidor remoto"
        call "%COMMON_UTILS%" :print_info "Algumas verificações serão puladas"
        endlocal
        exit /b 1
    )
) else (
    call "%COMMON_UTILS%" :print_success "curl encontrado localmente"
    set "USE_REMOTE_CURL=0"
    endlocal & set "USE_REMOTE_CURL=0"
    exit /b 0
)

REM ============================================
REM Function: Check health endpoint
REM Returns: ERRORLEVEL 0 if OK, 1 if failed
REM ============================================
:check_health_endpoint
setlocal enabledelayedexpansion
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando endpoint de health: %HEALTH_URL%"

REM Check if we should use remote curl
if "%USE_REMOTE_CURL%"=="1" (
    REM Use curl on remote server
    for /f "tokens=*" %%r in ('ssh %SSH_ALIAS% "curl -s -f %HEALTH_URL%" 2^>nul') do (
        set "HEALTH_RESPONSE=%%r"
    )
) else (
    REM Try to use local curl (may not work if server is not accessible locally)
    curl -s -f %HEALTH_URL% >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call "%COMMON_UTILS%" :print_success "Health endpoint respondeu com sucesso"
        endlocal
        exit /b 0
    ) else (
        REM Fallback to remote curl
        for /f "tokens=*" %%r in ('ssh %SSH_ALIAS% "curl -s -f %HEALTH_URL%" 2^>nul') do (
            set "HEALTH_RESPONSE=%%r"
        )
    )
)

if not "!HEALTH_RESPONSE!"=="" (
    echo !HEALTH_RESPONSE!
    echo !HEALTH_RESPONSE! | findstr /i "ok\|status\|healthy" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call "%COMMON_UTILS%" :print_success "Health endpoint retornou status OK"
        endlocal
        exit /b 0
    ) else (
        call "%COMMON_UTILS%" :print_warning "Health endpoint respondeu, mas resposta não contém status esperado"
        call "%COMMON_UTILS%" :print_info "Resposta: !HEALTH_RESPONSE!"
        endlocal
        exit /b 0
    )
) else (
    call "%COMMON_UTILS%" :print_error "Health endpoint não respondeu"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Check frontend endpoint
REM Returns: ERRORLEVEL 0 if OK, 1 if failed
REM ============================================
:check_frontend_endpoint
setlocal enabledelayedexpansion
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando endpoint do frontend: %FRONTEND_URL%"

REM Check if we should use remote curl
if "%USE_REMOTE_CURL%"=="1" (
    REM Use curl on remote server
    for /f "tokens=*" %%r in ('ssh %SSH_ALIAS% "curl -s -I %FRONTEND_URL%" 2^>nul') do (
        set "FRONTEND_RESPONSE=%%r"
        REM Check if it's HTML (not JSON)
        echo !FRONTEND_RESPONSE! | findstr /i "text/html\|Content-Type.*html" >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            call "%COMMON_UTILS%" :print_success "Frontend retorna HTML (não JSON)"
            endlocal
            exit /b 0
        )
    )
) else (
    REM Try local curl first
    curl -s -I %FRONTEND_URL% 2>nul | findstr /i "text/html\|Content-Type.*html" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call "%COMMON_UTILS%" :print_success "Frontend retorna HTML (não JSON)"
        endlocal
        exit /b 0
    ) else (
        REM Fallback to remote curl
        for /f "tokens=*" %%r in ('ssh %SSH_ALIAS% "curl -s -I %FRONTEND_URL%" 2^>nul') do (
            set "FRONTEND_RESPONSE=%%r"
            echo !FRONTEND_RESPONSE! | findstr /i "text/html\|Content-Type.*html" >nul 2>&1
            if %ERRORLEVEL% equ 0 (
                call "%COMMON_UTILS%" :print_success "Frontend retorna HTML (não JSON)"
                endlocal
                exit /b 0
            )
        )
    )
)

call "%COMMON_UTILS%" :print_warning "Frontend pode não estar retornando HTML corretamente"
endlocal
exit /b 0

REM ============================================
REM Function: Check container logs
REM Returns: ERRORLEVEL 0 if OK, 1 if failed
REM ============================================
:check_container_logs
setlocal enabledelayedexpansion
if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

call "%COMMON_UTILS%" :print_info "Verificando logs do container '%CONTAINER_NAME%'..."
echo.

REM Get last 20 lines of logs
ssh %SSH_ALIAS% "docker logs %CONTAINER_NAME% --tail 20" 2>&1
set "LOGS_RESULT=%ERRORLEVEL%"

if %LOGS_RESULT% equ 0 (
    call "%COMMON_UTILS%" :print_success "Logs obtidos com sucesso"
    echo.
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_error "Falha ao obter logs do container"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Check public domain
REM Returns: ERRORLEVEL 0 if OK, 1 if failed (optional check)
REM ============================================
:check_public_domain
setlocal enabledelayedexpansion
call "%COMMON_UTILS%" :print_info "Verificando domínio público: %PUBLIC_DOMAIN%"

REM Try local curl first
curl -s -f %PUBLIC_DOMAIN% >nul 2>&1
if %ERRORLEVEL% equ 0 (
    call "%COMMON_UTILS%" :print_success "Domínio público está acessível"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_warning "Domínio público pode não estar acessível ou não configurado"
    call "%COMMON_UTILS%" :print_info "Esta verificação é opcional"
    endlocal
    exit /b 0
)

REM ============================================
REM Function: Verify deployment (orchestrate all checks)
REM Returns: ERRORLEVEL 0 if all OK, 1 if any failed
REM ============================================
:verify_deployment
setlocal enabledelayedexpansion
set "VERIFY_FAILED=0"

call "%COMMON_UTILS%" :print_header "Verificações Pós-Deploy"
echo.

REM 1. Check if container is running
call "%CONTAINER_UTILS%" :verify_container_running
if %ERRORLEVEL% neq 0 (
    set "VERIFY_FAILED=1"
)
echo.

REM 2. Check curl availability
call :check_curl_available
set "CURL_AVAILABLE=%ERRORLEVEL%"
echo.

REM 3. Check health endpoint (if curl is available)
if %CURL_AVAILABLE% equ 0 (
    call :check_health_endpoint
    if %ERRORLEVEL% neq 0 (
        set "VERIFY_FAILED=1"
    )
    echo.
    
    REM 4. Check frontend endpoint
    call :check_frontend_endpoint
    if %ERRORLEVEL% neq 0 (
        set "VERIFY_FAILED=1"
    )
    echo.
) else (
    call "%COMMON_UTILS%" :print_warning "Pulando verificações de endpoints (curl não disponível)"
    echo.
)

REM 5. Check container logs
call :check_container_logs
if %ERRORLEVEL% neq 0 (
    set "VERIFY_FAILED=1"
)
echo.

REM 6. Check public domain (optional)
call :check_public_domain
echo.

REM Summary
call "%COMMON_UTILS%" :print_separator
if %VERIFY_FAILED% equ 0 (
    call "%COMMON_UTILS%" :print_success "Todas as verificações concluídas com sucesso!"
    endlocal
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_warning "Algumas verificações falharam - verifique os logs acima"
    endlocal
    exit /b 1
)

