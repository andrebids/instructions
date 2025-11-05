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
Write-Host "Caminho: $serverPath" -ForegroundColor Gray
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

Write-Host ""
Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "🌐 Site disponível em: $siteUrl" -ForegroundColor Yellow

