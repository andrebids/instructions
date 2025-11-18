@echo off
setlocal enabledelayedexpansion
rem =====================
rem Build e deploy para servidor
rem =====================

rem Definir diretório raiz do projeto de forma portável
rem Navegar para o diretório pai (raiz do projeto) e capturar o caminho
pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"
popd

cls
echo ========================================
echo    BUILD E DEPLOY PARA SERVIDOR
echo ========================================
echo.
       echo Este processo irá:
       echo 1. Fazer build do cliente localmente
       echo 2. Enviar ficheiros compilados para o servidor
       echo 3. Atualizar o servidor com o novo build
       echo 4. Reiniciar o servidor PM2
echo.
echo AVISO: NOTA - O servidor remoto deve estar acessivel via SSH
echo    Certifique-se de que a chave SSH está configurada
echo.
       echo O script ira executar automaticamente:
       echo    - Atualização do código do servidor (git pull)
       echo    - Execução de migrations na base de dados
       echo    - pm2 restart instructions-server
echo.
echo Iniciando deploy automaticamente...
timeout /t 2 /nobreak >nul
echo.
echo ========================================
echo    EXECUTANDO BUILD E DEPLOY COMPLETO
echo ========================================
echo.

rem PROJECT_ROOT já foi definido no início do script

rem Verificar se o script PowerShell existe
if not exist "%PROJECT_ROOT%\upload-build.ps1" (
    echo ERRO: Script upload-build.ps1 nao encontrado!
    echo    Certifique-se de que o ficheiro existe na raiz do projeto.
    echo.
    pause
    exit /b 1
)

rem Executar o script PowerShell
echo Executando script de build e deploy...
powershell.exe -ExecutionPolicy Bypass -File "%PROJECT_ROOT%\upload-build.ps1"
set "DEPLOY_SUCCESS=%errorlevel%"

echo.
if %DEPLOY_SUCCESS% equ 0 (
    echo ========================================
    echo    OK: BUILD E DEPLOY CONCLUIDO!
    echo ========================================
    echo.
    echo OK: Build enviado para o servidor
    echo OK: Servidor reiniciado
    echo.
    echo O servidor remoto foi atualizado completamente.
    echo.
    echo Se houver problemas, verifique:
    echo    - Logs do PM2: ssh servidor 'pm2 logs instructions-server'
    echo    - Status do PM2: ssh servidor 'pm2 status'
    echo    - Health check: curl http://servidor:5000/health
    echo.
) else (
    echo ========================================
    echo    ERRO: ERRO NO DEPLOY
    echo ========================================
    echo.
    echo O deploy falhou. Verifique:
       echo 1. Servidor está acessível via SSH
       echo 2. Chave SSH está configurada corretamente
       echo 3. Build local foi concluído com sucesso
       echo 4. PM2 está instalado e configurado no servidor
    echo 6. Verifique os erros acima para mais detalhes
    echo.
    echo Para verificar o status do servidor:
    echo    ssh servidor 'pm2 status'
    echo    ssh servidor 'pm2 logs instructions-server --lines 50'
    echo.
)

pause
exit /b %DEPLOY_SUCCESS%

