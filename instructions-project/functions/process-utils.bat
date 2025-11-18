@echo off
setlocal enabledelayedexpansion
rem =====================
rem Funções de gerenciamento de processos e portas
rem =====================

:stop_quick
rem Fechar apenas processos nas portas específicas do projeto
rem Porta 5000 - Backend
echo [DEBUG] Verificando processos na porta 5000 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    echo [DEBUG] Encontrado processo na porta 5000: PID %%a
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo [DEBUG] Fechando processo Node.js na porta 5000 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

rem Porta 3003 - Frontend
echo [DEBUG] Verificando processos na porta 3003 (frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3003" ^| findstr "LISTENING"') do (
    echo [DEBUG] Encontrado processo na porta 3003: PID %%a
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo [DEBUG] Fechando processo Node.js na porta 3003 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

rem Também verificar porta 5173 caso esteja em uso (fallback do Vite)
echo [DEBUG] Verificando processos na porta 5173 (frontend alternativo)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo [DEBUG] Encontrado processo na porta 5173: PID %%a
    tasklist /fi "PID eq %%a" 2>nul | findstr /i "node.exe nodemon.exe" >nul
    if not errorlevel 1 (
        echo [DEBUG] Fechando processo Node.js na porta 5173 (PID: %%a)
        taskkill /f /pid %%a >nul 2>&1
    )
)

exit /b 0

