@echo off
REM ============================================
REM SSH Utilities Module
REM Funções para gerenciamento de conexões SSH
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" goto %~1

REM Load common functions
set "UTILS_DIR=%~dp0..\..\utils\"
set "COMMON_UTILS=%UTILS_DIR%common.bat"

REM Exit if called directly (not to call a function)
exit /b 0

REM ============================================
REM Function: Verify SSH is installed
REM Returns: ERRORLEVEL 0 if installed, 1 if not
REM ============================================
:verify_ssh_installed
setlocal
call "%COMMON_UTILS%" :print_info "Verificando se SSH está instalado..."
where ssh >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call "%COMMON_UTILS%" :print_error "SSH não está instalado ou não está no PATH"
    call "%COMMON_UTILS%" :print_info "Instale o OpenSSH ou adicione ao PATH"
    endlocal
    exit /b 1
)
call "%COMMON_UTILS%" :print_success "SSH encontrado"
endlocal
exit /b 0

REM ============================================
REM Function: Test SSH alias
REM Usage: call :test_ssh_alias "alias_name"
REM Returns: ERRORLEVEL 0 if alias works, 1 if not
REM Sets: SSH_ALIAS variable
REM ============================================
:test_ssh_alias
setlocal enabledelayedexpansion
set "ALIAS_NAME=%~1"
if "%ALIAS_NAME%"=="" set "ALIAS_NAME=dev"

call "%COMMON_UTILS%" :print_info "Testando alias SSH '%ALIAS_NAME%'..."
ssh -o ConnectTimeout=5 -o BatchMode=yes %ALIAS_NAME% "echo 'SSH connection test'" >nul 2>&1
set "TEST_RESULT=%ERRORLEVEL%"

if %TEST_RESULT% equ 0 (
    call "%COMMON_UTILS%" :print_success "Alias '%ALIAS_NAME%' funciona corretamente"
    endlocal & set "SSH_ALIAS=%ALIAS_NAME%"
    exit /b 0
) else (
    call "%COMMON_UTILS%" :print_warning "Alias '%ALIAS_NAME%' não funciona ou não existe"
    endlocal
    exit /b 1
)

REM ============================================
REM Function: Check SSH connection
REM Sets: SSH_ALIAS variable
REM Returns: ERRORLEVEL 0 if connection OK, 1 if failed
REM ============================================
:check_ssh_connection
setlocal enabledelayedexpansion

REM Create temp file to store SSH_ALIAS
set "TEMP_SSH_FILE=%TEMP%\ssh_alias_%RANDOM%.tmp"

REM Try default alias 'dev'
call :test_ssh_alias "dev"
if %ERRORLEVEL% equ 0 (
    echo dev > "%TEMP_SSH_FILE%"
    REM Read back and set globally (must be done before endlocal)
    set "SSH_ALIAS_VALUE="
    if exist "%TEMP_SSH_FILE%" (
        for /f "usebackq tokens=*" %%a in ("%TEMP_SSH_FILE%") do set "SSH_ALIAS_VALUE=%%a"
        del "%TEMP_SSH_FILE%" >nul 2>&1
    )
    if "!SSH_ALIAS_VALUE!"=="" set "SSH_ALIAS_VALUE=dev"
    endlocal & set "SSH_ALIAS=!SSH_ALIAS_VALUE!"
    exit /b 0
)

REM Check if SSH config exists
set "SSH_CONFIG=%USERPROFILE%\.ssh\config"
if exist "%SSH_CONFIG%" (
    call "%COMMON_UTILS%" :print_info "Verificando arquivo SSH config: %SSH_CONFIG%"
    findstr /i /c:"Host dev" "%SSH_CONFIG%" >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        call "%COMMON_UTILS%" :print_info "Alias 'dev' encontrado no SSH config, mas conexão falhou"
        call "%COMMON_UTILS%" :print_info "Verifique se a chave SSH está configurada corretamente"
    ) else (
        call "%COMMON_UTILS%" :print_warning "Alias 'dev' não encontrado no SSH config"
    )
) else (
    call "%COMMON_UTILS%" :print_warning "Arquivo SSH config não encontrado: %SSH_CONFIG%"
)

REM Ask user for alternative
call "%COMMON_UTILS%" :print_info "Alias 'dev' não está disponível"
echo.
call "%COMMON_UTILS%" :print_info "Opções:"
call "%COMMON_UTILS%" :print_info "  1. Configurar alias 'dev' no SSH config"
call "%COMMON_UTILS%" :print_info "  2. Usar conexão direta (user@host)"
echo.
set /p "SSH_CHOICE=Escolha uma opção (1 ou 2) ou pressione Enter para usar 'dev': "

if "%SSH_CHOICE%"=="1" (
    call "%COMMON_UTILS%" :print_info "Para configurar o alias, adicione ao arquivo %SSH_CONFIG%:"
    echo.
    echo Host dev
    echo     HostName atlantis-dev
    echo     User bids
    echo     IdentityFile ~/.ssh/id_rsa
    echo.
    call "%COMMON_UTILS%" :print_info "Após configurar, execute o script novamente"
    endlocal
    exit /b 1
) else if "%SSH_CHOICE%"=="2" (
    set /p "SSH_CONNECTION=Digite a conexão SSH (ex: bids@atlantis-dev): "
    if not "!SSH_CONNECTION!"=="" (
        call "%COMMON_UTILS%" :print_info "Testando conexão: !SSH_CONNECTION!"
        ssh -o ConnectTimeout=5 -o BatchMode=yes !SSH_CONNECTION! "echo 'SSH connection test'" >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            call "%COMMON_UTILS%" :print_success "Conexão SSH funcionando"
            echo !SSH_CONNECTION! > "%TEMP_SSH_FILE%"
            REM Read back and set globally (must be done before endlocal)
            set "SSH_ALIAS_VALUE="
            if exist "%TEMP_SSH_FILE%" (
                for /f "usebackq tokens=*" %%a in ("%TEMP_SSH_FILE%") do set "SSH_ALIAS_VALUE=%%a"
                del "%TEMP_SSH_FILE%" >nul 2>&1
            )
            if "!SSH_ALIAS_VALUE!"=="" set "SSH_ALIAS_VALUE=!SSH_CONNECTION!"
            endlocal & set "SSH_ALIAS=!SSH_ALIAS_VALUE!"
            exit /b 0
        ) else (
            call "%COMMON_UTILS%" :print_error "Conexão SSH falhou"
            endlocal
            exit /b 1
        )
    )
)

REM Default: try 'dev' one more time or fail
call "%COMMON_UTILS%" :print_error "Não foi possível estabelecer conexão SSH"
endlocal
exit /b 1

REM ============================================
REM Function: Execute SSH command
REM Usage: call :execute_ssh_command "command" "error_message"
REM Returns: ERRORLEVEL from SSH command
REM ============================================
:execute_ssh_command
setlocal enabledelayedexpansion
REM Skip function name if it's the first argument
REM When called from another bat file: %~1 = function name, %~2 = command, %~3 = error message
set "SSH_CMD=%~1"
set "ERROR_MSG=%~2"

REM If first arg is function name, shift arguments
if "!SSH_CMD!"==":execute_ssh_command" (
    set "SSH_CMD=%~2"
    set "ERROR_MSG=%~3"
)

REM Fallback if SSH_CMD is still empty
if "!SSH_CMD!"=="" (
    if not "%~2"=="" set "SSH_CMD=%~2"
    if "!SSH_CMD!"=="" if not "%~3"=="" set "SSH_CMD=%~3"
)

if "%SSH_ALIAS%"=="" (
    call "%COMMON_UTILS%" :print_error "SSH_ALIAS não está definido"
    endlocal
    exit /b 1
)

REM Execute command via SSH
REM Log the command being executed (without sensitive data)
call "%COMMON_UTILS%" :print_info "Executando via SSH: %SSH_ALIAS%"
ssh %SSH_ALIAS% "%SSH_CMD%"
set "CMD_RESULT=%ERRORLEVEL%"
call "%COMMON_UTILS%" :print_info "Comando SSH executado, resultado: %CMD_RESULT%"

if %CMD_RESULT% neq 0 (
    if not "!ERROR_MSG!"=="" (
        call "%COMMON_UTILS%" :print_error "!ERROR_MSG!"
    )
    call "%COMMON_UTILS%" :print_info "Erro SSH detalhado - codigo: %CMD_RESULT%"
    endlocal
    exit /b %CMD_RESULT%
)

endlocal
exit /b 0

