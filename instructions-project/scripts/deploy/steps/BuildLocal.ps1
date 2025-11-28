# BuildLocal.ps1
# Execução do build local

function Invoke-LocalBuild {
    param(
        [string]$ScriptRoot,
        [bool]$GitUpdateSuccess
    )
    
    Write-Host "=== 1. Build Local (versão GitHub mais recente) ===" -ForegroundColor Cyan
    if ($GitUpdateSuccess) {
        Write-Host "[INFO] Fazendo build com a versão mais recente do GitHub..." -ForegroundColor Cyan
    } else {
        Write-Host "[AVISO] Fazendo build com código local (git pull pode ter falhado)" -ForegroundColor Yellow
    }
    Write-Host ""
    try {
        Set-Location "$ScriptRoot\client"
        if (-not (Test-Path "$ScriptRoot\client")) {
            Write-Host "[ERRO] Diretório client não encontrado: $ScriptRoot\client" -ForegroundColor Red
            Exit-Script -ExitCode 1
        }
        
        Write-Host "Executando npm run build..." -ForegroundColor Gray
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERRO] Build falhou com código: $LASTEXITCODE" -ForegroundColor Red
            Exit-Script -ExitCode 1
        }
        
        Write-Host "[OK] Build concluído com sucesso!" -ForegroundColor Green
        if ($GitUpdateSuccess) {
            Write-Host "[INFO] Build foi feito com a versão mais recente do GitHub" -ForegroundColor Cyan
        }
        
        # Verificar se o diretório dist foi criado
        if (-not (Test-Path ".\dist")) {
            Write-Host "[ERRO] Diretório dist não foi criado após o build!" -ForegroundColor Red
            Exit-Script -ExitCode 1
        }
        
        Write-Host "[OK] Diretório dist verificado e pronto para envio" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "[ERRO] Erro ao executar build: $_" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
}

