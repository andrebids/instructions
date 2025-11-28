# Script para fazer build local e enviar para servidor
# Uso: .\upload-build.ps1
#
# Configuração via variáveis de ambiente ou ficheiro .env.deploy:
#   DEPLOY_SSH_KEY      - Caminho para chave SSH (opcional, usa SSH config se não especificado)
#   DEPLOY_SSH_USER     - Utilizador SSH (padrão: bids)
#   DEPLOY_SSH_HOST     - IP ou hostname do servidor (padrão: dev - usa SSH config)
#   DEPLOY_SERVER_PATH  - Caminho no servidor (padrão: /home/bids/apps/instructions-project/client)
#   DEPLOY_SITE_URL     - URL do site (opcional)

# Determinar caminho do script
$ScriptRoot = $PSScriptRoot
if (-not $ScriptRoot) {
    $ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
}

# Diretório base para módulos
$DeployModulesPath = Join-Path $ScriptRoot "scripts\deploy"

# Importar módulos utilitários
. (Join-Path $DeployModulesPath "utils\ErrorHandling.ps1")
. (Join-Path $DeployModulesPath "utils\Config.ps1")

# Importar funções
. (Join-Path $DeployModulesPath "functions\SshOperations.ps1")
. (Join-Path $DeployModulesPath "functions\ServerMaintenance.ps1")

# Importar etapas do deploy
. (Join-Path $DeployModulesPath "steps\GitUpdate.ps1")
. (Join-Path $DeployModulesPath "steps\BuildLocal.ps1")
. (Join-Path $DeployModulesPath "steps\UploadToServer.ps1")
. (Join-Path $DeployModulesPath "steps\ServerUpdate.ps1")
. (Join-Path $DeployModulesPath "steps\ServerCodeUpdate.ps1")
. (Join-Path $DeployModulesPath "steps\ServerRestart.ps1")

# Carregar configuração
$config = Get-DeployConfig -ScriptRoot $ScriptRoot

# Validar configuração SSH
if (-not (Test-SshConfig -SshKey $config.SshKey -SshUser $config.SshUser -SshHost $config.SshHost)) {
    Exit-Script -ExitCode 1
}

# Mostrar configuração
Show-Config -SshUser $config.SshUser -SshHost $config.SshHost -ServerPath $config.ServerPath -ServerRootPath $config.ServerRootPath -Pm2AppName $config.Pm2AppName

# Garantir que estamos no diretório correto antes do build (voltar para o diretório do script)
Set-Location $ScriptRoot

# Etapa 0: Atualizar código do GitHub
$gitUpdateSuccess = Update-GitCode -ScriptRoot $ScriptRoot

# Garantir que estamos no diretório correto antes do build (voltar para o diretório do script)
Set-Location $ScriptRoot

# Etapa 1: Build Local
Invoke-LocalBuild -ScriptRoot $ScriptRoot -GitUpdateSuccess $gitUpdateSuccess

# Etapa 2: Enviar build para servidor
# Normalizar caminho antes de passar
$normalizedServerPathForUpload = ($config.ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
$tempPath = Send-BuildToServer -SshKey $config.SshKey -SshUser $config.SshUser -SshHost $config.SshHost -ServerPath $normalizedServerPathForUpload -GitUpdateSuccess $gitUpdateSuccess -ScriptRoot $ScriptRoot

# Verificar se tempPath foi retornado corretamente
if ([string]::IsNullOrWhiteSpace($tempPath)) {
    Write-Host "[ERRO] Diretório temporário não foi retornado pela função Send-BuildToServer!" -ForegroundColor Red
    Exit-Script -ExitCode 1
}

# Etapa 3: Atualizar build no servidor
# Normalizar tempPath também (mas apenas remover \r\n, não truncar)
$normalizedTempPath = ($tempPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()

# Verificar novamente após normalização
if ([string]::IsNullOrWhiteSpace($normalizedTempPath)) {
    Write-Host "[ERRO] Diretório temporário ficou vazio após normalização! Valor original: '$tempPath'" -ForegroundColor Red
    Exit-Script -ExitCode 1
}

Update-ServerBuild -SshKey $config.SshKey -SshUser $config.SshUser -SshHost $config.SshHost -ServerPath $normalizedServerPathForUpload -TempPath $normalizedTempPath

# Etapa 4: Verificar e Corrigir Limite de Upload (Nginx)
Write-Host "=== 4. Verificar e Corrigir Limite de Upload (Nginx) ===" -ForegroundColor Cyan
Write-Host "[INFO] Verificação do Nginx pulada - configure manualmente se necessário" -ForegroundColor Gray
Write-Host "   Limites do Express já foram ajustados no código (15MB)" -ForegroundColor Gray
Write-Host ""

# Etapa 4.5: Atualizar código do servidor no servidor remoto
# Normalizar caminhos antes de passar (garantir remoção de \r\n)
$normalizedServerRootPath = ($config.ServerRootPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
Update-ServerCode -SshKey $config.SshKey -SshUser $config.SshUser -SshHost $config.SshHost -ServerRootPath $normalizedServerRootPath

# Nota: Migrations são executadas localmente antes do deploy, não no servidor remoto

# Etapa 5: Reiniciar Servidor
$normalizedServerPath = ($config.ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
$normalizedPm2AppName = ($config.Pm2AppName -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
Restart-Server -SshKey $config.SshKey -SshUser $config.SshUser -SshHost $config.SshHost -ServerRootPath $normalizedServerRootPath -ServerPath $normalizedServerPath -Pm2AppName $normalizedPm2AppName

# Mensagem final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build atualizado" -ForegroundColor Green
Write-Host "Servidor reiniciado" -ForegroundColor Green
Write-Host ""
if ($config.SiteUrl) {
    Write-Host "Site disponivel em: $($config.SiteUrl)" -ForegroundColor Yellow
}
Write-Host ""

# Garantir que o script retorna código de sucesso
Exit-Script -ExitCode 0
