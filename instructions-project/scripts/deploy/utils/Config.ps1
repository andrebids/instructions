# Config.ps1
# Carregamento e validação de configuração

# Carregar configuração do ficheiro .env.deploy se existir
function Load-DeployConfig {
    param([string]$ScriptRoot)
    
    $envFile = Join-Path $ScriptRoot ".env.deploy"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                # Normalizar valor removendo \r\n antes de definir
                $value = ($matches[2] -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
        Write-Host "[OK] Configuração carregada de .env.deploy" -ForegroundColor Gray
    }
}

# Normalizar caminho removendo caracteres de retorno de linha
function Normalize-Path {
    param([string]$Path)
    if ($null -eq $Path) {
        return $null
    }
    # Converter para string explícita e remover \r, \n
    $normalized = [string]$Path
    $normalized = $normalized -replace "`r`n", ""
    $normalized = $normalized -replace "`r", ""
    $normalized = $normalized -replace "`n", ""
    # Remover qualquer caractere de controle restante
    $normalized = $normalized -creplace '[^\x20-\x7E]', ''
    return $normalized.Trim()
}

# Carregar configuração com valores padrão
function Get-DeployConfig {
    param([string]$ScriptRoot)
    
    Load-DeployConfig -ScriptRoot $ScriptRoot
    
    # Configuração com valores padrão - normalizar todos os caminhos
    $config = @{
        SshKey = if ($env:DEPLOY_SSH_KEY) { Normalize-Path -Path $env:DEPLOY_SSH_KEY } else { $null }
        SshUser = if ($env:DEPLOY_SSH_USER) { Normalize-Path -Path $env:DEPLOY_SSH_USER } else { Normalize-Path -Path "bids" }
        SshHost = if ($env:DEPLOY_SSH_HOST) { Normalize-Path -Path $env:DEPLOY_SSH_HOST } else { Normalize-Path -Path "dev" }
        ServerPath = if ($env:DEPLOY_SERVER_PATH) { Normalize-Path -Path $env:DEPLOY_SERVER_PATH } else { Normalize-Path -Path "/home/bids/apps/instructions-project/instructions-project/client" }
        ServerRootPath = if ($env:DEPLOY_SERVER_ROOT_PATH) { Normalize-Path -Path $env:DEPLOY_SERVER_ROOT_PATH } else { Normalize-Path -Path "/home/bids/apps/instructions-project/instructions-project" }
        Pm2AppName = if ($env:DEPLOY_PM2_APP_NAME) { Normalize-Path -Path $env:DEPLOY_PM2_APP_NAME } else { Normalize-Path -Path "instructions-server" }
        SiteUrl = if ($env:DEPLOY_SITE_URL) { Normalize-Path -Path $env:DEPLOY_SITE_URL } else { "" }
    }
    
    return $config
}

# Verificar configuração SSH
function Test-SshConfig {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost
    )
    
    # Verificar se chave SSH foi especificada, caso contrário usa SSH config
    if ($SshKey -and -not (Test-Path $SshKey)) {
        Write-Host "[ERRO] Chave SSH não encontrada: $SshKey" -ForegroundColor Red
        Write-Host ""
        Write-Host "Soluções:" -ForegroundColor Yellow
        Write-Host "1. Copie a chave SSH para: $SshKey"
        Write-Host "2. Ou defina DEPLOY_SSH_KEY no ficheiro .env.deploy"
        Write-Host "3. Ou defina a variável de ambiente DEPLOY_SSH_KEY"
        Write-Host "4. Ou remova DEPLOY_SSH_KEY para usar configuração SSH padrão (recomendado para host 'dev')"
        Write-Host ""
        Write-Host "Exemplo de .env.deploy:" -ForegroundColor Cyan
        Write-Host "DEPLOY_SSH_USER=bids"
        Write-Host "DEPLOY_SSH_HOST=dev"
        Write-Host "DEPLOY_SERVER_PATH=/home/bids/apps/instructions-project/instructions-project/client"
        return $false
    }
    
    return $true
}

# Mostrar configuração
function Show-Config {
    param(
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerPath,
        [string]$ServerRootPath,
        [string]$Pm2AppName
    )
    
    Write-Host "=== Configuração ===" -ForegroundColor Cyan
    Write-Host "Servidor: $SshUser@$SshHost" -ForegroundColor Gray
    Write-Host "Caminho Cliente: $ServerPath" -ForegroundColor Gray
    Write-Host "Caminho Raiz: $ServerRootPath" -ForegroundColor Gray
    Write-Host "PM2 App: $Pm2AppName" -ForegroundColor Gray
    Write-Host ""
}

