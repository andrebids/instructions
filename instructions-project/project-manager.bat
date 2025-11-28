@echo off
setlocal enabledelayedexpansion
title Project Manager - TheCore
color 0A

rem Prevenir fechamento inesperado - adicionar tratamento de erro
if not defined LOG_FILE (
    set "LOG_FILE=%~dp0project-manager.log"
)

rem Definir arquivo de log
set "LOG_FILE=%~dp0project-manager.log"

:menu
cls
echo ========================================
echo    PROJECT MANAGER - THECORE
echo ========================================
echo.
echo 1. INICIAR PROJETO
echo 2. INSTALAR DEPENDENCIAS
echo 3. FAZER BUILD E ENVIAR PARA SERVIDOR
echo 4. SAIR
echo.
echo ========================================
set /p choice="Escolha uma opção (1-4): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto install_deps
if "%choice%"=="3" goto deploy_build
if "%choice%"=="4" goto exit
goto menu

:start
call "%~dp0functions\start-project.bat"
if errorlevel 1 (
    echo.
    echo ERRO: Erro ao iniciar projeto
    pause
)
goto menu

:install_deps
call "%~dp0functions\install-dependencies.bat"
if errorlevel 1 (
    echo.
    echo ERRO: Erro ao instalar dependencias
    pause
)
goto menu

:deploy_build
call "%~dp0functions\deploy-build.bat"
if errorlevel 1 (
    echo.
    echo ERRO: Erro no deploy
    pause
)
goto menu

:exit
cls
echo ========================================
echo    OBRIGADO POR USAR PROJECT MANAGER!
echo ========================================
echo.
echo Projeto TheCore - Gerido com sucesso
echo.
timeout /t 2 /nobreak >nul
exit