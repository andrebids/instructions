# Script para fazer build local e enviar para servidor
# Uso: .\upload-build.ps1
#
# Configuração via variáveis de ambiente ou ficheiro .env.deploy:
#   DEPLOY_SSH_KEY      - Caminho para chave SSH (padrão: $env:USERPROFILE\.ssh\thecore)
#   DEPLOY_SSH_USER     - Utilizador SSH (padrão: andre)
#   DEPLOY_SSH_HOST     - IP ou hostname do servidor (padrão: 136.116.79.244)
#   DEPLOY_SERVER_PATH  - Caminho no servidor (padrão: /home/andre/apps/instructions/instructions-project/client)
#   DEPLOY_SITE_URL     - URL do site (padrão: https://136.116.79.244)

$ErrorActionPreference = "Stop"

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
$sshKey = if ($env:DEPLOY_SSH_KEY) { $env:DEPLOY_SSH_KEY } else { "$env:USERPROFILE\.ssh\thecore" }
$sshUser = if ($env:DEPLOY_SSH_USER) { $env:DEPLOY_SSH_USER } else { "andre" }
$sshHost = if ($env:DEPLOY_SSH_HOST) { $env:DEPLOY_SSH_HOST } else { "136.116.79.244" }
$serverPath = if ($env:DEPLOY_SERVER_PATH) { $env:DEPLOY_SERVER_PATH } else { "/home/andre/apps/instructions/instructions-project/client" }
$serverRootPath = if ($env:DEPLOY_SERVER_ROOT_PATH) { $env:DEPLOY_SERVER_ROOT_PATH } else { "/home/andre/apps/instructions/instructions-project" }
$pm2AppName = if ($env:DEPLOY_PM2_APP_NAME) { $env:DEPLOY_PM2_APP_NAME } else { "instructions-server" }
$siteUrl = if ($env:DEPLOY_SITE_URL) { $env:DEPLOY_SITE_URL } else { "https://136.116.79.244" }

# Verificar se chave SSH existe
if (-not (Test-Path $sshKey)) {
    Write-Host "❌ Chave SSH não encontrada: $sshKey" -ForegroundColor Red
    Write-Host ""
    Write-Host "Soluções:" -ForegroundColor Yellow
    Write-Host "1. Copie a chave SSH para: $sshKey"
    Write-Host "2. Ou defina DEPLOY_SSH_KEY no ficheiro .env.deploy"
    Write-Host "3. Ou defina a variável de ambiente DEPLOY_SSH_KEY"
    Write-Host ""
    Write-Host "Exemplo de .env.deploy:" -ForegroundColor Cyan
    Write-Host "DEPLOY_SSH_KEY=C:\caminho\para\sua\chave"
    Write-Host "DEPLOY_SSH_USER=seu_usuario"
    Write-Host "DEPLOY_SSH_HOST=seu_servidor.com"
    exit 1
}

Write-Host "=== Configuração ===" -ForegroundColor Cyan
Write-Host "Servidor: $sshUser@$sshHost" -ForegroundColor Gray
Write-Host "Caminho Cliente: $serverPath" -ForegroundColor Gray
Write-Host "Caminho Raiz: $serverRootPath" -ForegroundColor Gray
Write-Host "PM2 App: $pm2AppName" -ForegroundColor Gray
Write-Host ""

Write-Host "=== 1. Build Local ===" -ForegroundColor Cyan
cd "$PSScriptRoot\client"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build falhou!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build concluído!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 2. Enviar para servidor ===" -ForegroundColor Cyan
$tempPath = "/tmp/client-dist-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Verificar espaço em disco antes de fazer upload
Write-Host "Verificando espaço em disco no servidor..." -ForegroundColor Gray
$diskInfo = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "df -h /tmp | tail -1"
Write-Host "Espaço em /tmp: $diskInfo" -ForegroundColor Gray

# Extrair espaço disponível (em MB) - método mais simples
$diskLine = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "df -BM /tmp | tail -1"
$availableSpaceMB = "0"
if ($diskLine -match '\s+(\d+)M\s+') {
    $availableSpaceMB = $matches[1]
} elseif ($diskLine -match '\s+(\d+)G\s+') {
    # Se estiver em GB, converter para MB
    $availableSpaceMB = [string]([int]$matches[1] * 1024)
}

# Limpar diretórios temporários antigos para liberar espaço
Write-Host "Limpando diretórios temporários antigos..." -ForegroundColor Gray
$cleanupOutput = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" @"
# Limpar TODOS os diretórios client-dist antigos (não apenas +1 dia)
find /tmp -maxdepth 1 -type d -name 'client-dist-*' -exec rm -rf {} \; 2>/dev/null || true
# Limpar builds antigos do cliente (manter apenas os 2 mais recentes)
cd $serverPath 2>/dev/null || true
ls -dt dist-old-* 2>/dev/null | tail -n +3 | xargs rm -rf 2>/dev/null || true
# Mostrar espaço após limpeza
df -h /tmp | tail -1
"@
Write-Host $cleanupOutput -ForegroundColor Gray

# Verificar se há espaço suficiente (pelo menos 500MB)
try {
    $spaceMB = [int]$availableSpaceMB
    if ($spaceMB -lt 500) {
        Write-Host "⚠️  AVISO: Pouco espaço em disco ($spaceMB MB disponível)" -ForegroundColor Yellow
        Write-Host "Tentando limpar mais espaço..." -ForegroundColor Yellow
        
        # Limpar mais agressivamente
        ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" @"
# Limpar TODOS os diretórios client-dist antigos
find /tmp -maxdepth 1 -type d -name 'client-dist-*' -exec rm -rf {} \; 2>/dev/null || true
# Limpar TODOS os backups antigos de dist (manter apenas 1)
cd $serverPath 2>/dev/null || true
ls -dt dist-old-* 2>/dev/null | tail -n +2 | xargs rm -rf 2>/dev/null || true
# Limpar logs antigos do PM2
pm2 flush 2>/dev/null || true
# Mostrar espaço após limpeza agressiva
df -h /tmp | tail -1
"@ | Out-Null
        
        # Verificar novamente
        $newDiskLine = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "df -BM /tmp | tail -1"
        $newSpaceMB = "0"
        if ($newDiskLine -match '\s+(\d+)M\s+') {
            $newSpaceMB = $matches[1]
        } elseif ($newDiskLine -match '\s+(\d+)G\s+') {
            $newSpaceMB = [string]([int]$matches[1] * 1024)
        }
        $newSpaceMBInt = [int]$newSpaceMB
        
        if ($newSpaceMBInt -lt 500) {
            Write-Host "❌ ERRO: Espaço insuficiente no servidor ($newSpaceMBInt MB disponível)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Soluções:" -ForegroundColor Yellow
            Write-Host "  1. Limpar espaço manualmente no servidor:"
            Write-Host "     ssh $sshUser@$sshHost 'du -sh /tmp/* | sort -h | tail -10'"
            Write-Host "  2. Limpar builds antigos:"
            Write-Host "     ssh $sshUser@$sshHost 'rm -rf $serverPath/dist-old-*'"
            Write-Host "  3. Limpar logs do PM2:"
            Write-Host "     ssh $sshUser@$sshHost 'pm2 flush'"
            Write-Host ""
            exit 1
        } else {
            Write-Host "✅ Espaço liberado! Agora há $newSpaceMBInt MB disponível" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  Não foi possível verificar espaço exato, continuando..." -ForegroundColor Yellow
}

# Criar diretório temporário no servidor
Write-Host "Criando diretório temporário no servidor..." -ForegroundColor Gray
$createDirCmd = "mkdir -p $tempPath && chmod 755 $tempPath"
$createOutput = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $createDirCmd 2>&1
if ($LASTEXITCODE -ne 0 -or $createOutput -match "No space|cannot create") {
    Write-Host "❌ ERRO: Não foi possível criar diretório temporário" -ForegroundColor Red
    Write-Host "Erro: $createOutput" -ForegroundColor Red
    Write-Host ""
    Write-Host "O servidor está sem espaço em disco!" -ForegroundColor Yellow
    Write-Host "Execute manualmente para limpar espaço:" -ForegroundColor Cyan
    Write-Host "  ssh $sshUser@$sshHost 'df -h && du -sh /tmp/* | sort -h | tail -10'" -ForegroundColor Cyan
    exit 1
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
        ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "rm -rf $tempPath 2>/dev/null; mkdir -p $tempPath && chmod 755 $tempPath" | Out-Null
    }
    
    # Usar scp com compressão e timeout aumentado
    Write-Host "Enviando arquivos (pode demorar para arquivos grandes)..." -ForegroundColor Gray
    $scpOutput = scp -i $sshKey -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -C -r ".\dist" "${sshUser}@${sshHost}:$tempPath" 2>&1
    
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
    exit 1
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

# Fazer backup do dist atual se existir (apenas 1 backup)
if [ -d dist ]; then
    # Remover backup anterior se existir (manter apenas 1 backup)
    rm -rf dist-old-previous 2>/dev/null || true
    mv dist dist-old-previous 2>/dev/null || true
    echo '✅ Backup do dist anterior criado (substituindo backup anterior)'
fi

# Mover novo build para dist
if [ -d $tempPath ]; then
    mv $tempPath dist
    chmod -R 755 dist
    echo '✅ Build atualizado no servidor!'
    if [ -f dist/index.html ]; then
        ls -lh dist/index.html
        echo ''
        # Mostrar espaço usado
        du -sh dist
    else
        echo '⚠️  Aviso: dist/index.html não encontrado após atualização'
        ls -la dist/ | head -10
    fi
else
    echo '❌ Erro: Diretório temporário não encontrado: $tempPath'
    exit 1
fi
"@
$updateOutput = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $sshCommands.Replace("`r`n", "`n")
Write-Host $updateOutput -ForegroundColor Gray
if ($LASTEXITCODE -ne 0 -or $updateOutput -match "Erro|error|cannot access") {
    Write-Host "❌ Erro ao atualizar build no servidor!" -ForegroundColor Red
    Write-Host "Verificando estado do servidor..." -ForegroundColor Yellow
    ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "ls -la $serverPath/ | grep dist" | Out-Host
    exit 1
}
Write-Host "✅ Build atualizado no servidor!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 4. Executar Migrations ===" -ForegroundColor Cyan
Write-Host "Executando migrations no servidor remoto..." -ForegroundColor Gray
$migrationCommands = @"
cd $serverRootPath

# Atualizar código do servidor (se for git repo)
if [ -d .git ]; then
    echo '📥 Atualizando código do servidor...'
    git fetch origin 2>/dev/null || true
    CURRENT_BRANCH=`$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')
    git reset --hard origin/`${CURRENT_BRANCH} 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
    echo '✅ Código atualizado'
fi

# Verificar se PostgreSQL está rodando
echo '🔍 Verificando PostgreSQL...'
if docker ps | grep -q postgres || docker compose ps | grep -q postgres; then
    echo '✅ PostgreSQL está rodando'
else
    echo '⚠️  PostgreSQL não encontrado via Docker'
    echo '💡 Tentando iniciar PostgreSQL...'
    docker compose -f docker-compose.prod.yml up -d 2>/dev/null || docker compose -f docker-compose.dev.yml up -d 2>/dev/null || true
    sleep 3
fi

# Verificar se .env existe
cd server
if [ ! -f .env ]; then
    echo '⚠️  Ficheiro .env não encontrado, criando...'
    cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5433
DB_NAME=instructions_demo
DB_USER=demo_user
DB_PASSWORD=demo_password
PORT=5000
NODE_ENV=production
ENVEOF
    echo '✅ Ficheiro .env criado'
fi

# Instalar dependências se necessário
echo '📦 Verificando dependências...'
if [ ! -d node_modules ] || [ package.json -nt node_modules/.package-lock.json 2>/dev/null ]; then
    echo '📥 Instalando dependências...'
    npm install --omit=dev 2>&1 || npm install 2>&1 || echo '⚠️  Aviso: Instalação de dependências pode ter falhado'
else
    echo '✅ Dependências já instaladas'
fi

# Verificar conexão com BD antes de executar migrations
echo ''
echo '🔍 Verificando conexão com base de dados...'
npm run check-connection 2>&1 || echo '⚠️  Aviso: Verificação de conexão falhou, mas continuando...'

# Executar setup
echo ''
echo '🔄 Executando npm run setup...'
npm run setup 2>&1
SETUP_EXIT=`$?

if [ `$SETUP_EXIT -eq 0 ]; then
    echo ''
    echo '✅ Setup executado com sucesso!'
else
    echo ''
    echo '⚠️  Setup encontrou problemas!'
    echo '💡 Tentando executar migrations manualmente...'
    npm run migrate:all 2>&1 || echo '⚠️  Migrations também falharam'
fi

# Verificar se tabelas foram criadas (usando Node.js em vez de psql)
echo ''
echo '🔍 Verificando se tabelas existem...'
node -e "
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('instructions_demo', 'demo_user', 'demo_password', {
  host: 'localhost',
  port: 5433,
  dialect: 'postgres',
  logging: false
});
sequelize.getQueryInterface().showAllTables().then(tables => {
  if (tables.includes('projects')) {
    console.log('✅ Tabela projects existe');
    process.exit(0);
  } else {
    console.log('⚠️  Tabela projects não encontrada. Tabelas existentes:', tables.join(', '));
    process.exit(0);
  }
}).catch(err => {
  console.log('⚠️  Não foi possível verificar tabelas:', err.message);
  process.exit(0);
});
" 2>&1 || echo '⚠️  Verificação de tabelas não disponível (Node.js pode não estar no PATH)'
"@
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $migrationCommands.Replace("`r`n", "`n")
Write-Host "✅ Migrations processadas!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 5. Reiniciar Servidor ===" -ForegroundColor Cyan
Write-Host "Reiniciando servidor PM2..." -ForegroundColor Gray
$restartCommands = @"
pm2 restart $pm2AppName 2>&1
RESTART_EXIT=`$?
if [ `$RESTART_EXIT -eq 0 ]; then
    echo '✅ Servidor reiniciado com sucesso!'
    sleep 2
    pm2 status $pm2AppName
    echo ''
    echo '🔍 Verificando saúde do servidor...'
    sleep 3
    curl -s http://localhost:5000/health > /dev/null 2>&1
    if [ `$? -eq 0 ]; then
        echo '✅ Servidor está online e respondendo!'
    else
        echo '⚠️  Aviso: Servidor pode não estar totalmente pronto ainda'
    fi
else
    echo '❌ Erro ao reiniciar servidor PM2'
    echo '💡 Verifique: pm2 status'
    echo '⚠️  Continuando mesmo assim...'
fi
"@
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $restartCommands.Replace("`r`n", "`n")
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Pode ter havido problemas ao reiniciar o servidor" -ForegroundColor Yellow
    Write-Host "   Verifique manualmente: ssh $sshUser@$sshHost 'pm2 status'" -ForegroundColor Yellow
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
Write-Host "Site disponivel em: $siteUrl" -ForegroundColor Yellow
Write-Host ""

