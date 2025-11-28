# ServerUpdate.ps1
# Atualização do build no servidor

function Update-ServerBuild {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerPath,
        [string]$TempPath
    )
    
    # Normalizar caminhos removendo caracteres de retorno de linha
    $ServerPath = ($ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    $TempPath = ($TempPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    
    # Verificar se TempPath foi fornecido
    if ([string]::IsNullOrWhiteSpace($TempPath)) {
        Write-Host "[ERRO] TempPath está vazio ou não foi fornecido!" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    
    Write-Host "=== 3. Atualizar no servidor ===" -ForegroundColor Cyan
    
    # Debug: verificar valores recebidos
    Write-Host "[DEBUG] ServerPath recebido: '$ServerPath'" -ForegroundColor Gray
    Write-Host "[DEBUG] TempPath recebido: '$TempPath'" -ForegroundColor Gray
    Write-Host "[DEBUG] Comprimento ServerPath: $($ServerPath.Length)" -ForegroundColor Gray
    Write-Host "[DEBUG] Comprimento TempPath: $($TempPath.Length)" -ForegroundColor Gray
    
    # Construir comando bash usando variáveis bash para evitar problemas com \r
    # Garantir que ambos os caminhos não estão vazios antes de interpolar
    if ([string]::IsNullOrWhiteSpace($ServerPath)) {
        Write-Host "[ERRO] ServerPath está vazio! Não é possível continuar." -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    if ([string]::IsNullOrWhiteSpace($TempPath)) {
        Write-Host "[ERRO] TempPath está vazio! Não é possível continuar." -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    
    # Garantir que os caminhos estão normalizados (sem \r\n)
    $cleanServerPath = ($ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    $cleanTempPath = ($TempPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    
    Write-Host "[DEBUG] ServerPath limpo: '$cleanServerPath'" -ForegroundColor Gray
    Write-Host "[DEBUG] TempPath limpo: '$cleanTempPath'" -ForegroundColor Gray
    
    # Passar caminhos diretamente (Linux paths geralmente não têm aspas simples)
    # Usar interpolação do PowerShell dentro do here-string
    $sshCommands = @"
SERVER_PATH='$cleanServerPath'
TEMP_PATH='$cleanTempPath'
echo "[DEBUG] ServerPath original: '$SERVER_PATH'"
echo "[DEBUG] TempPath original: '$TEMP_PATH'"

# Validar e corrigir TEMP_PATH se necessário
if [ -z "`$TEMP_PATH" ] || [ ! -d "`$TEMP_PATH" ]; then
    echo "[AVISO] TEMP_PATH está vazio ou inválido ('`$TEMP_PATH'), procurando diretório temporário mais recente..."
    LATEST_TEMP=`$(ls -dt /tmp/client-dist-* 2>/dev/null | head -1)
    if [ -n "`$LATEST_TEMP" ] && [ -d "`$LATEST_TEMP" ]; then
        TEMP_PATH="`$LATEST_TEMP"
        echo "[INFO] Usando diretório temporário mais recente: `$TEMP_PATH"
    else
        echo "[ERRO] Não foi possível encontrar nenhum diretório temporário!"
        echo "[DEBUG] Listando /tmp para debug:"
        ls -la /tmp/client-dist-* 2>&1 | head -10 || echo 'Nenhum diretório /tmp/client-dist-* encontrado'
        exit 1
    fi
fi

echo "[DEBUG] TEMP_PATH final: '`$TEMP_PATH'"
echo "[DEBUG] Verificando se TEMP_PATH existe:"
if [ -d "`$TEMP_PATH" ]; then
    echo "[DEBUG] TEMP_PATH existe e é um diretório"
    ls -la "`$TEMP_PATH" | head -5
else
    echo "[ERRO] TEMP_PATH não é um diretório válido: '`$TEMP_PATH'"
    exit 1
fi

# Validar SERVER_PATH antes de fazer cd
if [ -z "`$SERVER_PATH" ]; then
    echo "[ERRO] SERVER_PATH está vazio! Não é possível continuar."
    exit 1
fi

echo "[DEBUG] SERVER_PATH: '`$SERVER_PATH'"
echo "[DEBUG] Verificando se SERVER_PATH existe:"
if [ ! -d "`$SERVER_PATH" ]; then
    echo "[ERRO] SERVER_PATH não é um diretório válido: '`$SERVER_PATH'"
    exit 1
fi

cd "`$SERVER_PATH" || {
    echo "[ERRO] Não foi possível fazer cd para SERVER_PATH: '`$SERVER_PATH'"
    exit 1
}
echo "[DEBUG] Mudado para diretório: `$(pwd)"

# Limpar backups antigos ANTES de criar novo (manter apenas os 2 mais recentes)
echo 'Limpando backups antigos (mantendo apenas os 2 mais recentes)...'
ls -dt dist-old-* 2>/dev/null | tail -n +3 | xargs rm -rf 2>/dev/null || true
BACKUP_COUNT=`$(ls -d dist-old-* 2>/dev/null | wc -l)
echo "Mantidos `$BACKUP_COUNT backups recentes"

# Mover novo build para dist
if [ -d "`$TEMP_PATH" ]; then
    # PASSO 1: Verificar e corrigir estrutura ANTES de mover
    # Se scp criou tempPath/dist (porque wildcard não expandiu), corrigir
    if [ -d "`$TEMP_PATH/dist" ]; then
        echo '[AVISO] Detectado estrutura incorreta (tempPath/dist), corrigindo...'
        # Mover conteúdo de tempPath/dist para tempPath (não criar duplicação)
        mv "`$TEMP_PATH/dist/"* "`$TEMP_PATH/" 2>/dev/null || true
        # Tentar mover ficheiros ocultos (pode falhar se não houver, ignorar erro)
        find "`$TEMP_PATH/dist" -maxdepth 1 -name '.*' -type f -exec mv {} "`$TEMP_PATH/" \; 2>/dev/null || true
        # Remover diretório dist vazio para evitar duplicação
        rmdir "`$TEMP_PATH/dist" 2>/dev/null || true
        echo '[OK] Estrutura corrigida (sem duplicação)'
    fi
    
    # PASSO 2: Verificar se index.html está no local correto (tempPath diretamente)
    if [ ! -f "`$TEMP_PATH/index.html" ] && [ -d "`$TEMP_PATH" ]; then
        echo '[AVISO] index.html não encontrado diretamente em tempPath, procurando...'
        find "`$TEMP_PATH" -name 'index.html' -type f | head -1
    fi
    
    # PASSO 3: Fazer backup do dist atual ANTES de substituir (apenas 1 backup)
    if [ -d dist ]; then
        rm -rf dist-old-previous 2>/dev/null || true
        mv dist dist-old-previous 2>/dev/null || true
        echo '[OK] Backup do dist anterior criado'
    fi
    
    # Mover tempPath para dist (agora garantidamente sem subdiretório dist)
    mv "`$TEMP_PATH" dist
    chmod -R 755 dist
    
    # Verificação final: garantir que não há dist/dist
    if [ -d dist/dist ]; then
        echo '[ERRO CRITICO] dist/dist ainda existe após correção!'
        echo 'Corrigindo manualmente...'
        mv dist/dist/* dist/ 2>/dev/null || true
        rmdir dist/dist 2>/dev/null || true
    fi
    
    echo '[OK] Build atualizado no servidor!'
    if [ -f dist/index.html ]; then
        ls -lh dist/index.html
        echo ''
        # Mostrar espaço usado
        du -sh dist
        echo ''
        echo '[OK] Verificação: index.html está no local correto (dist/index.html)'
    else
        echo '[ERRO] dist/index.html não encontrado após atualização'
        echo 'Conteúdo de dist:'
        ls -la dist/ | head -10
        exit 1
    fi
else
    echo '[ERRO] Erro: Diretório temporário não encontrado!'
    echo "[ERRO] TEMP_PATH: '`$TEMP_PATH'"
    echo '[DEBUG] Tentando listar /tmp para debug:'
    ls -la /tmp/client-dist-* 2>&1 || echo 'Nenhum diretório /tmp/client-dist-* encontrado'
    exit 1
fi
"@
    
    $updateOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $($sshCommands.Replace("`r`n", "`n"))
    Write-Host $updateOutput -ForegroundColor Gray
    if ($LASTEXITCODE -ne 0 -or $updateOutput -match "Erro|error|cannot access") {
        Write-Host "[ERRO] Erro ao atualizar build no servidor!" -ForegroundColor Red
        Write-Host "Verificando estado do servidor..." -ForegroundColor Yellow
        Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "ls -la $ServerPath/ | grep dist" | Out-Host
        Exit-Script -ExitCode 1
    }
    Write-Host "[OK] Build atualizado no servidor!" -ForegroundColor Green
    Write-Host ""
}

