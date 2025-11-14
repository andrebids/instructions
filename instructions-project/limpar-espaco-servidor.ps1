# Script para limpar espaço no servidor
# Uso: .\limpar-espaco-servidor.ps1

$sshKey = if ($env:DEPLOY_SSH_KEY) { $env:DEPLOY_SSH_KEY } else { "$env:USERPROFILE\.ssh\thecore" }
$sshUser = if ($env:DEPLOY_SSH_USER) { $env:DEPLOY_SSH_USER } else { "andre" }
$sshHost = if ($env:DEPLOY_SSH_HOST) { $env:DEPLOY_SSH_HOST } else { "136.116.79.244" }
$serverPath = "/home/andre/apps/instructions/instructions-project/client"

Write-Host "=== Limpeza de Espaço no Servidor ===" -ForegroundColor Cyan
Write-Host ""

# Verificar espaço atual
Write-Host "Espaço atual em /tmp:" -ForegroundColor Yellow
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "df -h /tmp"
Write-Host ""

# Mostrar o que está ocupando espaço
Write-Host "Top 10 maiores diretórios em /tmp:" -ForegroundColor Yellow
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "du -sh /tmp/* 2>/dev/null | sort -h | tail -10"
Write-Host ""

# Limpar diretórios client-dist antigos
Write-Host "Limpando diretórios client-dist antigos..." -ForegroundColor Cyan
$cleaned = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" @"
# Contar quantos serão removidos
COUNT=`$(find /tmp -maxdepth 1 -type d -name 'client-dist-*' 2>/dev/null | wc -l)
echo "Encontrados `$COUNT diretórios para limpar"
# Remover todos
find /tmp -maxdepth 1 -type d -name 'client-dist-*' -exec rm -rf {} \; 2>/dev/null && echo "✅ Removidos `$COUNT diretórios" || echo "⚠️  Alguns diretórios podem não ter sido removidos"
"@
Write-Host $cleaned -ForegroundColor Gray
Write-Host ""

# Limpar builds antigos do cliente
Write-Host "Limpando builds antigos do cliente..." -ForegroundColor Cyan
$cleanedBuilds = ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" @"
# Contar quantos serão removidos
COUNT=`$(find $serverPath -maxdepth 1 -type d -name 'dist-old-*' 2>/dev/null | wc -l)
echo "Encontrados `$COUNT builds antigos para limpar"
# Remover todos
find $serverPath -maxdepth 1 -type d -name 'dist-old-*' -exec rm -rf {} \; 2>/dev/null && echo "✅ Removidos `$COUNT builds antigos" || echo "⚠️  Alguns builds podem não ter sido removidos"
"@
Write-Host $cleanedBuilds -ForegroundColor Gray
Write-Host ""

# Limpar logs do PM2
Write-Host "Limpando logs do PM2..." -ForegroundColor Cyan
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "pm2 flush 2>/dev/null && echo '✅ Logs do PM2 limpos' || echo '⚠️  Não foi possível limpar logs do PM2'"
Write-Host ""

# Verificar espaço após limpeza
Write-Host "Espaço após limpeza:" -ForegroundColor Green
ssh -i $sshKey -o StrictHostKeyChecking=no "${sshUser}@${sshHost}" "df -h /tmp"
Write-Host ""

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green

