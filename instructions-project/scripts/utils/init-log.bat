@echo off
REM ============================================
REM Initialize log file
REM Creates logs directory and log file if they don't exist
REM Sets: LOG_FILE variable
REM ============================================

setlocal enabledelayedexpansion

REM Get scripts directory (go up from scripts/utils/ to scripts/)
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=!CURRENT_DIR:~0,-1!"
for %%i in ("!CURRENT_DIR!\..") do set "SCRIPTS_DIR=%%~fi"

REM Set logs directory
set "LOG_DIR=!SCRIPTS_DIR!\logs"

REM Create logs directory if it doesn't exist
if not exist "!LOG_DIR!" (
    echo [INFO] Criando pasta de logs: !LOG_DIR!
    mkdir "!LOG_DIR!" 2>nul
    if !ERRORLEVEL! neq 0 (
        echo [ERRO] Falha ao criar pasta de logs: !LOG_DIR!
        endlocal
        exit /b 1
    )
    echo [OK] Pasta de logs criada com sucesso
)

REM Generate timestamp for log file using wmic (more reliable)
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "DT=%%a"
set "YYYY=!DT:~0,4!"
set "MM=!DT:~4,2!"
set "DD=!DT:~6,2!"
set "HH=!DT:~8,2!"
set "MIN=!DT:~10,2!"
set "DATE=!YYYY!-!MM!-!DD!"
set "TIME=!HH!-!MIN!"
set "LOG_FILE=!LOG_DIR!\build-!DATE!-!TIME!.log"

REM Fallback if wmic doesn't work
if "!YYYY!"=="" (
    REM Use date command as fallback
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
        set "MM=%%a"
        set "DD=%%b"
        set "YYYY=%%c"
    )
    if "!MM!" LSS "10" set "MM=0!MM!"
    if "!DD!" LSS "10" set "DD=0!DD!"
    set "DATE=!YYYY!-!MM!-!DD!"
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
        set "HH=%%a"
        set "MIN=%%b"
    )
    set "HH=!HH: =0!"
    set "MIN=!MIN: =0!"
    set "TIME=!HH!-!MIN!"
    set "LOG_FILE=!LOG_DIR!\build-!DATE!-!TIME!.log"
)

REM Check if log file already exists (in case script runs multiple times quickly)
if exist "!LOG_FILE!" (
    REM File exists, append to it
    echo [INFO] Arquivo de log ja existe, continuando: !LOG_FILE!
) else (
    REM Create new log file with header
    (
        echo ========================================
        echo Log iniciado em: !DATE! !TIME!
        echo Build e Push para GitHub Packages
        echo ========================================
        echo.
    ) > "!LOG_FILE!" 2>&1
    
    if exist "!LOG_FILE!" (
        echo [OK] Arquivo de log criado: !LOG_FILE!
    ) else (
        echo [ERRO] Falha ao criar arquivo de log: !LOG_FILE!
        endlocal
        exit /b 1
    )
)

REM Export LOG_FILE to parent scope (must capture before endlocal)
set "EXPORT_LOG_FILE=!LOG_FILE!"
set "EXPORT_LOG_DIR=!LOG_DIR!"
endlocal & set "LOG_FILE=%EXPORT_LOG_FILE%" & set "LOG_DIR=%EXPORT_LOG_DIR%"
exit /b 0

