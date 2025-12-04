@echo off
REM ============================================
REM Script para adicionar regras de firewall para Docker
REM ============================================

echo.
echo ============================================
echo Adicionando Regras de Firewall para Docker
echo ============================================
echo.

REM Verificar se está executando como administrador
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Este script precisa ser executado como Administrador!
    echo.
    echo Por favor:
    echo 1. Clique com botao direito no arquivo
    echo 2. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo [INFO] Adicionando regra para porta 5001 (Backend API)...
netsh advfirewall firewall add rule name="Docker Port 5001 - Backend API" dir=in action=allow protocol=TCP localport=5001 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Regra para porta 5001 adicionada com sucesso
) else (
    echo [AVISO] Regra para porta 5001 pode ja existir ou houve erro
)

echo.
echo [INFO] Adicionando regra para porta 3003 (Frontend)...
netsh advfirewall firewall add rule name="Docker Port 3003 - Frontend" dir=in action=allow protocol=TCP localport=3003 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Regra para porta 3003 adicionada com sucesso
) else (
    echo [AVISO] Regra para porta 3003 pode ja existir ou houve erro
)

echo.
echo ============================================
echo Verificando regras criadas...
echo ============================================
echo.

netsh advfirewall firewall show rule name="Docker Port 5001 - Backend API" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Regra para porta 5001 esta ativa
) else (
    echo [ERRO] Regra para porta 5001 nao encontrada
)

netsh advfirewall firewall show rule name="Docker Port 3003 - Frontend" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Regra para porta 3003 esta ativa
) else (
    echo [ERRO] Regra para porta 3003 nao encontrada
)

echo.
echo ============================================
echo Concluido!
echo ============================================
echo.
echo Agora o Docker deve estar acessivel na rede local.
echo Teste acessando de outro dispositivo:
echo   - Frontend: http://192.168.2.16:3003
echo   - Backend:  http://192.168.2.16:5001
echo.
pause

