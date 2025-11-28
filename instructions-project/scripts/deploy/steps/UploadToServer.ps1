# UploadToServer.ps1
# Envio do build para servidor

function Send-BuildToServer {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerPath,
        [bool]$GitUpdateSuccess,
        [string]$ScriptRoot
    )
    
    # Normalizar caminho removendo caracteres de retorno de linha
    $ServerPath = ($ServerPath -replace "`r`n", "" -replace "`r", "" -replace "`n", "").Trim()
    
    Write-Host "=== 2. Enviar build para servidor ===" -ForegroundColor Cyan
    if ($GitUpdateSuccess) {
        Write-Host "[INFO] Enviando build da versão mais recente do GitHub para o servidor..." -ForegroundColor Cyan
    } else {
        Write-Host "[AVISO] Enviando build do código local (versão GitHub pode não estar atualizada)" -ForegroundColor Yellow
    }
    Write-Host ""
    $tempPath = "/tmp/client-dist-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    # Verificar espaço em disco antes de fazer upload
    Write-Host "Verificando espaço em disco no servidor..." -ForegroundColor Gray
    try {
        $diskInfo = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "df -h /tmp 2>/dev/null | tail -1 || df -h / | tail -1"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Espaço disponível: $diskInfo" -ForegroundColor Gray
        } else {
            Write-Host "Aviso: Não foi possível verificar espaço (timeout ou erro de conexão)" -ForegroundColor Yellow
            Write-Host "Tentando continuar mesmo assim..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Aviso: Erro ao verificar espaço: $_" -ForegroundColor Yellow
    }
    
    # Verificar espaço disponível
    $availableSpaceMB = Get-AvailableSpace -SshKey $SshKey -SshUser $SshUser -SshHost $SshHost
    Write-Host "Espaço disponível: $availableSpaceMB MB" -ForegroundColor Gray
    
    # Se houver pouco espaço, fazer limpeza automática
    $requiredSpaceMB = 500
    if ($availableSpaceMB -lt $requiredSpaceMB) {
        Write-Host ""
        Write-Host "AVISO: Pouco espaço em disco ($availableSpaceMB MB disponível, necessário: $requiredSpaceMB MB)" -ForegroundColor Yellow
        Write-Host "Executando limpeza automática do servidor..." -ForegroundColor Cyan
        
        $newSpaceMB = Invoke-ServerCleanup -SshKey $SshKey -SshUser $SshUser -SshHost $SshHost -ServerPath $ServerPath -RequiredSpaceMB $requiredSpaceMB
        
        if ($newSpaceMB -lt $requiredSpaceMB) {
            Write-Host ""
            Write-Host "ERRO: Espaço ainda insuficiente após limpeza ($newSpaceMB MB disponível)" -ForegroundColor Red
            Write-Host ""
            Write-Host "Soluções manuais:" -ForegroundColor Yellow
            Write-Host "  1. Verificar o que está ocupando espaço:"
            Write-Host "     ssh $SshUser@$SshHost 'du -sh /tmp/* ~/* 2>/dev/null | sort -h | tail -20'"
            Write-Host "  2. Limpar manualmente builds antigos:"
            Write-Host "     ssh $SshUser@$SshHost 'rm -rf $ServerPath/dist-old-*'"
            Write-Host "  3. Limpar node_modules antigos (se houver):"
            Write-Host "     ssh $SshUser@$SshHost 'find ~ -name node_modules -type d -exec du -sh {} \; | sort -h | tail -10'"
            Write-Host ""
            Exit-Script -ExitCode 1
        } else {
            Write-Host ""
            Write-Host "SUCCESS: Espaço liberado! Agora há $newSpaceMB MB disponível" -ForegroundColor Green
        }
    } else {
        Write-Host "Espaço suficiente disponível ($availableSpaceMB MB)" -ForegroundColor Green
    }
    
    # Criar diretório temporário no servidor
    Write-Host "Criando diretório temporário no servidor..." -ForegroundColor Gray
    try {
        $createDirCmd = "mkdir -p $tempPath && chmod 755 $tempPath"
        $createOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $createDirCmd
        
        if ($LASTEXITCODE -ne 0) {
            if ($createOutput -match "Connection timed out|Connection refused|Network is unreachable") {
                Write-Host "ERRO: Não foi possível conectar ao servidor via SSH" -ForegroundColor Red
                Write-Host "Erro: $createOutput" -ForegroundColor Red
                Write-Host ""
                Write-Host "Verifique:" -ForegroundColor Yellow
                Write-Host "  1. Servidor está online e acessível"
                Write-Host "  2. Firewall permite conexões SSH (porta 22)"
                Write-Host "  3. Chave SSH está correta e tem permissões adequadas"
                Write-Host ""
                Exit-Script -ExitCode 1
            } elseif ($createOutput -match "No space|cannot create") {
                Write-Host "ERRO: Não foi possível criar diretório temporário - sem espaço" -ForegroundColor Red
                Write-Host "Erro: $createOutput" -ForegroundColor Red
                Write-Host ""
                Write-Host "Tentando limpeza automática novamente..." -ForegroundColor Yellow
                $finalSpaceMB = Invoke-ServerCleanup -SshKey $SshKey -SshUser $SshUser -SshHost $SshHost -ServerPath $ServerPath -RequiredSpaceMB 1000
                if ($finalSpaceMB -lt 500) {
                    Write-Host "ERRO: Espaço ainda insuficiente após limpeza" -ForegroundColor Red
                    Exit-Script -ExitCode 1
                }
                # Tentar criar novamente após limpeza
                $createOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $createDirCmd
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "ERRO: Ainda não foi possível criar diretório após limpeza" -ForegroundColor Red
                    Exit-Script -ExitCode 1
                }
            } else {
                Write-Host "ERRO: Não foi possível criar diretório temporário" -ForegroundColor Red
                Write-Host "Erro: $createOutput" -ForegroundColor Red
                Exit-Script -ExitCode 1
            }
        }
    } catch {
        Write-Host "ERRO: Exceção ao criar diretório: $_" -ForegroundColor Red
        Exit-Script -ExitCode 1
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
            Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "rm -rf $tempPath 2>/dev/null; mkdir -p $tempPath && chmod 755 $tempPath" | Out-Null
        }
        
        # Usar scp com compressão e timeout aumentado
        # IMPORTANTE: Enviar conteúdo de dist/* para tempPath diretamente (não dist inteiro)
        # O destino deve terminar com / para que scp coloque os arquivos diretamente no diretório
        Write-Host "Enviando arquivos (pode demorar para arquivos grandes)..." -ForegroundColor Gray
        # Estamos no diretório client após o build, então dist está aqui
        $clientDir = Join-Path $ScriptRoot "client"
        Set-Location $clientDir
        if (-not (Test-Path ".\dist")) {
            Write-Host "[ERRO] Diretório dist não encontrado!" -ForegroundColor Red
            Exit-Script -ExitCode 1
        }
        # Usar scp com wildcard - PowerShell pode não expandir, mas o script no servidor corrige se necessário
        # Tentar enviar conteúdo diretamente usando caminho relativo
        try {
            Write-Host "Executando SCP..." -ForegroundColor Gray
            Write-Host "   Origem: .\dist\*" -ForegroundColor Gray
            $destinoInfo = "${SshUser}@${SshHost}:${tempPath}/"
            Write-Host "   Destino: $destinoInfo" -ForegroundColor Gray
            
            $scpOutput = Invoke-ScpCommand -Source ".\dist\*" -Destination "$tempPath/" -User $SshUser -SshHost $SshHost -Key $SshKey -AdditionalOptions @("-C", "-r")
            
            # Verificar se houve erro na execução
            $scpSuccess = $true
            $exitCode = $LASTEXITCODE
            Write-Host "   Exit Code: $exitCode" -ForegroundColor Gray
            
            if ($null -ne $exitCode -and $exitCode -ne 0) {
                $scpSuccess = $false
                Write-Host "   [AVISO] SCP retornou código de erro: $exitCode" -ForegroundColor Yellow
            }
            
            # Verificar se o output contém erros
            $scpOutputString = ""
            if ($null -eq $scpOutput) {
                $scpOutputString = ""
            } elseif ($scpOutput -is [System.Array]) {
                $scpOutputString = $scpOutput -join "`n"
            } else {
                $scpOutputString = $scpOutput.ToString()
            }
            
            if ($scpOutputString -match "SCP_ERROR|Permission denied|Connection refused|Connection timed out|No space|failed") {
                $scpSuccess = $false
                Write-Host "[AVISO] Erro detectado no output do SCP" -ForegroundColor Yellow
                Write-Host "   Output: $($scpOutputString -split "`n" | Select-Object -First 3 -join ', ')" -ForegroundColor Yellow
            }
            
            if ($scpSuccess) {
                $uploadSuccess = $true
                Write-Host "[OK] Upload concluído!" -ForegroundColor Green
            } else {
                Write-Host "[AVISO] Upload falhou (tentativa $($retryCount + 1))" -ForegroundColor Yellow
                if ($scpOutputString -match "Failure|failed|No space|Permission") {
                    Write-Host "   Erro: $($scpOutputString -split "`n" | Select-Object -First 3 -join '; ')" -ForegroundColor Yellow
                }
            }
        } catch {
            Write-Host "[ERRO] Exceção durante upload: $_" -ForegroundColor Red
            Write-Host "   Linha: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
            $uploadSuccess = $false
        }
        
        $retryCount++
    }
    
    if (-not $uploadSuccess) {
        Write-Host "[ERRO] Upload falhou após $maxRetries tentativas!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possíveis causas:" -ForegroundColor Yellow
        Write-Host "  1. Espaço em disco insuficiente no servidor"
        Write-Host "  2. Timeout na conexão (arquivos muito grandes)"
        Write-Host "  3. Permissões insuficientes"
        Write-Host ""
        Write-Host "Soluções:" -ForegroundColor Cyan
        Write-Host "  - Verificar espaço: ssh $SshUser@$SshHost 'df -h'"
        Write-Host "  - Limpar espaço: ssh $SshUser@$SshHost 'du -sh /tmp/client-dist-*'"
        Write-Host "  - Verificar permissões: ssh $SshUser@$SshHost 'ls -ld /tmp'"
        Write-Host ""
        Exit-Script -ExitCode 1
    }
    Write-Host ""
    
    # Garantir que tempPath foi definido antes de retornar
    if ([string]::IsNullOrWhiteSpace($tempPath)) {
        Write-Host "[ERRO] tempPath não foi definido ou está vazio!" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    
    Write-Host "[DEBUG] Retornando tempPath: '$tempPath'" -ForegroundColor Gray
    return $tempPath
}

