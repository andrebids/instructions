# GitUpdate.ps1
# Atualização do código do GitHub

function Update-GitCode {
    param([string]$ScriptRoot)
    
    Write-Host "=== 0. Atualizar código do GitHub ===" -ForegroundColor Cyan
    $gitUpdateSuccess = $false
    try {
        # Procurar repositório Git: primeiro no diretório do script, depois na raiz (um nível acima)
        $gitRoot = $ScriptRoot
        if (-not (Test-Path (Join-Path $gitRoot ".git"))) {
            $parentDir = Split-Path $ScriptRoot -Parent
            if ($parentDir -and (Test-Path (Join-Path $parentDir ".git"))) {
                $gitRoot = $parentDir
                Write-Host "[INFO] Repositório Git encontrado na raiz: $gitRoot" -ForegroundColor Gray
            }
        }
        
        Set-Location $gitRoot
        
        # Verificar se estamos num repositório Git válido
        if (-not (Test-Path ".git")) {
            Write-Host "[AVISO] Diretório .git não encontrado em $gitRoot" -ForegroundColor Yellow
            Write-Host "   Continuando com código local existente..." -ForegroundColor Yellow
            Write-Host ""
        } else {
            Write-Host "Verificando repositório Git..." -ForegroundColor Gray
            
            # Verificar se git está disponível
            $gitAvailable = $false
            try {
                $null = git --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $gitAvailable = $true
                }
            } catch {
                $gitAvailable = $false
            }
            
            if (-not $gitAvailable) {
                Write-Host "[AVISO] Git não está disponível no sistema" -ForegroundColor Yellow
                Write-Host "   Continuando com código local existente..." -ForegroundColor Yellow
                Write-Host ""
            } else {
                # Verificar remote origin
                $remoteUrl = ""
                try {
                    $remoteUrl = git remote get-url origin 2>&1
                    if ($LASTEXITCODE -ne 0) {
                        Write-Host "[AVISO] Remote 'origin' não configurado" -ForegroundColor Yellow
                        Write-Host "   Continuando com código local existente..." -ForegroundColor Yellow
                        Write-Host ""
                    } else {
                        Write-Host "Remote origin: $remoteUrl" -ForegroundColor Gray
                        
                        # Detectar branch atual
                        $currentBranch = ""
                        try {
                            $currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
                            if ($LASTEXITCODE -ne 0) {
                                Write-Host "[AVISO] Não foi possível detectar branch atual" -ForegroundColor Yellow
                                $currentBranch = "main"
                            }
                        } catch {
                            $currentBranch = "main"
                        }
                        
                        if ([string]::IsNullOrWhiteSpace($currentBranch)) {
                            $currentBranch = "main"
                        }
                        
                        Write-Host "Branch atual: $currentBranch" -ForegroundColor Gray
                        
                        # Fazer git fetch para atualizar referências remotas
                        Write-Host "Atualizando referências remotas (git fetch)..." -ForegroundColor Gray
                        $null = git fetch origin 2>&1
                        $fetchExitCode = $LASTEXITCODE
                        
                        if ($fetchExitCode -ne 0) {
                            Write-Host "[AVISO] git fetch falhou (código: $fetchExitCode)" -ForegroundColor Yellow
                            Write-Host "   Possíveis causas: sem conexão, problemas de autenticação, ou repositório não existe" -ForegroundColor Yellow
                            Write-Host "   Continuando com código local existente..." -ForegroundColor Yellow
                            Write-Host ""
                        } else {
                            # Verificar se há atualizações disponíveis
                            $behindCount = 0
                            try {
                                $statusOutput = git rev-list --count HEAD..origin/$currentBranch 2>&1
                                if ($LASTEXITCODE -eq 0 -and $statusOutput -match '^\d+$') {
                                    $behindCount = [int]$statusOutput
                                }
                            } catch {
                                # Ignorar erro, continuar com pull
                            }
                            
                            if ($behindCount -gt 0) {
                                Write-Host "Encontradas $behindCount commit(s) novos no remoto" -ForegroundColor Cyan
                            } else {
                                Write-Host "Repositório local já está atualizado" -ForegroundColor Green
                            }
                            
                            # Fazer git pull para obter versão mais recente
                            Write-Host "Atualizando código local (git pull origin $currentBranch)..." -ForegroundColor Gray
                            # Capturar output e exit code separadamente
                            $pullOutput = @()
                            try {
                                $pullOutput = git pull origin $currentBranch 2>&1
                                $pullExitCode = $LASTEXITCODE
                            } catch {
                                # Se houver exceção, tentar obter exit code de outra forma
                                $pullExitCode = $LASTEXITCODE
                                if ($null -eq $pullExitCode) {
                                    $pullExitCode = 1
                                }
                            }
                            
                            # Converter output para string se for array
                            $pullOutputString = if ($pullOutput -is [System.Array]) { $pullOutput -join "`n" } else { if ($null -eq $pullOutput) { "" } else { $pullOutput.ToString() } }
                            
                            if ($pullExitCode -ne 0) {
                                Write-Host "[ERRO] git pull falhou (código: $pullExitCode)" -ForegroundColor Red
                                Write-Host "   Output: $pullOutputString" -ForegroundColor Red
                                Write-Host ""
                                Write-Host "Possíveis causas:" -ForegroundColor Yellow
                                Write-Host "  1. Conflitos de merge (resolver manualmente)" -ForegroundColor Yellow
                                Write-Host "  2. Alterações locais não commitadas (fazer stash ou commit)" -ForegroundColor Yellow
                                Write-Host "  3. Problemas de conexão ou autenticação" -ForegroundColor Yellow
                                Write-Host ""
                                Write-Host "Deseja continuar com código local? (S/N)" -ForegroundColor Yellow
                                Write-Host "   Pressione S para continuar ou N para abortar..." -ForegroundColor Yellow
                                
                                # Em modo não-interativo, continuar com aviso
                                Write-Host "[AVISO] Continuando com código local existente (modo não-interativo)" -ForegroundColor Yellow
                                Write-Host ""
                            } else {
                                # Verificar se houve atualizações
                                # Git pull bem-sucedido (exit code 0)
                                if ($pullOutputString -match 'Already up to date' -or $pullOutputString -match 'já está atualizado' -or $pullOutputString -match 'Already up to date') {
                                    Write-Host "[OK] Código já estava atualizado com a versão mais recente do GitHub" -ForegroundColor Green
                                    $gitUpdateSuccess = $true
                                } elseif ($pullOutputString -match 'Updating|Fast-forward|Merge made|files? changed') {
                                    Write-Host "[OK] Código atualizado com sucesso do GitHub!" -ForegroundColor Green
                                    if ($pullOutputString) {
                                        Write-Host "   Detalhes: $($pullOutputString -split "`n" | Select-Object -First 3 -join '; ')" -ForegroundColor Gray
                                    }
                                    $gitUpdateSuccess = $true
                                } else {
                                    # Git pull retornou exit code 0 mas output não reconhecido - assumir sucesso
                                    Write-Host "[OK] Código atualizado (git pull concluído com sucesso)" -ForegroundColor Green
                                    $gitUpdateSuccess = $true
                                }
                                
                                # Mostrar status do repositório
                                Write-Host "Verificando status do repositório..." -ForegroundColor Gray
                                $statusOutput = git status --short 2>&1
                                if ($LASTEXITCODE -eq 0 -and $statusOutput) {
                                    Write-Host "[INFO] Alterações locais detectadas:" -ForegroundColor Cyan
                                    Write-Host $statusOutput -ForegroundColor Gray
                                } else {
                                    Write-Host "[OK] Repositório limpo (sem alterações locais)" -ForegroundColor Green
                                }
                                
                                # Mostrar commit atual para confirmar versão
                                try {
                                    $currentCommit = git rev-parse --short HEAD 2>&1
                                    $commitExitCode = $LASTEXITCODE
                                    $commitMessage = ""
                                    if ($commitExitCode -eq 0) {
                                        $commitMessage = git log -1 --pretty=format:"%s" 2>&1
                                        if ($LASTEXITCODE -eq 0) {
                                            Write-Host "[INFO] Commit atual: $currentCommit - $commitMessage" -ForegroundColor Cyan
                                        } else {
                                            Write-Host "[INFO] Commit atual: $currentCommit" -ForegroundColor Cyan
                                        }
                                    }
                                } catch {
                                    # Ignorar erro ao obter commit
                                }
                                Write-Host ""
                            }
                        }
                    }
                } catch {
                    # Ignorar erros do git pull se já foi processado
                    if (-not $gitUpdateSuccess) {
                        Write-Host "[AVISO] Erro ao verificar remote: $_" -ForegroundColor Yellow
                        Write-Host "   Continuando com código local existente..." -ForegroundColor Yellow
                        Write-Host ""
                    }
                }
            }
        }
    } catch {
        Write-Host "[AVISO] Erro ao atualizar código do GitHub: $_" -ForegroundColor Yellow
        Write-Host "   Continuando com código local existente..." -ForegroundColor Yellow
        Write-Host ""
    }
    
    return $gitUpdateSuccess
}

