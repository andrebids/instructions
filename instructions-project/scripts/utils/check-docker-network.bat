@echo off
REM ============================================
REM Script para verificar acessibilidade do Docker na rede local
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo Verificacao de Acessibilidade do Docker na Rede Local
echo ============================================
echo.

REM Obter IP da rede local
echo [INFO] Obtendo informacoes de rede...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip_line=%%a"
    set "ip_line=!ip_line: =!"
    if "!ip_line:~0,7!"=="192.168" (
        set "LOCAL_IP=!ip_line!"
        goto :found_ip
    )
)

:found_ip
if not defined LOCAL_IP (
    echo [AVISO] Nao foi possivel determinar o IP da rede local automaticamente
    set /p LOCAL_IP="Por favor, insira o IP da sua maquina na rede local: "
)

echo [INFO] IP da rede local: %LOCAL_IP%
echo.

REM Verificar containers Docker rodando
echo [INFO] Verificando containers Docker...
docker ps --format "{{.Names}}\t{{.Ports}}" | findstr "instructions-dev" >nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Container 'instructions-dev' nao esta rodando!
    echo [INFO] Execute: docker compose -f docker-compose.dev.yml up -d
    exit /b 1
)

echo [OK] Container 'instructions-dev' esta rodando
echo.

REM Verificar portas escutando
echo [INFO] Verificando portas...
netstat -an | findstr ":5001" | findstr "LISTENING" >nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Porta 5001 nao esta escutando!
) else (
    echo [OK] Porta 5001 esta escutando em 0.0.0.0 (todas as interfaces)
)

netstat -an | findstr ":3003" | findstr "LISTENING" >nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Porta 3003 nao esta escutando!
) else (
    echo [OK] Porta 3003 esta escutando em 0.0.0.0 (todas as interfaces)
)

echo.

REM Verificar regras de firewall
echo [INFO] Verificando regras de firewall do Windows...

netsh advfirewall firewall show rule name=all | findstr /i "5001" >nul
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Nao encontrada regra de firewall especifica para porta 5001
    echo [INFO] Docker Desktop pode ter criado regras automaticas
) else (
    echo [OK] Regra de firewall encontrada para porta 5001
)

netsh advfirewall firewall show rule name=all | findstr /i "3003" >nul
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Nao encontrada regra de firewall especifica para porta 3003
) else (
    echo [OK] Regra de firewall encontrada para porta 3003
)

echo.

REM Testar conectividade local
echo [INFO] Testando conectividade local...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:5001/health' -TimeoutSec 2 -UseBasicParsing ^| Out-Null; exit 0 } catch { exit 1 }"
set TEST_RESULT=%ERRORLEVEL%
if !TEST_RESULT! equ 0 (
    echo [OK] Backend API porta 5001 OK localmente
) else (
    echo [ERRO] Backend API porta 5001 falhou localmente
)

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:3003' -TimeoutSec 2 -UseBasicParsing ^| Out-Null; exit 0 } catch { exit 1 }"
set TEST_RESULT=%ERRORLEVEL%
if !TEST_RESULT! equ 0 (
    echo [OK] Frontend porta 3003 OK localmente
) else (
    echo [ERRO] Frontend porta 3003 falhou localmente
)

echo.

REM Testar conectividade via IP da rede
echo [INFO] Testando conectividade via IP da rede (%LOCAL_IP%)...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://%LOCAL_IP%:5001/health' -TimeoutSec 2 -UseBasicParsing ^| Out-Null; exit 0 } catch { exit 1 }"
set TEST_RESULT=%ERRORLEVEL%
if !TEST_RESULT! equ 0 (
    echo [OK] Backend API acessivel via %LOCAL_IP%:5001
) else (
    echo [AVISO] Backend API nao acessivel via %LOCAL_IP%:5001
    echo [INFO] Verifique o firewall do Windows
)

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://%LOCAL_IP%:3003' -TimeoutSec 2 -UseBasicParsing ^| Out-Null; exit 0 } catch { exit 1 }"
set TEST_RESULT=%ERRORLEVEL%
if !TEST_RESULT! equ 0 (
    echo [OK] Frontend acessivel via %LOCAL_IP%:3003
) else (
    echo [AVISO] Frontend nao acessivel via %LOCAL_IP%:3003
    echo [INFO] Verifique o firewall do Windows
)

echo.
echo ============================================
echo Resumo e Instrucoes
echo ============================================
echo.
echo [INFO] URLs para acesso na rede local:
echo   - Frontend:  http://%LOCAL_IP%:3003
echo   - Backend:   http://%LOCAL_IP%:5001
echo.
echo [INFO] Para testar de outro dispositivo na mesma rede:
echo   1. Abra um navegador no outro dispositivo
echo   2. Acesse: http://%LOCAL_IP%:3003
echo.
echo [AVISO] Se nao conseguir acessar de outro dispositivo:
echo   1. Verifique se o firewall do Windows esta bloqueando
echo   2. Execute como Administrador para criar regras de firewall:
echo      netsh advfirewall firewall add rule name="Docker Port 5001" dir=in action=allow protocol=TCP localport=5001
echo      netsh advfirewall firewall add rule name="Docker Port 3003" dir=in action=allow protocol=TCP localport=3003
echo.

endlocal
exit /b 0

