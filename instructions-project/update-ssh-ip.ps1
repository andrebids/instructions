# Script: Atualizar IP SSH e Testar Conexão
# Guarda este ficheiro como: update-ssh-ip.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$NovoIP,
    
    [Parameter(Mandatory=$false)]
    [string]$Usuario = "andre",
    
    [Parameter(Mandatory=$false)]
    [string]$ChaveSSH = "$env:USERPROFILE\.ssh\github_deploy"
)

Write-Host "`n[INFO] Atualizando configuracao SSH para IP: $NovoIP" -ForegroundColor Cyan

# 1. Limpar IPs antigos do known_hosts
Write-Host "`n1. Limpando known_hosts..." -ForegroundColor Yellow
$ipsAntigos = @("34.122.6.174", "34.46.91.20", "35.239.46.72")
foreach ($ip in $ipsAntigos) {
    if ($ip -ne $NovoIP) {
        ssh-keygen -R $ip -f "$env:USERPROFILE\.ssh\known_hosts" 2>&1 | Out-Null
        Write-Host "   [OK] Removido: $ip" -ForegroundColor Gray
    }
}

# 2. Adicionar novo IP ao known_hosts
Write-Host "`n2. Adicionando novo IP ao known_hosts..." -ForegroundColor Yellow
ssh-keyscan -H $NovoIP >> "$env:USERPROFILE\.ssh\known_hosts" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] IP adicionado: $NovoIP" -ForegroundColor Green
} else {
    Write-Host "   [AVISO] Nao foi possivel adicionar ao known_hosts" -ForegroundColor Yellow
}

# 3. Mostrar chave pública (para adicionar ao servidor)
Write-Host "`n3. Chave publica para adicionar ao servidor:" -ForegroundColor Yellow
if (Test-Path $ChaveSSH) {
    Write-Host "`n   Copia esta linha completa:" -ForegroundColor Cyan
    $chavePublica = Get-Content "$env:USERPROFILE\.ssh\github_deploy.pub"
    Write-Host "   $chavePublica" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "   [ERRO] Ficheiro de chave nao encontrado: $ChaveSSH" -ForegroundColor Red
}

# 4. Testar conexão SSH
Write-Host "`n4. Testando conexao SSH..." -ForegroundColor Yellow
$testResult = ssh -i $ChaveSSH -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$Usuario@$NovoIP" "hostname; whoami" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] CONEXAO SSH FUNCIONA!" -ForegroundColor Green
    Write-Host $testResult -ForegroundColor White
} else {
    Write-Host "`n[ERRO] Conexao SSH falhou:" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Yellow
    Write-Host "`nProximos passos:" -ForegroundColor Cyan
    Write-Host "   1. Adicionar chave publica ao servidor (Google Cloud Console)" -ForegroundColor White
    Write-Host "   2. Atualizar GitHub Secret SSH_HOST para: $NovoIP" -ForegroundColor White
}

# 5. Mostrar instruções para GitHub
Write-Host "`n5. Atualizar GitHub Secret:" -ForegroundColor Yellow
Write-Host "   Vai a: https://github.com/SEU_REPO/settings/secrets/actions" -ForegroundColor White
Write-Host "   Edita SSH_HOST -> Cola: $NovoIP" -ForegroundColor White

Write-Host "`n[OK] Processo concluido!`n" -ForegroundColor Green

