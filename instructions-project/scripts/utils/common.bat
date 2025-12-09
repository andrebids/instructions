@echo off
REM ============================================
REM Common utility functions for BAT scripts
REM ============================================

REM If called with a function name, jump to it
if not "%~1"=="" goto %~1

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM ============================================
REM Color codes (empty for compatibility - no ANSI)
REM ============================================
set "COLOR_RESET="
set "COLOR_RED="
set "COLOR_GREEN="
set "COLOR_YELLOW="
set "COLOR_BLUE="
set "COLOR_MAGENTA="
set "COLOR_CYAN="
set "COLOR_WHITE="
set "COLOR_BOLD="

REM Exit if called directly (not to call a function)
exit /b 0

REM ============================================
REM Function: Print colored message
REM Usage: call :print_color "message" "color"
REM ============================================
:print_color
setlocal
set "MSG=%~1"
REM Just print the message without color codes
echo %MSG%
endlocal
goto :eof

REM ============================================
REM Function: Print success message
REM Usage: call :print_success "message"
REM ============================================
:print_success
setlocal enabledelayedexpansion
REM Skip function name if it's the first argument
set "MSG=%~1"
if "!MSG!"==":print_success" set "MSG=%~2"
if "!MSG!"=="" set "MSG=%~*"
call :print_color "[OK] !MSG!"
endlocal
goto :eof

REM ============================================
REM Function: Print error message
REM Usage: call :print_error "message"
REM ============================================
:print_error
setlocal enabledelayedexpansion
REM Skip function name if it's the first argument
set "MSG=%~1"
if "!MSG!"==":print_error" set "MSG=%~2"
if "!MSG!"=="" set "MSG=%~*"
call :print_color "[ERRO] !MSG!"
endlocal
goto :eof

REM ============================================
REM Function: Print warning message
REM Usage: call :print_warning "message"
REM ============================================
:print_warning
setlocal enabledelayedexpansion
REM Skip function name if it's the first argument
set "MSG=%~1"
if "!MSG!"==":print_warning" set "MSG=%~2"
if "!MSG!"=="" set "MSG=%~*"
call :print_color "[AVISO] !MSG!"
endlocal
goto :eof

REM ============================================
REM Function: Print info message
REM Usage: call :print_info "message"
REM ============================================
:print_info
setlocal enabledelayedexpansion
REM Skip function name if it's the first argument
set "MSG=%~1"
if "!MSG!"==":print_info" set "MSG=%~2"
if "!MSG!"=="" set "MSG=%~*"
call :print_color "[INFO] !MSG!"
endlocal
goto :eof

REM ============================================
REM Function: Print section header
REM Usage: call :print_header "title"
REM ============================================
:print_header
setlocal
REM Skip function name if it's the first argument
set "TITLE=%~1"
if "!TITLE!"==":print_header" set "TITLE=%~2"
if "!TITLE!"=="" set "TITLE=%~*"
REM Remove quotes if present
set "TITLE=!TITLE:"=!"
echo.
call :print_color "======================================="
call :print_color "!TITLE!"
call :print_color "======================================="
echo.
endlocal
goto :eof

REM ============================================
REM Function: Ask for confirmation (Y/N)
REM Usage: call :confirm "question"
REM Returns: ERRORLEVEL 0 if Yes, 1 if No
REM ============================================
:confirm
setlocal
set "QUESTION=%~1"
:confirm_loop
call :print_color "%QUESTION% (S/N): " "%COLOR_YELLOW%"
set /p "RESPONSE="
if /i "%RESPONSE%"=="S" (
    endlocal
    exit /b 0
)
if /i "%RESPONSE%"=="N" (
    endlocal
    exit /b 1
)
if /i "%RESPONSE%"=="Y" (
    endlocal
    exit /b 0
)
call :print_error "Resposta inválida. Use S ou N."
goto confirm_loop

REM ============================================
REM Function: Check if file exists
REM Usage: call :file_exists "path"
REM Returns: ERRORLEVEL 0 if exists, 1 if not
REM ============================================
:file_exists
if exist "%~1" (
    exit /b 0
) else (
    exit /b 1
)

REM ============================================
REM Function: Check if directory exists
REM Usage: call :dir_exists "path"
REM Returns: ERRORLEVEL 0 if exists, 1 if not
REM ============================================
:dir_exists
if exist "%~1\" (
    exit /b 0
) else (
    exit /b 1
)

REM ============================================
REM Function: Load environment variables from .env file
REM Usage: call :load_env "path_to_env_file"
REM ============================================
:load_env
setlocal enabledelayedexpansion
set "ENV_FILE=%~1"
if not exist "%ENV_FILE%" (
    call :print_warning "Arquivo .env não encontrado: %ENV_FILE%"
    endlocal
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    set "LINE=%%a"
    if not "!LINE:~0,1!"=="#" (
        if not "!LINE!"=="" (
            REM Set variable in current scope (will be available after endlocal with proper handling)
            set "%%a=%%b"
        )
    )
)
REM Note: Variables set here will be lost after endlocal
REM Caller should use a different approach or we need to use a temp file
endlocal
exit /b 0

REM ============================================
REM Function: Get project root directory
REM Usage: call :get_project_root
REM Sets: PROJECT_ROOT variable
REM ============================================
:get_project_root
setlocal
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

REM Go up from scripts/utils/ to project root
for %%i in ("%CURRENT_DIR%\..\..") do set "PROJECT_ROOT=%%~fi"

endlocal & set "PROJECT_ROOT=%PROJECT_ROOT%"
exit /b 0

REM ============================================
REM Function: Execute command and check result
REM Usage: call :execute_command "command" "error_message"
REM Returns: ERRORLEVEL from command
REM ============================================
:execute_command
setlocal
set "CMD=%~1"
set "ERROR_MSG=%~2"

call %CMD%
set "CMD_RESULT=%ERRORLEVEL%"

if %CMD_RESULT% neq 0 (
    if not "%~2"=="" (
        call :print_error "%ERROR_MSG%"
    )
    endlocal
    exit /b %CMD_RESULT%
)

endlocal
exit /b 0

REM ============================================
REM Function: Print separator line
REM Usage: call :print_separator
REM ============================================
:print_separator
echo.
call :print_color "---------------------------------------"
echo.
goto :eof

REM ============================================
REM Function: Initialize log file
REM Usage: call :init_log_file "log_file_path"
REM Sets: LOG_FILE variable
REM ============================================
:init_log_file
setlocal enabledelayedexpansion
set "LOG_FILE=%~1"
if "%LOG_FILE%"=="" (
    REM Get scripts directory (go up from scripts/utils/ to scripts/)
    set "CURRENT_DIR=%~dp0"
    set "CURRENT_DIR=!CURRENT_DIR:~0,-1!"
    for %%i in ("!CURRENT_DIR!\..") do set "SCRIPTS_DIR=%%~fi"
    
    REM Generate default log file name with timestamp
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "DATE=%%c-%%a-%%b"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "TIME=%%a-%%b"
    set "TIME=!TIME: =0!"
    set "TIME=!TIME::=-!"
    set "LOG_FILE=!SCRIPTS_DIR!\logs\build-!DATE!-!TIME!.log"
)

REM Create logs directory if it doesn't exist
for %%i in ("%LOG_FILE%") do set "LOG_DIR=%%~dpi"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Get current date/time for header
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"

REM Initialize log file with header
(
    echo ========================================
    echo Log iniciado em: !LOG_DATE! !LOG_TIME!
    echo ========================================
    echo.
) > "%LOG_FILE%"

endlocal & set "LOG_FILE=%LOG_FILE%"
exit /b 0

REM ============================================
REM Function: Write to log file
REM Usage: call :write_log "message"
REM Requires: LOG_FILE variable to be set
REM ============================================
:write_log
if "%LOG_FILE%"=="" exit /b 0
setlocal enabledelayedexpansion
set "MSG=%~1"
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set "LOG_DATE=%%c-%%a-%%b"
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set "LOG_TIME=%%a-%%b"
echo [!LOG_DATE! !LOG_TIME!] %MSG% >> "%LOG_FILE%"
endlocal
exit /b 0

