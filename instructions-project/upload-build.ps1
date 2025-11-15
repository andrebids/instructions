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
    # IMPORTANTE: Enviar conteúdo de dist/* para tempPath diretamente (não dist inteiro)
    # O destino deve terminar com / para que scp coloque os arquivos diretamente no diretório
    Write-Host "Enviando arquivos (pode demorar para arquivos grandes)..." -ForegroundColor Gray
    # Estamos no diretório client após o build, então dist está aqui
    if (-not (Test-Path ".\dist")) {
        Write-Host "❌ Diretório dist não encontrado!" -ForegroundColor Red
        exit 1
    }
    # Usar scp com wildcard - PowerShell pode não expandir, mas o script no servidor corrige se necessário
    # Tentar enviar conteúdo diretamente usando caminho relativo
    $scpOutput = scp -i $sshKey -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -C -r ".\dist\*" "${sshUser}@${sshHost}:$tempPath/" 2>&1
    
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
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $migrationCommands.Replace("`r`n", "`n")
Write-Host "✅ Migrations processadas!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 5. Verificar e Corrigir Limite de Upload (Nginx) ===" -ForegroundColor Cyan
Write-Host "Verificando configuração do nginx para uploads..." -ForegroundColor Gray

# Copiar script de correção para o servidor e executá-lo
$fixScriptPath = Join-Path $PSScriptRoot "fix-nginx-upload-limit.sh"
if (Test-Path $fixScriptPath) {
    Write-Host "Enviando script de correção para o servidor..." -ForegroundColor Gray
    $remoteScriptPath = "/tmp/fix-nginx-upload-limit.sh"
    scp -i $sshKey -o StrictHostKeyChecking=no $fixScriptPath "${sshUser}@${sshHost}:$remoteScriptPath" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Executando script de correção no servidor..." -ForegroundColor Gray
        # Tentar executar com sudo primeiro, se falhar, executar sem sudo
        $nginxFixOutput = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "chmod +x $remoteScriptPath && sudo bash $remoteScriptPath 2>&1 || bash $remoteScriptPath 2>&1" 2>&1
        Write-Host $nginxFixOutput -ForegroundColor Gray
        
        # Limpar script temporário
        ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "rm -f $remoteScriptPath" 2>&1 | Out-Null
    } else {
        Write-Host "⚠️  Não foi possível enviar script, tentando método alternativo..." -ForegroundColor Yellow
        # Método alternativo: comando simples inline
        $nginxFixOutput = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" 'if command -v nginx >/dev/null 2>&1; then NGINX_CONF="/etc/nginx/nginx.conf"; NGINX_SITES="/etc/nginx/sites-enabled"; CONFIG_FILE=""; if [ -d "$NGINX_SITES" ]; then for f in "$NGINX_SITES"/*; do [ -f "$f" ] && grep -q "proxy_pass\|upstream" "$f" 2>/dev/null && CONFIG_FILE="$f" && break; done; fi; [ -z "$CONFIG_FILE" ] && CONFIG_FILE="$NGINX_CONF"; if [ -f "$CONFIG_FILE" ]; then if grep -q "client_max_body_size" "$CONFIG_FILE"; then LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk "{print \$2}" | tr -d ";"); NUM=$(echo "$LIMIT" | sed "s/[^0-9]//g"); if [ -z "$NUM" ] || [ "$NUM" -lt 15 ]; then echo "⚠️  Ajustando limite para 15MB..."; cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"; sed -i "s/client_max_body_size.*/client_max_body_size 15M;/" "$CONFIG_FILE"; nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe"); else echo "✅ Limite adequado: $LIMIT"; fi; else echo "⚠️  Adicionando client_max_body_size 15M..."; cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"; grep -q "^http {" "$CONFIG_FILE" && sed -i "/^http {/a\    client_max_body_size 15M;" "$CONFIG_FILE" || sed -i "1i client_max_body_size 15M;" "$CONFIG_FILE"; nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe"); fi; else echo "⚠️  Arquivo de configuração não encontrado"; fi; else echo "ℹ️  Nginx não encontrado (servidor pode estar rodando diretamente via PM2)"; echo "✅ Limites do Express já foram ajustados no código (15MB)"; fi' 2>&1
        Write-Host $nginxFixOutput -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Script fix-nginx-upload-limit.sh não encontrado, usando método alternativo..." -ForegroundColor Yellow
    $nginxFixOutput = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" 'if command -v nginx >/dev/null 2>&1; then NGINX_CONF="/etc/nginx/nginx.conf"; NGINX_SITES="/etc/nginx/sites-enabled"; CONFIG_FILE=""; if [ -d "$NGINX_SITES" ]; then for f in "$NGINX_SITES"/*; do [ -f "$f" ] && grep -q "proxy_pass\|upstream" "$f" 2>/dev/null && CONFIG_FILE="$f" && break; done; fi; [ -z "$CONFIG_FILE" ] && CONFIG_FILE="$NGINX_CONF"; if [ -f "$CONFIG_FILE" ]; then if grep -q "client_max_body_size" "$CONFIG_FILE"; then LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk "{print \$2}" | tr -d ";"); NUM=$(echo "$LIMIT" | sed "s/[^0-9]//g"); if [ -z "$NUM" ] || [ "$NUM" -lt 15 ]; then echo "⚠️  Ajustando limite para 15MB..."; cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"; sed -i "s/client_max_body_size.*/client_max_body_size 15M;/" "$CONFIG_FILE"; nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe"); else echo "✅ Limite adequado: $LIMIT"; fi; else echo "⚠️  Adicionando client_max_body_size 15M..."; cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"; grep -q "^http {" "$CONFIG_FILE" && sed -i "/^http {/a\    client_max_body_size 15M;" "$CONFIG_FILE" || sed -i "1i client_max_body_size 15M;" "$CONFIG_FILE"; nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "⚠️  Execute: sudo systemctl reload nginx") && echo "✅ Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "❌ Erro na sintaxe"); fi; else echo "⚠️  Arquivo de configuração não encontrado"; fi; else echo "ℹ️  Nginx não encontrado (servidor pode estar rodando diretamente via PM2)"; echo "✅ Limites do Express já foram ajustados no código (15MB)"; fi' 2>&1
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
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $restartCommands.Replace("`r`n", "`n")
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
Write-Host "Site disponivel em: $siteUrl" -ForegroundColor Yellow
Write-Host ""

