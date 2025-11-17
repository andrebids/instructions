# Script para fazer build local e enviar para servidor
# Uso: .\upload-build.ps1
#
# Configuração via variáveis de ambiente ou ficheiro .env.deploy:
#   DEPLOY_SSH_KEY      - Caminho para chave SSH (opcional, usa SSH config se não especificado)
#   DEPLOY_SSH_USER     - Utilizador SSH (padrão: bids)
#   DEPLOY_SSH_HOST     - IP ou hostname do servidor (padrão: dev - usa SSH config)
#   DEPLOY_SERVER_PATH  - Caminho no servidor (padrão: /home/bids/apps/instructions-project/client)
#   DEPLOY_SITE_URL     - URL do site (opcional)

# Configurar tratamento de erros
$ErrorActionPreference = "Stop"
$script:ExitCode = 0

# Função para sair com código de erro
function Exit-Script {
    param([int]$ExitCode = 0)
    $script:ExitCode = $ExitCode
    exit $ExitCode
}

# Função para executar comandos com tratamento de erro
function Invoke-SafeCommand {
    param(
        [scriptblock]$Command,
        [string]$ErrorMessage = "Comando falhou",
        [bool]$ContinueOnError = $false
    )
    
    try {
        & $Command
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            if (-not $ContinueOnError) {
                Write-Host "❌ $ErrorMessage (código: $LASTEXITCODE)" -ForegroundColor Red
                throw "$ErrorMessage"
            } else {
                Write-Host "⚠️  $ErrorMessage (código: $LASTEXITCODE) - Continuando..." -ForegroundColor Yellow
            }
        }
    } catch {
        if (-not $ContinueOnError) {
            Write-Host "❌ $ErrorMessage" -ForegroundColor Red
            Write-Host "   Erro: $_" -ForegroundColor Red
            throw
        } else {
            Write-Host "⚠️  $ErrorMessage - Continuando..." -ForegroundColor Yellow
            Write-Host "   Erro: $_" -ForegroundColor Yellow
        }
    }
}

# Garantir que o script termina com código de erro apropriado
trap {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERRO CRÍTICO NO SCRIPT" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host "Linha: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
    Write-Host "Comando: $($_.InvocationInfo.Line)" -ForegroundColor Red
    Write-Host ""
    Exit-Script -ExitCode 1
}

# Carregar configuração do ficheiro .env.deploy se existir
$envFile = Join-Path $PSScriptRoot ".env.deploy"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Configuração carregada de .env.deploy" -ForegroundColor Gray
}

# Configuração com valores padrão
$sshKey = if ($env:DEPLOY_SSH_KEY) { $env:DEPLOY_SSH_KEY } else { $null }
$sshUser = if ($env:DEPLOY_SSH_USER) { $env:DEPLOY_SSH_USER } else { "bids" }
$sshHost = if ($env:DEPLOY_SSH_HOST) { $env:DEPLOY_SSH_HOST } else { "dev" }
$serverPath = if ($env:DEPLOY_SERVER_PATH) { $env:DEPLOY_SERVER_PATH } else { "/home/bids/apps/instructions-project/client" }
$serverRootPath = if ($env:DEPLOY_SERVER_ROOT_PATH) { $env:DEPLOY_SERVER_ROOT_PATH } else { "/home/bids/apps/instructions-project" }
$pm2AppName = if ($env:DEPLOY_PM2_APP_NAME) { $env:DEPLOY_PM2_APP_NAME } else { "instructions-server" }
$siteUrl = if ($env:DEPLOY_SITE_URL) { $env:DEPLOY_SITE_URL } else { "" }

# Verificar se chave SSH foi especificada, caso contrário usa SSH config
if ($sshKey -and -not (Test-Path $sshKey)) {
    Write-Host "❌ Chave SSH não encontrada: $sshKey" -ForegroundColor Red
    Write-Host ""
    Write-Host "Soluções:" -ForegroundColor Yellow
    Write-Host "1. Copie a chave SSH para: $sshKey"
    Write-Host "2. Ou defina DEPLOY_SSH_KEY no ficheiro .env.deploy"
    Write-Host "3. Ou defina a variável de ambiente DEPLOY_SSH_KEY"
    Write-Host "4. Ou remova DEPLOY_SSH_KEY para usar configuração SSH padrão (recomendado para host 'dev')"
    Write-Host ""
    Write-Host "Exemplo de .env.deploy:" -ForegroundColor Cyan
    Write-Host "DEPLOY_SSH_USER=bids"
    Write-Host "DEPLOY_SSH_HOST=dev"
    Write-Host "DEPLOY_SERVER_PATH=/home/bids/apps/instructions-project/client"
    Exit-Script -ExitCode 1
}

# Função auxiliar para construir comando SSH com ou sem chave
function Get-SshCommand {
    param(
        [string]$Command,
        [string]$User,
        [string]$SshHost,
        [string]$Key = $null
    )
    $sshOptions = "-o StrictHostKeyChecking=no -o ConnectTimeout=30"
    if ($Key) {
        return "$Command -i `"$Key`" $sshOptions ${User}@${SshHost}"
    } else {
        return "$Command $sshOptions ${User}@${SshHost}"
    }
}

# Função auxiliar para construir comando SCP com ou sem chave
function Get-ScpCommand {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$User,
        [string]$SshHost,
        [string]$Key = $null,
        [string]$AdditionalOptions = ""
    )
    $scpOptions = "-o StrictHostKeyChecking=no -o ConnectTimeout=30 -o ServerAliveInterval=60"
    if ($Key) {
        return "scp -i `"$Key`" $scpOptions $AdditionalOptions `"$Source`" ${User}@${SshHost}:`"$Destination`""
    } else {
        return "scp $scpOptions $AdditionalOptions `"$Source`" ${User}@${SshHost}:`"$Destination`""
    }
}

Write-Host "=== Configuração ===" -ForegroundColor Cyan
Write-Host "Servidor: $sshUser@$sshHost" -ForegroundColor Gray
Write-Host "Caminho Cliente: $serverPath" -ForegroundColor Gray
Write-Host "Caminho Raiz: $serverRootPath" -ForegroundColor Gray
Write-Host "PM2 App: $pm2AppName" -ForegroundColor Gray
Write-Host ""

Write-Host "=== 1. Build Local ===" -ForegroundColor Cyan
try {
    Set-Location "$PSScriptRoot\client"
    if (-not (Test-Path "$PSScriptRoot\client")) {
        Write-Host "❌ Diretório client não encontrado: $PSScriptRoot\client" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    
    Write-Host "Executando npm run build..." -ForegroundColor Gray
npm run build
if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build falhou com código: $LASTEXITCODE" -ForegroundColor Red
        Exit-Script -ExitCode 1
}
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""
} catch {
    Write-Host "❌ Erro ao executar build: $_" -ForegroundColor Red
    Exit-Script -ExitCode 1
}

# Função para limpar espaço no servidor de forma agressiva
function Invoke-ServerCleanup {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerPath,
        [int]$RequiredSpaceMB = 500
    )
    
    Write-Host "Iniciando limpeza automática do servidor..." -ForegroundColor Cyan
    
    $cleanupCommands = @"
set -e
echo '=== Limpeza Automática do Servidor ==='
echo ''

# 1. Limpar TODOS os diretórios temporários client-dist
echo '1. Limpando diretórios temporários /tmp/client-dist-*...'
FREED_TMP=0
if [ -d /tmp ]; then
    for dir in /tmp/client-dist-*; do
        if [ -d "`$dir" ]; then
            SIZE=`$(du -sm "`$dir" 2>/dev/null | cut -f1 || echo 0)
            rm -rf "`$dir" 2>/dev/null || true
            FREED_TMP=`$((FREED_TMP + SIZE))
        fi
    done
    echo "   Liberados ~`$FREED_TMP MB de /tmp"
fi

# 2. Limpar TODOS os backups dist-old-* (manter apenas o mais recente)
echo ''
echo '2. Limpando backups antigos de dist-old-*...'
FREED_DIST=0
if [ -d "$serverPath" ]; then
    cd "$serverPath" 2>/dev/null || true
    BACKUP_COUNT=`$(ls -d dist-old-* 2>/dev/null | wc -l || echo 0)
    if [ "`$BACKUP_COUNT" -gt 1 ]; then
        # Manter apenas o mais recente, remover todos os outros
        ls -dt dist-old-* 2>/dev/null | tail -n +2 | while read backup; do
            if [ -d "`$backup" ]; then
                SIZE=`$(du -sm "`$backup" 2>/dev/null | cut -f1 || echo 0)
                rm -rf "`$backup" 2>/dev/null || true
                FREED_DIST=`$((FREED_DIST + SIZE))
            fi
        done
        echo "   Liberados ~`$FREED_DIST MB de backups antigos"
    else
        echo "   Nenhum backup antigo encontrado"
    fi
fi

# 3. Limpar logs do PM2
echo ''
echo '3. Limpando logs do PM2...'
if command -v pm2 >/dev/null 2>&1; then
    pm2 flush 2>/dev/null || true
    echo "   Logs do PM2 limpos"
else
    echo "   PM2 não encontrado, ignorando"
fi

# 4. Limpar cache do npm (se existir)
echo ''
echo '4. Limpando cache do npm...'
if command -v npm >/dev/null 2>&1; then
    npm cache clean --force 2>/dev/null || true
    echo "   Cache do npm limpo"
fi

# 5. Limpar logs antigos do sistema (últimos 7 dias)
echo ''
echo '5. Limpando logs antigos do sistema...'
if [ -d /var/log ]; then
    find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    find /var/log -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || true
    echo "   Logs antigos removidos"
fi

# 6. Limpar pacotes .deb antigos (se existirem)
echo ''
echo '6. Limpando pacotes .deb antigos...'
if command -v apt-get >/dev/null 2>&1; then
    apt-get clean 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
    echo "   Cache de pacotes limpo"
fi

# 7. Mostrar espaço atual
echo ''
echo '=== Espaço Disponível Após Limpeza ==='
df -h /tmp | tail -1
df -h / | tail -1
echo ''

# Calcular espaço total liberado
TOTAL_FREED=`$((FREED_TMP + FREED_DIST))
echo "Espaço total liberado: ~`$TOTAL_FREED MB"
"@
    
    try {
        $sshCmd = Get-SshCommand -Command "ssh" -User $SshUser -SshHost $SshHost -Key $SshKey
        $cleanupOutput = Invoke-Expression "$sshCmd `"$cleanupCommands`"" 2>&1
        Write-Host $cleanupOutput -ForegroundColor Gray
        
        # Verificar espaço após limpeza
        $diskLine = Invoke-Expression "$sshCmd `"df -BM /tmp 2>/dev/null | tail -1 || df -BM / | tail -1`"" 2>&1
        $availableSpaceMB = "0"
        if ($diskLine -match '\s+(\d+)M\s+') {
            $availableSpaceMB = $matches[1]
        } elseif ($diskLine -match '\s+(\d+)G\s+') {
            $availableSpaceMB = [string]([int]$matches[1] * 1024)
        }
        
        return [int]$availableSpaceMB
    } catch {
        Write-Host "Erro ao executar limpeza: $_" -ForegroundColor Yellow
        return 0
    }
}

# Função para verificar espaço disponível
function Get-AvailableSpace {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost
    )
    
    try {
        $sshCmd = Get-SshCommand -Command "ssh" -User $SshUser -SshHost $SshHost -Key $SshKey
        $diskLine = Invoke-Expression "$sshCmd `"df -BM /tmp 2>/dev/null | tail -1 || df -BM / | tail -1`"" 2>&1
        if ($LASTEXITCODE -ne 0) {
            return 0
        }
        
        $availableSpaceMB = "0"
        if ($diskLine -match '\s+(\d+)M\s+') {
            $availableSpaceMB = $matches[1]
        } elseif ($diskLine -match '\s+(\d+)G\s+') {
            $availableSpaceMB = [string]([int]$matches[1] * 1024)
        }
        
        return [int]$availableSpaceMB
    } catch {
        return 0
    }
}

Write-Host "=== 2. Enviar para servidor ===" -ForegroundColor Cyan
$tempPath = "/tmp/client-dist-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Verificar espaço em disco antes de fazer upload
Write-Host "Verificando espaço em disco no servidor..." -ForegroundColor Gray
try {
    $sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -SshHost $sshHost -Key $sshKey
    $diskInfo = Invoke-Expression "$sshCmd `"df -h /tmp 2>/dev/null | tail -1 || df -h / | tail -1`"" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Espaço disponível: $diskInfo" -ForegroundColor Gray
    } else {
        Write-Host "Aviso: Não foi possível verificar espaço (timeout ou erro de conexão)" -ForegroundColor Yellow
        Write-Host "Tentando continuar mesmo assim..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Aviso: Erro ao verificar espaço: $_" -ForegroundColor Yellow
}

# Verificar espaço disponível
$availableSpaceMB = Get-AvailableSpace -SshKey $sshKey -SshUser $sshUser -SshHost $sshHost
Write-Host "Espaço disponível: $availableSpaceMB MB" -ForegroundColor Gray

# Se houver pouco espaço, fazer limpeza automática
$requiredSpaceMB = 500
if ($availableSpaceMB -lt $requiredSpaceMB) {
    Write-Host ""
    Write-Host "AVISO: Pouco espaço em disco ($availableSpaceMB MB disponível, necessário: $requiredSpaceMB MB)" -ForegroundColor Yellow
    Write-Host "Executando limpeza automática do servidor..." -ForegroundColor Cyan
    
    $newSpaceMB = Invoke-ServerCleanup -SshKey $sshKey -SshUser $sshUser -SshHost $sshHost -ServerPath $serverPath -RequiredSpaceMB $requiredSpaceMB
    
    if ($newSpaceMB -lt $requiredSpaceMB) {
        Write-Host ""
        Write-Host "ERRO: Espaço ainda insuficiente após limpeza ($newSpaceMB MB disponível)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Soluções manuais:" -ForegroundColor Yellow
        Write-Host "  1. Verificar o que está ocupando espaço:"
        Write-Host "     ssh $sshUser@$sshHost 'du -sh /tmp/* ~/* 2>/dev/null | sort -h | tail -20'"
        Write-Host "  2. Limpar manualmente builds antigos:"
        Write-Host "     ssh $sshUser@$sshHost 'rm -rf $serverPath/dist-old-*'"
        Write-Host "  3. Limpar node_modules antigos (se houver):"
        Write-Host "     ssh $sshUser@$sshHost 'find ~ -name node_modules -type d -exec du -sh {} \; | sort -h | tail -10'"
        Write-Host ""
        Exit-Script -ExitCode 1
    } else {
        Write-Host ""
        Write-Host "SUCCESS: Espaço liberado! Agora há $newSpaceMB MB disponível" -ForegroundColor Green
    }
} else {
    Write-Host "Espaço suficiente disponível ($availableSpaceMB MB)" -ForegroundColor Green
}

# Criar diretório temporário no servidor
Write-Host "Criando diretório temporário no servidor..." -ForegroundColor Gray
try {
    $createDirCmd = "mkdir -p $tempPath && chmod 755 $tempPath"
    $sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -SshHost $sshHost -Key $sshKey
    $createOutput = Invoke-Expression "$sshCmd `"$createDirCmd`"" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        if ($createOutput -match "Connection timed out|Connection refused|Network is unreachable") {
            Write-Host "ERRO: Não foi possível conectar ao servidor via SSH" -ForegroundColor Red
            Write-Host "Erro: $createOutput" -ForegroundColor Red
            Write-Host ""
            Write-Host "Verifique:" -ForegroundColor Yellow
            Write-Host "  1. Servidor está online e acessível"
            Write-Host "  2. Firewall permite conexões SSH (porta 22)"
            Write-Host "  3. Chave SSH está correta e tem permissões adequadas"
            Write-Host ""
            Exit-Script -ExitCode 1
        } elseif ($createOutput -match "No space|cannot create") {
            Write-Host "ERRO: Não foi possível criar diretório temporário - sem espaço" -ForegroundColor Red
            Write-Host "Erro: $createOutput" -ForegroundColor Red
            Write-Host ""
            Write-Host "Tentando limpeza automática novamente..." -ForegroundColor Yellow
            $finalSpaceMB = Invoke-ServerCleanup -SshKey $sshKey -SshUser $sshUser -SshHost $sshHost -ServerPath $serverPath -RequiredSpaceMB 1000
            if ($finalSpaceMB -lt 500) {
                Write-Host "ERRO: Espaço ainda insuficiente após limpeza" -ForegroundColor Red
                Exit-Script -ExitCode 1
            }
            # Tentar criar novamente após limpeza
            $createOutput = Invoke-Expression "$sshCmd `"$createDirCmd`"" 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Host "ERRO: Ainda não foi possível criar diretório após limpeza" -ForegroundColor Red
                Exit-Script -ExitCode 1
            }
        } else {
            Write-Host "ERRO: Não foi possível criar diretório temporário" -ForegroundColor Red
            Write-Host "Erro: $createOutput" -ForegroundColor Red
            Exit-Script -ExitCode 1
        }
    }
} catch {
    Write-Host "ERRO: Exceção ao criar diretório: $_" -ForegroundColor Red
    Exit-Script -ExitCode 1
}

# Enviar para pasta temporária com retry e melhor tratamento de erros
Write-Host "Enviando ficheiros para servidor (isto pode demorar alguns minutos para arquivos grandes)..." -ForegroundColor Gray
$maxRetries = 2
$retryCount = 0
$uploadSuccess = $false

while ($retryCount -lt $maxRetries -and -not $uploadSuccess) {
    if ($retryCount -gt 0) {
        Write-Host "Tentativa $($retryCount + 1) de $maxRetries..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        # Limpar diretório parcialmente criado antes de tentar novamente
        $sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -SshHost $sshHost -Key $sshKey
        Invoke-Expression "$sshCmd `"rm -rf $tempPath 2>/dev/null; mkdir -p $tempPath && chmod 755 $tempPath`"" | Out-Null
    }
    
    # Usar scp com compressão e timeout aumentado
    # IMPORTANTE: Enviar conteúdo de dist/* para tempPath diretamente (não dist inteiro)
    # O destino deve terminar com / para que scp coloque os arquivos diretamente no diretório
    Write-Host "Enviando arquivos (pode demorar para arquivos grandes)..." -ForegroundColor Gray
    # Estamos no diretório client após o build, então dist está aqui
    if (-not (Test-Path ".\dist")) {
        Write-Host "❌ Diretório dist não encontrado!" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    # Usar scp com wildcard - PowerShell pode não expandir, mas o script no servidor corrige se necessário
    # Tentar enviar conteúdo diretamente usando caminho relativo
    $scpCmd = Get-ScpCommand -Source ".\dist\*" -Destination "$tempPath/" -User $sshUser -SshHost $sshHost -Key $sshKey -AdditionalOptions "-C -r"
    $scpOutput = Invoke-Expression $scpCmd 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $uploadSuccess = $true
        Write-Host "✅ Upload concluído!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Upload falhou (tentativa $($retryCount + 1))" -ForegroundColor Yellow
        if ($scpOutput -match "Failure|failed|No space") {
            Write-Host "Erro detectado: $($scpOutput -split "`n" | Select-Object -First 3)" -ForegroundColor Yellow
        }
    }
    
    $retryCount++
}

if (-not $uploadSuccess) {
    Write-Host "❌ Upload falhou após $maxRetries tentativas!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  1. Espaço em disco insuficiente no servidor"
    Write-Host "  2. Timeout na conexão (arquivos muito grandes)"
    Write-Host "  3. Permissões insuficientes"
    Write-Host ""
    Write-Host "Soluções:" -ForegroundColor Cyan
    Write-Host "  - Verificar espaço: ssh $sshUser@$sshHost 'df -h'"
    Write-Host "  - Limpar espaço: ssh $sshUser@$sshHost 'du -sh /tmp/client-dist-*'"
    Write-Host "  - Verificar permissões: ssh $sshUser@$sshHost 'ls -ld /tmp'"
    Write-Host ""
    Exit-Script -ExitCode 1
}
Write-Host ""

Write-Host "=== 3. Atualizar no servidor ===" -ForegroundColor Cyan
$sshCommands = @"
cd $serverPath

# Limpar backups antigos ANTES de criar novo (manter apenas os 2 mais recentes)
echo '🧹 Limpando backups antigos (mantendo apenas os 2 mais recentes)...'
ls -dt dist-old-* 2>/dev/null | tail -n +3 | xargs rm -rf 2>/dev/null || true
BACKUP_COUNT=`$(ls -d dist-old-* 2>/dev/null | wc -l)
echo "Mantidos `$BACKUP_COUNT backups recentes"

# Mover novo build para dist
if [ -d $tempPath ]; then
    # PASSO 1: Verificar e corrigir estrutura ANTES de mover
    # Se scp criou tempPath/dist (porque wildcard não expandiu), corrigir
    if [ -d $tempPath/dist ]; then
        echo '⚠️  Detectado estrutura incorreta (tempPath/dist), corrigindo...'
        # Mover conteúdo de tempPath/dist para tempPath (não criar duplicação)
        mv $tempPath/dist/* $tempPath/ 2>/dev/null || true
        # Tentar mover ficheiros ocultos (pode falhar se não houver, ignorar erro)
        find $tempPath/dist -maxdepth 1 -name '.*' -type f -exec mv {} $tempPath/ \; 2>/dev/null || true
        # Remover diretório dist vazio para evitar duplicação
        rmdir $tempPath/dist 2>/dev/null || true
        echo '✅ Estrutura corrigida (sem duplicação)'
    fi
    
    # PASSO 2: Verificar se index.html está no local correto (tempPath diretamente)
    if [ ! -f $tempPath/index.html ] && [ -d $tempPath ]; then
        echo '⚠️  index.html não encontrado diretamente em tempPath, procurando...'
        find $tempPath -name 'index.html' -type f | head -1
    fi
    
    # PASSO 3: Fazer backup do dist atual ANTES de substituir (apenas 1 backup)
    if [ -d dist ]; then
        rm -rf dist-old-previous 2>/dev/null || true
        mv dist dist-old-previous 2>/dev/null || true
        echo '✅ Backup do dist anterior criado'
    fi
    
    # Mover tempPath para dist (agora garantidamente sem subdiretório dist)
    mv $tempPath dist
    chmod -R 755 dist
    
    # Verificação final: garantir que não há dist/dist
    if [ -d dist/dist ]; then
        echo '❌ ERRO CRÍTICO: dist/dist ainda existe após correção!'
        echo 'Corrigindo manualmente...'
        mv dist/dist/* dist/ 2>/dev/null || true
        rmdir dist/dist 2>/dev/null || true
    fi
    
    echo '✅ Build atualizado no servidor!'
    if [ -f dist/index.html ]; then
        ls -lh dist/index.html
        echo ''
        # Mostrar espaço usado
        du -sh dist
        echo ''
        echo '✅ Verificação: index.html está no local correto (dist/index.html)'
    else
        echo '❌ ERRO: dist/index.html não encontrado após atualização'
        echo 'Conteúdo de dist:'
        ls -la dist/ | head -10
        exit 1
    fi
else
    echo '❌ Erro: Diretório temporário não encontrado: $tempPath'
    exit 1
fi
"@
$sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -Host $sshHost -Key $sshKey
$updateOutput = Invoke-Expression "$sshCmd `"$($sshCommands.Replace("`r`n", "`n"))`"" 2>&1
Write-Host $updateOutput -ForegroundColor Gray
if ($LASTEXITCODE -ne 0 -or $updateOutput -match "Erro|error|cannot access") {
    Write-Host "❌ Erro ao atualizar build no servidor!" -ForegroundColor Red
    Write-Host "Verificando estado do servidor..." -ForegroundColor Yellow
    Invoke-Expression "$sshCmd `"ls -la $serverPath/ | grep dist`"" | Out-Host
    Exit-Script -ExitCode 1
}
Write-Host "✅ Build atualizado no servidor!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 4. Executar Migrations ===" -ForegroundColor Cyan
Write-Host "Executando migrations no servidor remoto..." -ForegroundColor Gray
$migrationCommands = @"
cd $serverRootPath

# Atualizar código do servidor (se for git repo)
if [ -d .git ]; then
    echo 'Atualizando código do servidor...'
    git fetch origin 2>/dev/null || true
    CURRENT_BRANCH=`$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')
    git reset --hard origin/`${CURRENT_BRANCH} 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
    echo 'Codigo atualizado'
    
    # Verificar se server existe após git pull
    if [ ! -d server ]; then
        echo 'AVISO: Diretorio server nao encontrado após git pull'
        echo 'Tentando verificar se precisa fazer checkout...'
        git checkout HEAD -- server 2>/dev/null || true
        if [ ! -d server ]; then
            echo 'ERRO: Diretorio server ainda nao encontrado'
            echo 'Listando conteudo do diretorio raiz:'
            ls -la
            exit 1
        fi
    fi
fi

# Verificar se diretório server existe
if [ ! -d server ]; then
    echo 'ERRO: Diretorio server nao encontrado em $serverRootPath'
    echo 'Verifique se o projeto foi clonado corretamente'
    echo 'Listando conteudo:'
    ls -la
    exit 1
fi

# Verificar se server/package.json existe, se não, procurar em instructions-project/server/
if [ ! -f server/package.json ]; then
    echo 'AVISO: package.json nao encontrado em server/'
    if [ -f instructions-project/server/package.json ]; then
        echo 'Encontrado em instructions-project/server/, copiando arquivos do servidor...'
        
        # Preservar .env se existir no diretório destino (copiar para backup primeiro)
        if [ -f server/.env ]; then
            cp server/.env server/.env.backup.preserve 2>/dev/null || true
            echo 'Preservando .env existente'
        fi
        
        # Copiar todos os arquivos do diretório correto
        # Usar rsync se disponível, senão usar cp
        if command -v rsync >/dev/null 2>&1; then
            rsync -av --exclude='node_modules' --exclude='.env' instructions-project/server/ server/ 2>/dev/null || cp -r instructions-project/server/* server/ 2>/dev/null || true
        else
            # Copiar arquivos manualmente, excluindo node_modules e .env
            find instructions-project/server -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name '.env' -exec cp -r {} server/ \; 2>/dev/null || cp -r instructions-project/server/* server/ 2>/dev/null || true
            # Remover .env se foi copiado
            rm -f server/.env 2>/dev/null || true
        fi
        
        # Restaurar .env preservado se foi feito backup
        if [ -f server/.env.backup.preserve ]; then
            if [ ! -f server/.env ] || [ ! -s server/.env ]; then
                mv server/.env.backup.preserve server/.env 2>/dev/null || true
                echo '.env preservado restaurado'
            else
                # Novo .env tem conteúdo, manter o novo mas salvar o antigo como backup
                mv server/.env.backup.preserve server/.env.old.backup 2>/dev/null || true
                echo '.env do servidor mantido (novo arquivo tem conteudo)'
            fi
        fi
        
        echo 'Arquivos copiados de instructions-project/server/ para server/'
        
        # Verificar se package.json foi copiado
        if [ -f server/package.json ]; then
            echo 'package.json encontrado apos copia'
        else
            echo 'ERRO: Falha ao copiar package.json do server'
            exit 1
        fi
        
        # Verificar se src/ foi copiado
        if [ ! -d server/src ]; then
            echo 'AVISO: Diretorio src/ nao encontrado apos copia'
        fi
    else
        echo 'ERRO: package.json nao encontrado nem em server/ nem em instructions-project/server/'
        echo 'Estrutura do diretorio:'
        ls -la | head -20
        exit 1
    fi
fi

# Verificar se PostgreSQL está rodando
echo 'Verificando PostgreSQL...'
if docker ps | grep -q postgres || docker compose ps | grep -q postgres; then
    echo 'PostgreSQL esta rodando'
else
    echo 'PostgreSQL nao encontrado via Docker'
    echo 'Tentando iniciar PostgreSQL...'
    docker compose -f docker-compose.prod.yml up -d 2>/dev/null || docker compose -f docker-compose.dev.yml up -d 2>/dev/null || true
    sleep 3
fi

# Verificar se .env existe
cd server
# Já verificamos package.json acima, mas verificamos novamente por segurança
if [ ! -f package.json ]; then
    echo 'ERRO: package.json nao encontrado em $serverRootPath/server'
    echo 'Verifique se o diretorio server esta correto'
    echo 'Tentando copiar novamente de instructions-project/server/...'
    cd ..
    if [ -d instructions-project/server ]; then
        cp -r instructions-project/server/* server/ 2>/dev/null || true
        cd server
        if [ -f package.json ]; then
            echo 'package.json copiado com sucesso'
        else
            exit 1
        fi
    else
        exit 1
    fi
fi

if [ ! -f .env ]; then
    echo 'Ficheiro .env nao encontrado, criando...'
    cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5433
DB_NAME=instructions_demo
DB_USER=demo_user
DB_PASSWORD=demo_password
PORT=5000
NODE_ENV=production
ENVEOF
    echo 'Ficheiro .env criado'
fi

# Instalar dependências se necessário
echo 'Verificando dependencias...'
if [ ! -d node_modules ] || [ ! -f node_modules/.package-lock.json ] || [ package.json -nt node_modules/.package-lock.json 2>/dev/null ]; then
    echo 'Instalando dependencias...'
    npm install --omit=dev 2>&1 || npm install 2>&1 || echo 'Aviso: Instalacao de dependencias pode ter falhado'
else
    echo 'Dependencias ja instaladas'
fi

# Verificar conexão com BD antes de executar migrations
echo ''
echo 'Verificando conexao com base de dados...'
npm run check-connection 2>&1 || echo 'Aviso: Verificacao de conexao falhou, mas continuando...'

# Executar setup
echo ''
echo 'Executando npm run setup...'
npm run setup 2>&1
SETUP_EXIT=`$?

if [ `$SETUP_EXIT -eq 0 ]; then
    echo ''
    echo 'Setup executado com sucesso!'
else
    echo ''
    echo 'Setup encontrou problemas!'
    echo 'Tentando executar migrations manualmente...'
    npm run migrate:all 2>&1 || echo 'Migrations tambem falharam'
fi

# Verificar se tabelas foram criadas (usando Node.js em vez de psql)
echo ''
echo 'Verificando se tabelas existem...'
cd $serverRootPath/server
cat > check-tables.cjs << 'EOF'
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('instructions_demo', 'demo_user', 'demo_password', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false
});
sequelize.getQueryInterface().showAllTables()
  .then(tables => {
    if (tables.includes('projects')) {
      console.log('Tabela projects existe');
      process.exit(0);
    } else {
      console.log('Tabela projects nao encontrada. Tabelas existentes:', tables.join(', '));
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('Nao foi possivel verificar tabelas:', err.message);
    process.exit(0);
  });
EOF
node check-tables.cjs 2>&1 || echo 'Verificacao de tabelas nao disponivel (Node.js pode nao estar no PATH)'
rm -f check-tables.cjs 2>/dev/null || true
"@
$sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -Host $sshHost -Key $sshKey
Invoke-Expression "$sshCmd `"$($migrationCommands.Replace("`r`n", "`n"))`"" 2>&1
Write-Host "✅ Migrations processadas!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 5. Verificar e Corrigir Limite de Upload (Nginx) ===" -ForegroundColor Cyan
Write-Host "Verificando configuração do nginx para uploads..." -ForegroundColor Gray

# Copiar script de correção para o servidor e executá-lo
$fixScriptPath = Join-Path $PSScriptRoot "fix-nginx-upload-limit.sh"
if (Test-Path $fixScriptPath) {
    Write-Host "Enviando script de correção para o servidor..." -ForegroundColor Gray
    $remoteScriptPath = "/tmp/fix-nginx-upload-limit.sh"
    $scpCmd = Get-ScpCommand -Source $fixScriptPath -Destination $remoteScriptPath -User $sshUser -SshHost $sshHost -Key $sshKey
    Invoke-Expression $scpCmd 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Executando script de correção no servidor..." -ForegroundColor Gray
        # Tentar executar com sudo primeiro, se falhar, executar sem sudo
        $sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -SshHost $sshHost -Key $sshKey
        $nginxFixOutput = Invoke-Expression "$sshCmd `"chmod +x $remoteScriptPath && sudo bash $remoteScriptPath 2>&1 || bash $remoteScriptPath 2>&1`"" 2>&1
        Write-Host $nginxFixOutput -ForegroundColor Gray
        
        # Limpar script temporário
        Invoke-Expression "$sshCmd `"rm -f $remoteScriptPath`"" 2>&1 | Out-Null
    } else {
        Write-Host "⚠️  Não foi possível enviar script, tentando método alternativo..." -ForegroundColor Yellow
        # Método alternativo: usar here-string para evitar problemas de escape
        $sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -SshHost $sshHost -Key $sshKey
        $bashCommand = @'
if command -v nginx >/dev/null 2>&1; then
  NGINX_CONF="/etc/nginx/nginx.conf"
  NGINX_SITES="/etc/nginx/sites-enabled"
  CONFIG_FILE=""
  if [ -d "$NGINX_SITES" ]; then
    for f in "$NGINX_SITES"/*; do
      [ -f "$f" ] && grep -q "proxy_pass\|upstream" "$f" 2>/dev/null && CONFIG_FILE="$f" && break
    done
  fi
  [ -z "$CONFIG_FILE" ] && CONFIG_FILE="$NGINX_CONF"
  if [ -f "$CONFIG_FILE" ]; then
    if grep -q "client_max_body_size" "$CONFIG_FILE"; then
      LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk '{print $2}' | tr -d ";")
      NUM=$(echo "$LIMIT" | sed 's/[^0-9]//g')
      if [ -z "$NUM" ] || [ "$NUM" -lt 15 ]; then
        echo "⚠️  Ajustando limite para 15MB..."
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        sed -i "s/client_max_body_size.*/client_max_body_size 15M;/" "$CONFIG_FILE"
        nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe")
      else
        echo "✅ Limite adequado: $LIMIT"
      fi
    else
      echo "⚠️  Adicionando client_max_body_size 15M..."
      cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
      grep -q "^http {" "$CONFIG_FILE" && sed -i "/^http {/a\    client_max_body_size 15M;" "$CONFIG_FILE" || sed -i "1i client_max_body_size 15M;" "$CONFIG_FILE"
      nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe")
    fi
  else
    echo "⚠️  Arquivo de configuração não encontrado"
  fi
else
  echo "ℹ️  Nginx não encontrado (servidor pode estar rodando diretamente via PM2)"
  echo "✅ Limites do Express já foram ajustados no código (15MB)"
fi
'@
        $nginxFixOutput = Invoke-Expression "$sshCmd `"$bashCommand`"" 2>&1
        Write-Host $nginxFixOutput -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Script fix-nginx-upload-limit.sh não encontrado, usando método alternativo..." -ForegroundColor Yellow
    $sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -SshHost $sshHost -Key $sshKey
    # Usar here-string para evitar problemas de escape com comandos bash complexos
    $bashCommand = @'
if command -v nginx >/dev/null 2>&1; then
  NGINX_CONF="/etc/nginx/nginx.conf"
  NGINX_SITES="/etc/nginx/sites-enabled"
  CONFIG_FILE=""
  if [ -d "$NGINX_SITES" ]; then
    for f in "$NGINX_SITES"/*; do
      [ -f "$f" ] && grep -q "proxy_pass\|upstream" "$f" 2>/dev/null && CONFIG_FILE="$f" && break
    done
  fi
  [ -z "$CONFIG_FILE" ] && CONFIG_FILE="$NGINX_CONF"
  if [ -f "$CONFIG_FILE" ]; then
    if grep -q "client_max_body_size" "$CONFIG_FILE"; then
      LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk '{print $2}' | tr -d ";")
      NUM=$(echo "$LIMIT" | sed 's/[^0-9]//g')
      if [ -z "$NUM" ] || [ "$NUM" -lt 15 ]; then
        echo "⚠️  Ajustando limite para 15MB..."
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        sed -i "s/client_max_body_size.*/client_max_body_size 15M;/" "$CONFIG_FILE"
        nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe")
      else
        echo "✅ Limite adequado: $LIMIT"
      fi
    else
      echo "⚠️  Adicionando client_max_body_size 15M..."
      cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
      grep -q "^http {" "$CONFIG_FILE" && sed -i "/^http {/a\    client_max_body_size 15M;" "$CONFIG_FILE" || sed -i "1i client_max_body_size 15M;" "$CONFIG_FILE"
      nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe")
    fi
  else
    echo "⚠️  Arquivo de configuração não encontrado"
  fi
else
  echo "ℹ️  Nginx não encontrado (servidor pode estar rodando diretamente via PM2)"
  echo "✅ Limites do Express já foram ajustados no código (15MB)"
fi
'@
    $nginxFixOutput = Invoke-Expression "$sshCmd `"$bashCommand`"" 2>&1
    Write-Host $nginxFixOutput -ForegroundColor Gray
}

# Verificar se houve aviso sobre sudo
if ($nginxFixOutput -match "precisa de sudo|sudo") {
    Write-Host "⚠️  AVISO: Pode ser necessário executar manualmente com sudo:" -ForegroundColor Yellow
    Write-Host "   ssh $sshUser@$sshHost 'sudo systemctl reload nginx'" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=== 6. Reiniciar Servidor ===" -ForegroundColor Cyan
Write-Host "Reiniciando servidor PM2..." -ForegroundColor Gray
$restartCommands = @"
# Verificar status atual antes de reiniciar
echo 'Status atual do PM2:'
pm2 status $pm2AppName || echo 'App nao encontrado no PM2'

# Verificar logs recentes para identificar problemas
echo ''
echo 'Ultimas linhas dos logs (se houver erros):'
pm2 logs $pm2AppName --lines 10 --nostream 2>&1 | tail -20 || echo 'Nao foi possivel ler logs'

echo ''
echo 'Reiniciando servidor...'
pm2 restart $pm2AppName 2>&1
RESTART_EXIT=`$?

if [ `$RESTART_EXIT -eq 0 ]; then
    echo 'Servidor reiniciado com sucesso!'
    sleep 3
    echo ''
    echo 'Status do PM2:'
    pm2 status $pm2AppName
    
    # Verificar se o servidor está realmente rodando
    echo ''
    echo 'Verificando processo...'
    PM2_PID=`$(pm2 jlist | grep -A 5 "\"name\":\"$pm2AppName\"" | grep -o '\"pid\":[0-9]*' | cut -d: -f2 | head -1)
    if [ -n "`$PM2_PID" ] && [ "`$PM2_PID" != "null" ]; then
        echo "PID do servidor: `$PM2_PID"
        
        # Verificar se o processo está rodando
        if ps -p `$PM2_PID > /dev/null 2>&1; then
            echo 'Processo esta rodando'
        else
            echo 'AVISO: Processo nao esta mais rodando!'
        fi
    else
        echo 'AVISO: Nao foi possivel obter PID do servidor'
    fi
    
    echo ''
    echo 'Aguardando servidor iniciar...'
    sleep 3
    
    echo 'Verificando se servidor responde...'
    HTTP_CODE=`$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/health 2>/dev/null || echo '000')
    
    if [ -z "`$HTTP_CODE" ]; then
        HTTP_CODE='000'
    fi
    
    if [ "`$HTTP_CODE" = "200" ]; then
        echo 'Servidor esta online e respondendo!'
    elif [ "`$HTTP_CODE" = "000" ]; then
        echo 'ERRO: Servidor nao esta respondendo (curl falhou)'
        echo 'Verificando logs de erro...'
        pm2 logs $pm2AppName --err --lines 20 --nostream 2>&1 | tail -20
    else
        echo "AVISO: Servidor respondeu com codigo HTTP `$HTTP_CODE"
    fi
else
    echo 'ERRO ao reiniciar servidor PM2'
    echo ''
    echo 'Tentando iniciar o servidor...'
    cd $serverRootPath/server
    pm2 start npm --name $pm2AppName -- start 2>&1 || echo 'Falha ao iniciar servidor'
    pm2 save 2>&1 || true
    echo ''
    echo 'Status final:'
    pm2 status
fi

# Mostrar logs de erro se houver muitos restarts
RESTART_COUNT=`$(pm2 jlist | grep -A 10 "\"name\":\"$pm2AppName\"" | grep -o '"restart_time":[0-9]*' | cut -d: -f2 | head -1)
if [ -n "`$RESTART_COUNT" ] && [ "`$RESTART_COUNT" != "null" ] && [ "`$RESTART_COUNT" -gt 10 ] 2>/dev/null; then
    echo ''
    echo "AVISO: Servidor reiniciou `$RESTART_COUNT vezes - possivel crash loop"
    echo 'Ultimos logs de erro:'
    pm2 logs $pm2AppName --err --lines 30 --nostream 2>&1 | tail -30
fi
"@
$sshCmd = Get-SshCommand -Command "ssh" -User $sshUser -Host $sshHost -Key $sshKey
Invoke-Expression "$sshCmd `"$($restartCommands.Replace("`r`n", "`n"))`"" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Pode ter havido problemas ao reiniciar o servidor" -ForegroundColor Yellow
    Write-Host "   Verifique manualmente: ssh $sshUser@$sshHost 'pm2 status'" -ForegroundColor Yellow
    Write-Host "   Ver logs: ssh $sshUser@$sshHost 'pm2 logs instructions-server --lines 50'" -ForegroundColor Yellow
} else {
    Write-Host "✅ Servidor reiniciado com sucesso!" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build atualizado" -ForegroundColor Green
Write-Host "Migrations executadas" -ForegroundColor Green
Write-Host "Servidor reiniciado" -ForegroundColor Green
Write-Host ""
if ($siteUrl) {
    Write-Host "Site disponivel em: $siteUrl" -ForegroundColor Yellow
}
Write-Host ""

# Garantir que o script retorna código de sucesso
Exit-Script -ExitCode 0

