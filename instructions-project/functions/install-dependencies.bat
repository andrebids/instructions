@echo off
setlocal enabledelayedexpansion
rem =====================
rem Instalar dependências
rem =====================

rem Garantir que LOG_FILE está definido (portabilidade entre computadores)
if not defined LOG_FILE (
    rem Calcular diretório raiz do projeto (um nível acima de functions)
    pushd "%~dp0.."
    set "LOG_FILE=%CD%\project-manager.log"
    popd
)

cls
echo ========================================
echo    INSTALAR DEPENDÊNCIAS
echo ========================================
echo.
echo Logs sendo salvos em: %LOG_FILE%
echo ======================================== > "%LOG_FILE%"
echo [%DATE% %TIME%] INSTALANDO DEPENDÊNCIAS >> "%LOG_FILE%"
echo ======================================== >> "%LOG_FILE%"
echo.
echo Este processo irá instalar todas as dependências necessárias:
echo - Dependências do servidor (server/)
echo - Dependências do cliente (client/)
echo.
echo Isso pode demorar alguns minutos...
echo.
pause
echo.
echo ========================================
echo    INSTALANDO DEPENDÊNCIAS
echo ========================================
echo.
call "%~dp0dependencies-utils.bat" :check_and_install_dependencies
set "INSTALL_RESULT=%errorlevel%"
echo.
if %INSTALL_RESULT% equ 0 (
    echo ========================================
    echo    OK: DEPENDENCIAS INSTALADAS COM SUCESSO!
    echo ========================================
    echo.
    echo Todas as dependências foram instaladas corretamente.
    echo.
) else (
    echo ========================================
    echo    ERRO: ERRO AO INSTALAR DEPENDENCIAS
    echo ========================================
    echo.
    echo Houve um erro ao instalar as dependências.
    echo Verifique as mensagens acima para mais detalhes.
    echo.
    echo Tente executar manualmente:
    echo    cd server ^&^& npm install
    echo    cd client ^&^& npm install
    echo.
)
pause
exit /b %INSTALL_RESULT%

