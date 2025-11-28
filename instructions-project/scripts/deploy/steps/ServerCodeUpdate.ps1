# ServerCodeUpdate.ps1
# Atualização do código do servidor no servidor remoto

function Update-ServerCode {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerRootPath
    )
    
    # Normalizar caminho removendo caracteres de retorno de linha - múltiplas passadas para garantir
    $ServerRootPath = $ServerRootPath -replace "`r`n", "" -replace "`r", "" -replace "`n", ""
    $ServerRootPath = $ServerRootPath.Trim()
    # Garantir que não há caracteres de controle restantes usando regex mais agressiva
    $ServerRootPath = $ServerRootPath -creplace '[^\x20-\x7E]', ''
    $ServerRootPath = $ServerRootPath.Trim()
    # Forçar conversão para string limpa
    $ServerRootPath = [string]$ServerRootPath
    
    Write-Host "=== 4.5. Atualizar código do servidor no servidor remoto ===" -ForegroundColor Cyan
    Write-Host "Atualizando código do servidor (server/) no servidor remoto via git pull..." -ForegroundColor Gray
    
    # Construir comando cd usando variável bash para evitar problemas com \r
    # Caminhos Linux não têm aspas, então podemos usar interpolação direta
    $serverUpdateCommands = @"
SERVER_ROOT_PATH='$ServerRootPath'
cd "$SERVER_ROOT_PATH" || exit 1
echo '=== Atualizando código do servidor no servidor remoto ==='
echo ''

# Verificar se é repositório Git
if [ -d .git ]; then
    echo 'Repositório Git encontrado'
    echo 'Fazendo git fetch...'
    git fetch origin 2>&1
    FETCH_EXIT=`$?
    
    if [ `$FETCH_EXIT -eq 0 ]; then
        echo 'Fazendo git pull origin main...'
        CURRENT_BRANCH=`$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')
        if [ -z "`$CURRENT_BRANCH" ]; then
            CURRENT_BRANCH='main'
        fi
        echo "Branch atual: `$CURRENT_BRANCH"
        
        git pull origin `$CURRENT_BRANCH 2>&1
        PULL_EXIT=`$?
        
        if [ `$PULL_EXIT -eq 0 ]; then
            echo '[OK] Código do servidor atualizado com sucesso!'
            echo ''
            
            # Instalar dependências
            echo 'Instalando dependências (npm install)...'
            # Usar npm ci se existir package-lock.json, senão npm install
            if [ -f package-lock.json ]; then
                echo 'Usando npm ci (instalação limpa)...'
                npm ci --production 2>&1 || npm install --production 2>&1
            else
                echo 'Usando npm install...'
                npm install --production 2>&1
            fi
            echo '[OK] Dependências instaladas'
            echo ''
            
            # Mostrar commit atual
            CURRENT_COMMIT=`$(git rev-parse --short HEAD 2>/dev/null || echo '')
            COMMIT_MSG=`$(git log -1 --pretty=format:"%s" 2>/dev/null || echo '')
            if [ -n "`$CURRENT_COMMIT" ]; then
                echo "Commit atual: `$CURRENT_COMMIT - `$COMMIT_MSG"
            fi
            echo ''
            echo '[OK] Código do servidor está atualizado'
        else
            echo '[AVISO] git pull falhou (código: '$PULL_EXIT')'
            echo 'Continuando com código existente no servidor...'
            echo ''
        fi
    else
        echo '[AVISO] git fetch falhou (código: '$FETCH_EXIT')'
        echo 'Continuando com código existente no servidor...'
        echo ''
    fi
else
    echo '[AVISO] Diretório .git não encontrado'
    echo 'Continuando sem atualizar código do servidor...'
    echo ''
fi
"@
    
    $serverUpdateOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $serverUpdateCommands
    Write-Host $serverUpdateOutput -ForegroundColor Gray
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[AVISO] Pode ter havido problemas ao atualizar código do servidor" -ForegroundColor Yellow
        Write-Host "   Continuando mesmo assim..." -ForegroundColor Yellow
    }
    else {
        Write-Host "[OK] Código do servidor atualizado no servidor remoto!" -ForegroundColor Green
    }
    Write-Host ""
}

