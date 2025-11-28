# ErrorHandling.ps1
# Funções de tratamento de erro e controle de fluxo

# Configurar tratamento de erros
$ErrorActionPreference = "Stop"
$script:ExitCode = 0

# Função para sair com código de erro
function Exit-Script {
    param([int]$ExitCode = 0)
    $script:ExitCode = $ExitCode
    exit $ExitCode
}

# Função para executar comandos com tratamento de erro
function Invoke-SafeCommand {
    param(
        [scriptblock]$Command,
        [string]$ErrorMessage = "Comando falhou",
        [bool]$ContinueOnError = $false
    )
    
    try {
        & $Command
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            if (-not $ContinueOnError) {
                Write-Host "[ERRO] $ErrorMessage (código: $LASTEXITCODE)" -ForegroundColor Red
                throw "$ErrorMessage"
            } else {
                Write-Host "[AVISO] $ErrorMessage (código: $LASTEXITCODE) - Continuando..." -ForegroundColor Yellow
            }
        }
    } catch {
        if (-not $ContinueOnError) {
            Write-Host "[ERRO] $ErrorMessage" -ForegroundColor Red
            Write-Host "   Erro: $_" -ForegroundColor Red
            throw
        } else {
            Write-Host "[AVISO] $ErrorMessage - Continuando..." -ForegroundColor Yellow
            Write-Host "   Erro: $_" -ForegroundColor Yellow
        }
    }
}

# Trap melhorado para não fechar o script imediatamente em todos os casos
trap {
    $errorType = $_.Exception.GetType().FullName
    $errorMessage = $_.Exception.Message
    
    # Se for um erro de terminação esperado (Exit-Script), não mostrar trap
    if ($errorMessage -match "Exit-Script" -or $_.CategoryInfo.Reason -eq "ExitException") {
        break
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERRO CRÍTICO NO SCRIPT" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Tipo: $errorType" -ForegroundColor Red
    Write-Host "Erro: $errorMessage" -ForegroundColor Red
    Write-Host "Linha: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
    Write-Host "Comando: $($_.InvocationInfo.Line)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pressione qualquer tecla para continuar ou Ctrl+C para sair..." -ForegroundColor Yellow
    try {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } catch {
        # Se não conseguir ler tecla, continuar
    }
    Exit-Script -ExitCode 1
}

