@echo off
setlocal enabledelayedexpansion
rem =====================
rem Verificação e instalação de dependências
rem =====================

rem Garantir que LOG_FILE está definido (portabilidade entre computadores)
if not defined LOG_FILE (
    rem Calcular diretório raiz do projeto (um nível acima de functions)
    pushd "%~dp0.."
    set "LOG_FILE=%CD%\project-manager.log"
    popd
)

:check_and_install_dependencies
echo ========================================
echo    VERIFICANDO DEPENDÊNCIAS
echo ========================================
echo.
echo [DEBUG] Iniciando verificacao de dependencias...
echo [%DATE% %TIME%] [DEBUG] Iniciando verificacao de dependencias... >> "%LOG_FILE%" 2>&1

rem Verificar se npm está disponível
where npm >nul 2>&1
if errorlevel 1 (
    echo ERRO: npm nao encontrado no PATH!
    echo [%DATE% %TIME%] ERRO: npm nao encontrado no PATH >> "%LOG_FILE%" 2>&1
    echo    -> Certifique-se de que Node.js está instalado e npm está no PATH
    pause
    exit /b 1
)
echo [DEBUG] npm encontrado e disponivel
echo [%DATE% %TIME%] [DEBUG] npm encontrado e disponivel >> "%LOG_FILE%" 2>&1

rem Definir diretório raiz do projeto de forma portável
rem Navegar para o diretório pai (raiz do projeto) e capturar o caminho
pushd "%~dp0.."
set "PROJECT_ROOT=%CD%"
popd

rem Verificar se diretórios existem
if not exist "%PROJECT_ROOT%\server" (
    echo ERRO: Diretorio server nao encontrado!
    echo [%DATE% %TIME%] ERRO: Diretorio server nao encontrado >> "%LOG_FILE%" 2>&1
    pause
    exit /b 1
)
if not exist "%PROJECT_ROOT%\client" (
    echo ERRO: Diretorio client nao encontrado!
    echo [%DATE% %TIME%] ERRO: Diretorio client nao encontrado >> "%LOG_FILE%" 2>&1
    pause
    exit /b 1
)
echo [DEBUG] Diretorios server e client encontrados
echo [%DATE% %TIME%] [DEBUG] Diretorios server e client encontrados >> "%LOG_FILE%" 2>&1

echo [1/3] Verificando dependências do servidor...
echo [%DATE% %TIME%] [1/3] Verificando dependencias do servidor... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Tentando acessar diretorio server...
echo [%DATE% %TIME%] [DEBUG] Tentando acessar diretorio server... >> "%LOG_FILE%" 2>&1
cd /d "%PROJECT_ROOT%\server"
set "CD_SERVER_RESULT=%errorlevel%"
echo [DEBUG] cd para server retornou: %CD_SERVER_RESULT%
echo [%DATE% %TIME%] [DEBUG] cd para server retornou: %CD_SERVER_RESULT% >> "%LOG_FILE%" 2>&1
if %CD_SERVER_RESULT% neq 0 (
    echo ERRO: Nao foi possivel acessar o diretorio server
    echo [%DATE% %TIME%] ERRO: Nao foi possivel acessar diretorio server >> "%LOG_FILE%" 2>&1
    echo [DEBUG] Pausando antes de sair...
    pause
    exit /b 1
)
echo [DEBUG] Diretorio server acessado com sucesso. Diretorio atual: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio server acessado com sucesso: %CD% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando se node_modules existe...
echo [%DATE% %TIME%] [DEBUG] Verificando se node_modules existe... >> "%LOG_FILE%" 2>&1
set "SERVER_NEED_INSTALL=0"
if not exist "node_modules" (
    echo AVISO: node_modules nao encontrado no servidor. Instalando dependencias...
    echo [%DATE% %TIME%] node_modules nao encontrado no servidor >> "%LOG_FILE%" 2>&1
    set "SERVER_NEED_INSTALL=1"
    echo [DEBUG] SERVER_NEED_INSTALL definido como 1
) else (
    echo [DEBUG] node_modules encontrado, verificando dependencias criticas...
    echo [%DATE% %TIME%] [DEBUG] node_modules encontrado, verificando dependencias criticas... >> "%LOG_FILE%" 2>&1
    rem Verificar se dependências críticas estão instaladas
    if not exist "node_modules\sharp" (
        echo AVISO: sharp nao encontrado. Reinstalando dependencias...
        echo [%DATE% %TIME%] sharp nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\sequelize" (
        echo AVISO: sequelize nao encontrado. Reinstalando dependencias...
        echo [%DATE% %TIME%] sequelize nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\express" (
        echo AVISO: express nao encontrado. Reinstalando dependencias...
        echo [%DATE% %TIME%] express nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    if not exist "node_modules\pg" (
        echo pg nao encontrado. Reinstalando dependencias...
        echo [%DATE% %TIME%] pg nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
    rem Verificar nodemon (devDependency importante para desenvolvimento)
    if not exist "node_modules\nodemon" (
        echo AVISO: nodemon nao encontrado. Reinstalando dependencias...
        echo [%DATE% %TIME%] nodemon nao encontrado >> "%LOG_FILE%" 2>&1
        set "SERVER_NEED_INSTALL=1"
    )
)
echo [DEBUG] Verificacao concluida. SERVER_NEED_INSTALL=%SERVER_NEED_INSTALL%
echo [%DATE% %TIME%] [DEBUG] Verificacao concluida. SERVER_NEED_INSTALL=%SERVER_NEED_INSTALL% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando se precisa instalar servidor...
echo [%DATE% %TIME%] [DEBUG] Verificando se precisa instalar servidor... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Valor de SERVER_NEED_INSTALL: [%SERVER_NEED_INSTALL%]
echo [%DATE% %TIME%] [DEBUG] Valor de SERVER_NEED_INSTALL: [%SERVER_NEED_INSTALL%] >> "%LOG_FILE%" 2>&1
echo [DEBUG] Testando comparacao antes do IF...
echo [%DATE% %TIME%] [DEBUG] Testando comparacao antes do IF... >> "%LOG_FILE%" 2>&1

rem Usar goto condicional em vez de if/else para evitar problemas
if "%SERVER_NEED_INSTALL%"=="1" goto install_server
goto skip_server_install

:install_server
echo [DEBUG] Comparacao string: SERVER_NEED_INSTALL == 1 - VERDADEIRO
echo [%DATE% %TIME%] [DEBUG] Comparacao string: SERVER_NEED_INSTALL == 1 - VERDADEIRO >> "%LOG_FILE%" 2>&1
echo [DEBUG] SERVER_NEED_INSTALL=1, entrando no bloco de instalacao...
echo [%DATE% %TIME%] [DEBUG] SERVER_NEED_INSTALL=1, entrando no bloco de instalacao... >> "%LOG_FILE%" 2>&1
echo Instalando dependencias do servidor...
echo [%DATE% %TIME%] Instalando dependencias do servidor... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Diretorio atual antes de instalar: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio atual antes de instalar: %CD% >> "%LOG_FILE%" 2>&1
set "INSTALL_ERROR=0"
echo [DEBUG] Verificando se package-lock.json existe...
echo [%DATE% %TIME%] [DEBUG] Verificando se package-lock.json existe... >> "%LOG_FILE%"
rem Verificar se package-lock.json existe usando uma forma mais robusta
set "HAS_PACKAGE_LOCK=0"
if exist "package-lock.json" (
    set "HAS_PACKAGE_LOCK=1"
    echo [DEBUG] package-lock.json EXISTE >> "%LOG_FILE%"
) else (
    echo [DEBUG] package-lock.json NAO EXISTE >> "%LOG_FILE%"
)
echo [DEBUG] HAS_PACKAGE_LOCK=%HAS_PACKAGE_LOCK%
echo [%DATE% %TIME%] [DEBUG] HAS_PACKAGE_LOCK=%HAS_PACKAGE_LOCK% >> "%LOG_FILE%"

rem Usar goto em vez de if aninhado para evitar problemas
if "%HAS_PACKAGE_LOCK%"=="1" goto use_npm_ci
goto use_npm_install

:use_npm_ci
    echo [DEBUG] package-lock.json encontrado, usando npm ci
    echo [%DATE% %TIME%] [DEBUG] package-lock.json encontrado, usando npm ci >> "%LOG_FILE%"
    echo    Usando npm ci (instalação limpa baseada em package-lock.json)...
    echo    Isto pode demorar varios minutos. Aguarde...
    echo [%DATE% %TIME%] Executando npm ci no servidor... >> "%LOG_FILE%"
    echo [%DATE% %TIME%] Isto pode demorar varios minutos. Aguarde... >> "%LOG_FILE%"
    echo [DEBUG] Executando: npm ci
    echo [DEBUG] Executando: npm ci >> "%LOG_FILE%"
    echo [%DATE% %TIME%] [DEBUG] Iniciando execucao do npm ci... >> "%LOG_FILE%"
    npm ci --loglevel=info >> "%LOG_FILE%" 2>&1
    set "INSTALL_ERROR=%errorlevel%"
    echo [%DATE% %TIME%] [DEBUG] npm ci concluido, errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    echo [DEBUG] npm ci retornou errorlevel: %INSTALL_ERROR%
    echo [%DATE% %TIME%] [DEBUG] npm ci retornou errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    if %INSTALL_ERROR% neq 0 (
        echo AVISO: npm ci falhou, tentando npm install...
        echo [%DATE% %TIME%] npm ci falhou (errorlevel: %INSTALL_ERROR%), tentando npm install... >> "%LOG_FILE%" 2>&1
        echo [DEBUG] Executando: npm install
        echo [DEBUG] Executando: npm install >> "%LOG_FILE%" 2>&1
        echo [%DATE% %TIME%] [DEBUG] Iniciando execucao do npm install (fallback)... >> "%LOG_FILE%" 2>&1
        npm install --loglevel=info >> "%LOG_FILE%" 2>&1
        set "INSTALL_ERROR=%errorlevel%"
        echo [%DATE% %TIME%] [DEBUG] npm install concluido, errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        echo [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR%
        echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    )
    goto after_server_install

:use_npm_install
    echo [DEBUG] package-lock.json NAO encontrado, usando npm install
    echo [%DATE% %TIME%] [DEBUG] package-lock.json NAO encontrado, usando npm install >> "%LOG_FILE%"
    echo    Usando npm install...
    echo    Isto pode demorar varios minutos. Aguarde...
    echo [%DATE% %TIME%] Executando npm install no servidor... >> "%LOG_FILE%"
    echo [%DATE% %TIME%] Isto pode demorar varios minutos. Aguarde... >> "%LOG_FILE%"
    echo [DEBUG] Executando: npm install
    echo [DEBUG] Executando: npm install >> "%LOG_FILE%"
    echo [%DATE% %TIME%] [DEBUG] Iniciando execucao do npm install... >> "%LOG_FILE%"
    npm install --loglevel=info >> "%LOG_FILE%" 2>&1
    set "INSTALL_ERROR=%errorlevel%"
    echo [%DATE% %TIME%] [DEBUG] npm install concluido, errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    echo [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR%
    echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %INSTALL_ERROR% >> "%LOG_FILE%" 2>&1

:after_server_install
if %INSTALL_ERROR% neq 0 (
    echo ERRO: Erro ao instalar dependencias do servidor (errorlevel: %INSTALL_ERROR%)
    echo [%DATE% %TIME%] ERRO ao instalar dependencias do servidor (errorlevel: %INSTALL_ERROR%) >> "%LOG_FILE%" 2>&1
    echo    -> Tente executar manualmente: cd server ^&^& npm install
    echo [DEBUG] Pausando antes de sair...
    pause
    cd /d "%PROJECT_ROOT%"
    exit /b 1
)
echo [%DATE% %TIME%] Dependencias do servidor instaladas com sucesso >> "%LOG_FILE%" 2>&1
echo Dependencias do servidor instaladas com sucesso!
rem Verificar novamente após instalação
if not exist "node_modules\sharp" (
    echo AVISO: sharp ainda nao foi instalado apos npm install
    echo    -> Execute manualmente: cd server ^&^& npm install sharp
    echo    -> O servidor pode nao iniciar sem esta dependencia!
)
goto after_server_check

:skip_server_install
echo [DEBUG] Comparacao string: SERVER_NEED_INSTALL != 1 - FALSO, pulando instalacao
echo [%DATE% %TIME%] [DEBUG] Comparacao string: SERVER_NEED_INSTALL != 1 - FALSO, pulando instalacao >> "%LOG_FILE%" 2>&1
echo [DEBUG] Servidor nao precisa instalar
echo [%DATE% %TIME%] [DEBUG] Servidor nao precisa instalar >> "%LOG_FILE%" 2>&1
echo OK: Dependencias do servidor ja instaladas
echo [%DATE% %TIME%] Dependencias do servidor ja instaladas >> "%LOG_FILE%" 2>&1
echo [DEBUG] SERVER_NEED_INSTALL=0, pulando instalacao do servidor...
echo [%DATE% %TIME%] [DEBUG] SERVER_NEED_INSTALL=0, pulando instalacao do servidor... >> "%LOG_FILE%" 2>&1

:after_server_check
echo [DEBUG] Apos o IF/ELSE do servidor...
echo [%DATE% %TIME%] [DEBUG] Apos o IF/ELSE do servidor... >> "%LOG_FILE%" 2>&1
echo.
echo [DEBUG] Continuando para verificacao do cliente...
echo [%DATE% %TIME%] [DEBUG] Continuando para verificacao do cliente... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Linha de continuacao executada com sucesso
echo [%DATE% %TIME%] [DEBUG] Linha de continuacao executada com sucesso >> "%LOG_FILE%" 2>&1

echo [2/3] Verificando dependências do cliente...
echo [%DATE% %TIME%] [2/3] Verificando dependencias do cliente... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Tentando acessar diretorio client...
echo [%DATE% %TIME%] [DEBUG] Tentando acessar diretorio client... >> "%LOG_FILE%" 2>&1
cd /d "%PROJECT_ROOT%\client"
set "CD_CLIENT_RESULT=%errorlevel%"
echo [DEBUG] cd para client retornou: %CD_CLIENT_RESULT%
echo [%DATE% %TIME%] [DEBUG] cd para client retornou: %CD_CLIENT_RESULT% >> "%LOG_FILE%" 2>&1
if %CD_CLIENT_RESULT% neq 0 (
    echo ERRO: Nao foi possivel acessar o diretorio client
    echo [%DATE% %TIME%] ERRO: Nao foi possivel acessar diretorio client >> "%LOG_FILE%" 2>&1
    echo [DEBUG] Pausando antes de sair...
    pause
    cd /d "%~dp0"
    exit /b 1
)
echo [DEBUG] Diretorio client acessado com sucesso. Diretorio atual: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio client acessado com sucesso: %CD% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Verificando se node_modules existe no cliente...
echo [%DATE% %TIME%] [DEBUG] Verificando se node_modules existe no cliente... >> "%LOG_FILE%" 2>&1
set "NEED_INSTALL=0"
if not exist "node_modules" (
    echo AVISO: node_modules nao encontrado no cliente. Instalando dependencias...
    echo [%DATE% %TIME%] node_modules nao encontrado no cliente >> "%LOG_FILE%" 2>&1
    set "NEED_INSTALL=1"
    echo [DEBUG] NEED_INSTALL definido como 1
) else (
    echo [DEBUG] node_modules encontrado no cliente, verificando dependencias criticas...
    echo [%DATE% %TIME%] [DEBUG] node_modules encontrado no cliente, verificando dependencias criticas... >> "%LOG_FILE%" 2>&1
    rem Verificar se dependências críticas estão instaladas
    if not exist "node_modules\three" (
        echo AVISO: three nao encontrado. Reinstalando dependencias...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\react" (
        echo AVISO: react nao encontrado. Reinstalando dependencias...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\vite" (
        echo AVISO: vite nao encontrado. Reinstalando dependencias...
        set "NEED_INSTALL=1"
    )
    rem Verificar também outras dependências críticas do projeto
    if not exist "node_modules\react-router-dom" (
        echo AVISO: react-router-dom nao encontrado. Reinstalando dependencias...
        set "NEED_INSTALL=1"
    )
    if not exist "node_modules\@heroui\react" (
        echo AVISO: @heroui/react nao encontrado. Reinstalando dependencias...
        set "NEED_INSTALL=1"
    )
)
echo [DEBUG] Verificacao do cliente concluida. NEED_INSTALL=%NEED_INSTALL%
echo [%DATE% %TIME%] [DEBUG] Verificacao do cliente concluida. NEED_INSTALL=%NEED_INSTALL% >> "%LOG_FILE%" 2>&1

rem Usar goto condicional em vez de if/else para evitar problemas
if "%NEED_INSTALL%"=="1" goto install_client
goto skip_client_install

:install_client
echo [DEBUG] NEED_INSTALL=1, entrando no bloco de instalacao do cliente...
echo [%DATE% %TIME%] [DEBUG] NEED_INSTALL=1, entrando no bloco de instalacao do cliente... >> "%LOG_FILE%" 2>&1
echo [DEBUG] Diretorio atual antes de instalar cliente: %CD%
echo [%DATE% %TIME%] [DEBUG] Diretorio atual antes de instalar cliente: %CD% >> "%LOG_FILE%" 2>&1
set "CLIENT_INSTALL_ERROR=0"
if exist "package-lock.json" (
        echo Instalando dependencias do cliente com npm ci...
        echo Isto pode demorar varios minutos. Aguarde...
        echo [%DATE% %TIME%] Instalando dependencias do cliente com npm ci... >> "%LOG_FILE%" 2>&1
        echo [%DATE% %TIME%] Isto pode demorar varios minutos. Aguarde... >> "%LOG_FILE%" 2>&1
        echo [DEBUG] Executando: npm ci
        echo [DEBUG] Executando: npm ci >> "%LOG_FILE%" 2>&1
        echo [%DATE% %TIME%] [DEBUG] Iniciando execucao do npm ci (cliente)... >> "%LOG_FILE%" 2>&1
        npm ci --loglevel=info >> "%LOG_FILE%" 2>&1
        set "CLIENT_INSTALL_ERROR=%errorlevel%"
        echo [%DATE% %TIME%] [DEBUG] npm ci concluido (cliente), errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        echo [DEBUG] npm ci retornou errorlevel: %CLIENT_INSTALL_ERROR%
        echo [%DATE% %TIME%] [DEBUG] npm ci retornou errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        if %CLIENT_INSTALL_ERROR% neq 0 (
            echo AVISO: npm ci falhou, tentando npm install...
            echo [%DATE% %TIME%] npm ci falhou (errorlevel: %CLIENT_INSTALL_ERROR%), tentando npm install... >> "%LOG_FILE%" 2>&1
            echo [DEBUG] Executando: npm install
            echo [DEBUG] Executando: npm install >> "%LOG_FILE%" 2>&1
            echo [%DATE% %TIME%] [DEBUG] Iniciando execucao do npm install (cliente, fallback)... >> "%LOG_FILE%" 2>&1
            npm install --loglevel=info >> "%LOG_FILE%" 2>&1
            set "CLIENT_INSTALL_ERROR=%errorlevel%"
            echo [%DATE% %TIME%] [DEBUG] npm install concluido (cliente), errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
            echo [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR%
            echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        )
    ) else (
        echo Instalando dependencias do cliente com npm install...
        echo Isto pode demorar varios minutos. Aguarde...
        echo [%DATE% %TIME%] Instalando dependencias do cliente com npm install... >> "%LOG_FILE%" 2>&1
        echo [%DATE% %TIME%] Isto pode demorar varios minutos. Aguarde... >> "%LOG_FILE%" 2>&1
        echo [DEBUG] Executando: npm install
        echo [DEBUG] Executando: npm install >> "%LOG_FILE%" 2>&1
        echo [%DATE% %TIME%] [DEBUG] Iniciando execucao do npm install (cliente)... >> "%LOG_FILE%" 2>&1
        npm install --loglevel=info >> "%LOG_FILE%" 2>&1
        set "CLIENT_INSTALL_ERROR=%errorlevel%"
        echo [%DATE% %TIME%] [DEBUG] npm install concluido (cliente), errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
        echo [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR%
        echo [%DATE% %TIME%] [DEBUG] npm install retornou errorlevel: %CLIENT_INSTALL_ERROR% >> "%LOG_FILE%" 2>&1
    )
    if %CLIENT_INSTALL_ERROR% neq 0 (
        echo ERRO: Erro ao instalar dependencias do cliente (errorlevel: %CLIENT_INSTALL_ERROR%)
        echo [%DATE% %TIME%] ERRO ao instalar dependencias do cliente (errorlevel: %CLIENT_INSTALL_ERROR%) >> "%LOG_FILE%" 2>&1
        echo    -> Tente executar manualmente: cd client ^&^& npm install
        echo [DEBUG] Pausando antes de sair...
        pause
        cd /d "%PROJECT_ROOT%"
        exit /b 1
    )
    echo [%DATE% %TIME%] Dependencias do cliente instaladas com sucesso >> "%LOG_FILE%" 2>&1
    echo OK: Dependencias do cliente instaladas com sucesso!
    rem Verificar novamente após instalação
    if not exist "node_modules\three" (
        echo AVISO: three ainda nao foi instalado apos npm install
        echo    -> Execute manualmente: cd client ^&^& npm install three
    )
goto after_client_check

:skip_client_install
echo [DEBUG] NEED_INSTALL != 1 - FALSO, pulando instalacao do cliente
echo [%DATE% %TIME%] [DEBUG] NEED_INSTALL != 1 - FALSO, pulando instalacao do cliente >> "%LOG_FILE%" 2>&1
echo OK: Dependencias do cliente ja instaladas
echo [%DATE% %TIME%] Dependencias do cliente ja instaladas >> "%LOG_FILE%" 2>&1

:after_client_check
echo.

echo [3/3] Verificação de dependências concluída!
echo OK: Todas as dependencias estao prontas
echo [%DATE% %TIME%] Verificacao de dependencias concluida com sucesso >> "%LOG_FILE%" 2>&1
echo [DEBUG] Retornando ao diretorio raiz...
cd /d "%PROJECT_ROOT%"
set "CD_ROOT_RESULT=%errorlevel%"
echo [DEBUG] cd para raiz retornou: %CD_ROOT_RESULT%
echo [%DATE% %TIME%] [DEBUG] cd para raiz retornou: %CD_ROOT_RESULT% >> "%LOG_FILE%" 2>&1
echo [DEBUG] Funcao check_and_install_dependencies concluida com sucesso
echo [%DATE% %TIME%] [DEBUG] Funcao check_and_install_dependencies concluida com sucesso >> "%LOG_FILE%" 2>&1
exit /b 0

