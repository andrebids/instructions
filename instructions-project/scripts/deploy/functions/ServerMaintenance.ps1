# ServerMaintenance.ps1
# Funções de limpeza e verificação de espaço no servidor

# Função para limpar espaço no servidor de forma agressiva
function Invoke-ServerCleanup {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerPath,
        [int]$RequiredSpaceMB = 500
    )
    
    # Normalizar caminho removendo caracteres de retorno de linha
    $ServerPath = ($ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    
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
        $cleanupOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $cleanupCommands
        Write-Host $cleanupOutput -ForegroundColor Gray
        
        # Verificar espaço após limpeza
        $diskLine = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "df -BM /tmp 2>/dev/null | tail -1 || df -BM / | tail -1"
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
        $diskLine = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "df -BM /tmp 2>/dev/null | tail -1 || df -BM / | tail -1"
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

