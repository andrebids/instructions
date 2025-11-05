# Script para fazer build local e enviar para servidor
# Uso: .\upload-build.ps1

$ErrorActionPreference = "Stop"

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
$sshKey = "$env:USERPROFILE\.ssh\thecore"
$serverPath = "/home/andre/apps/instructions/instructions-project/client"
$tempPath = "/tmp/client-dist-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Enviar para pasta temporária
scp -i $sshKey -o StrictHostKeyChecking=no -r ".\dist" "andre@136.116.79.244:$tempPath"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload falhou!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Ficheiros enviados!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 3. Atualizar no servidor ===" -ForegroundColor Cyan
ssh -i $sshKey -o StrictHostKeyChecking=no andre@136.116.79.244 @"
cd $serverPath
mv dist dist-old-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
mv $tempPath dist
chmod -R 755 dist
echo '✅ Build atualizado no servidor!'
ls -lh dist/index.html
"@

Write-Host ""
Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "🌐 Site disponível em: https://136.116.79.244" -ForegroundColor Yellow

