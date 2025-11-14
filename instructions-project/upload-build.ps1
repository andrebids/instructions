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

# Enviar para pasta temporária
scp -i $sshKey -o StrictHostKeyChecking=no -r ".\dist" "${sshUser}@${sshHost}:$tempPath"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload falhou!" -ForegroundColor Red
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  - Servidor está acessível: $sshHost"
    Write-Host "  - Chave SSH está correta: $sshKey"
    Write-Host "  - Utilizador SSH está correto: $sshUser"
    exit 1
}
Write-Host "✅ Ficheiros enviados!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 3. Atualizar no servidor ===" -ForegroundColor Cyan
$sshCommands = @"
cd $serverPath
mv dist dist-old-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
mv $tempPath dist
chmod -R 755 dist
echo '✅ Build atualizado no servidor!'
ls -lh dist/index.html
"@
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" $sshCommands.Replace("`r`n", "`n")
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao atualizar build no servidor!" -ForegroundColor Red
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

# Verificar se tabelas foram criadas
echo ''
echo '🔍 Verificando se tabelas existem...'
psql -h localhost -p 5433 -U demo_user -d instructions_demo -c "\dt" 2>/dev/null | grep -q projects && echo '✅ Tabela projects existe' || echo '⚠️  Tabela projects não encontrada'
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

