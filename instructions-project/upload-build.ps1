# Script para fazer build local e enviar para servidor
# Uso: .\upload-build.ps1
#
# Configuração via variáveis de ambiente ou ficheiro .env.deploy:
#   DEPLOY_SSH_KEY      - Caminho para chave SSH (opcional, usa SSH config se não especificado)
#   DEPLOY_SSH_USER     - Utilizador SSH (padrão: bids)
#   DEPLOY_SSH_HOST     - IP ou hostname do servidor (padrão: dev - usa SSH config)
#   DEPLOY_SERVER_PATH  - Caminho no servidor (padrão: /home/bids/apps/instructions-project/client)
#   DEPLOY_SITE_URL     - URL do site (opcional)

# Configurar tratamento de erros
# Usar "Stop" mas com tratamento cuidadoso de erros nas funções críticas
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

# Garantir que o script termina com código de erro apropriado
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
    Write-Host "[OK] Configuração carregada de .env.deploy" -ForegroundColor Gray
}

# Configuração com valores padrão
$sshKey = if ($env:DEPLOY_SSH_KEY) { $env:DEPLOY_SSH_KEY } else { $null }
$sshUser = if ($env:DEPLOY_SSH_USER) { $env:DEPLOY_SSH_USER } else { "bids" }
$sshHost = if ($env:DEPLOY_SSH_HOST) { $env:DEPLOY_SSH_HOST } else { "dev" }
$serverPath = if ($env:DEPLOY_SERVER_PATH) { $env:DEPLOY_SERVER_PATH } else { "/home/bids/apps/instructions-project/instructions-project/client" }
$serverRootPath = if ($env:DEPLOY_SERVER_ROOT_PATH) { $env:DEPLOY_SERVER_ROOT_PATH } else { "/home/bids/apps/instructions-project/instructions-project" }
$pm2AppName = if ($env:DEPLOY_PM2_APP_NAME) { $env:DEPLOY_PM2_APP_NAME } else { "instructions-server" }
$siteUrl = if ($env:DEPLOY_SITE_URL) { $env:DEPLOY_SITE_URL } else { "" }

# Verificar se chave SSH foi especificada, caso contrário usa SSH config
if ($sshKey -and -not (Test-Path $sshKey)) {
    Write-Host "[ERRO] Chave SSH não encontrada: $sshKey" -ForegroundColor Red
    Write-Host ""
    Write-Host "Soluções:" -ForegroundColor Yellow
    Write-Host "1. Copie a chave SSH para: $sshKey"
    Write-Host "2. Ou defina DEPLOY_SSH_KEY no ficheiro .env.deploy"
    Write-Host "3. Ou defina a variável de ambiente DEPLOY_SSH_KEY"
    Write-Host "4. Ou remova DEPLOY_SSH_KEY para usar configuração SSH padrão (recomendado para host 'dev')"
    Write-Host ""
    Write-Host "Exemplo de .env.deploy:" -ForegroundColor Cyan
    Write-Host "DEPLOY_SSH_USER=bids"
    Write-Host "DEPLOY_SSH_HOST=dev"
    Write-Host "DEPLOY_SERVER_PATH=/home/bids/apps/instructions-project/instructions-project/client"
    Exit-Script -ExitCode 1
}

# Função auxiliar para obter comando nginx fix codificado em base64
# Usa Get-Content com here-string em arquivo temporário para evitar análise do PowerShell
function Get-NginxFixCommand {
    # Criar arquivo temporário com o script bash
    $tempFile = [System.IO.Path]::GetTempFileName()
    $bashScript = @'
if command -v nginx >/dev/null 2>&1; then
  NGINX_CONF="/etc/nginx/nginx.conf"
  NGINX_SITES="/etc/nginx/sites-enabled"
  CONFIG_FILE=""
  if [ -d "$NGINX_SITES" ]; then
    for f in "$NGINX_SITES"/*; do
      [ -f "$f" ] && grep -q "proxy_pass\|upstream" "$f" 2>/dev/null && CONFIG_FILE="$f" && break
    done
  fi
  [ -z "$CONFIG_FILE" ] && CONFIG_FILE="$NGINX_CONF"
  if [ -f "$CONFIG_FILE" ]; then
    if grep -q "client_max_body_size" "$CONFIG_FILE"; then
      LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk '{print $2}' | tr -d ";")
      NUM=$(echo "$LIMIT" | sed 's/[^0-9]//g')
      if [ -z "$NUM" ] || [ "$NUM" -lt 15 ]; then
        echo "[AVISO] Ajustando limite para 15MB..."
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        sed -i "s/client_max_body_size.*/client_max_body_size 15M;/" "$CONFIG_FILE"
        nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "[AVISO] Execute: sudo systemctl reload nginx") && echo "[OK] Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "[ERRO] Erro na sintaxe")
      else
        echo "[OK] Limite adequado: $LIMIT"
      fi
    else
      echo "[AVISO] Adicionando client_max_body_size 15M..."
      cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
      grep -q "^http {" "$CONFIG_FILE" && sed -i "/^http {/a\    client_max_body_size 15M;" "$CONFIG_FILE" || sed -i "1i client_max_body_size 15M;" "$CONFIG_FILE"
      nginx -t >/dev/null 2>&1 && (systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || echo "[AVISO] Execute: sudo systemctl reload nginx") && echo "[OK] Nginx atualizado!" || (cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE" 2>/dev/null; echo "[ERRO] Erro na sintaxe")
    fi
  else
    echo "[AVISO] Arquivo de configuração não encontrado"
  fi
else
  echo "[INFO] Nginx não encontrado (servidor pode estar rodando diretamente via PM2)"
  echo "[OK] Limites do Express já foram ajustados no código (15MB)"
fi
'@
    # Escrever para arquivo temporário usando Out-File com encoding UTF8
    $bashScript | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
    # Ler e codificar
    $content = Get-Content -Path $tempFile -Raw -Encoding UTF8
    Remove-Item -Path $tempFile -Force
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    return [Convert]::ToBase64String($bytes)
}

# Função auxiliar para executar comando SSH com ou sem chave
function Invoke-SshCommand {
    param(
        [string]$User,
        [string]$SshHost,
        [string]$Key = $null,
        [string]$BashCommand
    )
    $sshOptions = "-o StrictHostKeyChecking=no -o ConnectTimeout=30"
    $sshTarget = "${User}@${SshHost}"
    
    # Construir array de argumentos SSH base
    $sshCmdParts = @()
    if ($Key) {
        $sshCmdParts += "-i"
        $sshCmdParts += $Key
    }
    $sshCmdParts += $sshOptions.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    $sshCmdParts += $sshTarget
    
    # Sempre usar bash -c para garantir que pipes, operadores e comandos complexos funcionem
    # Para comandos multi-linha, muito longos, ou com operadores bash (&&, ||), usar base64
    if ($BashCommand -match "`n" -or $BashCommand.Length -gt 500 -or $BashCommand -match '&&|\|\|') {
        # Comando multi-linha, muito longo ou com operadores bash: codificar em base64
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($BashCommand)
        $encoded = [Convert]::ToBase64String($bytes)
        
        # Adicionar comando bash como elemento único do array (PowerShell manterá como string única)
        $bashCmd = "bash -c 'echo $encoded | base64 -d | bash'"
        $sshCmdParts += $bashCmd
    } else {
        # Comando simples ou com pipes: sempre usar bash -c
        # Escapar aspas simples dentro do comando usando '\''
        $escapedCmd = $BashCommand -replace "'", "'\''"
        
        # Adicionar comando bash como elemento único do array
        $bashCmd = "bash -c '$escapedCmd'"
        $sshCmdParts += $bashCmd
    }
    
    # Executar SSH com array de argumentos
    & ssh $sshCmdParts 2>&1
}

# Função auxiliar para executar comando SCP com ou sem chave
function Invoke-ScpCommand {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$User,
        [string]$SshHost,
        [string]$Key = $null,
        [string[]]$AdditionalOptions = @()
    )
    
    $scpOptions = @("-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=30", "-o", "ServerAliveInterval=60")
    $scpTarget = "${User}@${SshHost}:${Destination}"
    
    # Construir array de argumentos
    $scpArgs = @()
    if ($Key) {
        $scpArgs += "-i"
        $scpArgs += $Key
    }
    $scpArgs += $scpOptions
    if ($AdditionalOptions) {
        $scpArgs += $AdditionalOptions
    }
    $scpArgs += $Source
    $scpArgs += $scpTarget
    
    # Executar SCP com tratamento de erro melhorado
    # Usar try-catch para capturar exceções sem fazer o script fechar
    # Temporariamente desabilitar ErrorActionPreference para esta função
    $oldErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    
    try {
        $output = & scp $scpArgs 2>&1
        $ErrorActionPreference = $oldErrorAction
        
        # Garantir que sempre retornamos algo, mesmo que seja string vazia
        if ($null -eq $output) {
            return ""
        }
        return $output
    } catch {
        $ErrorActionPreference = $oldErrorAction
        # Capturar exceção e retornar como output para análise
        $errorMsg = if ($null -eq $_) { "Unknown error" } else { $_.ToString() }
        Write-Host "[AVISO] Exceção capturada no SCP: $errorMsg" -ForegroundColor Yellow
        return "SCP_ERROR: $errorMsg"
    }
}

Write-Host "=== Configuração ===" -ForegroundColor Cyan
Write-Host "Servidor: $sshUser@$sshHost" -ForegroundColor Gray
Write-Host "Caminho Cliente: $serverPath" -ForegroundColor Gray
Write-Host "Caminho Raiz: $serverRootPath" -ForegroundColor Gray
Write-Host "PM2 App: $pm2AppName" -ForegroundColor Gray
Write-Host ""

Write-Host "=== 0. Atualizar código do GitHub ===" -ForegroundColor Cyan
$gitUpdateSuccess = $false
try {
    # Procurar repositório Git: primeiro no diretório do script, depois na raiz (um nível acima)
    $gitRoot = $PSScriptRoot
    if (-not (Test-Path (Join-Path $gitRoot ".git"))) {
        $parentDir = Split-Path $PSScriptRoot -Parent
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

# Garantir que estamos no diretório correto antes do build (voltar para o diretório do script)
Set-Location $PSScriptRoot

Write-Host "=== 1. Build Local (versão GitHub mais recente) ===" -ForegroundColor Cyan
if ($gitUpdateSuccess) {
    Write-Host "[INFO] Fazendo build com a versão mais recente do GitHub..." -ForegroundColor Cyan
} else {
    Write-Host "[AVISO] Fazendo build com código local (git pull pode ter falhado)" -ForegroundColor Yellow
}
Write-Host ""
try {
    Set-Location "$PSScriptRoot\client"
    if (-not (Test-Path "$PSScriptRoot\client")) {
        Write-Host "[ERRO] Diretório client não encontrado: $PSScriptRoot\client" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    
    Write-Host "Executando npm run build..." -ForegroundColor Gray
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Build falhou com código: $LASTEXITCODE" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    
    Write-Host "[OK] Build concluído com sucesso!" -ForegroundColor Green
    if ($gitUpdateSuccess) {
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

# Função para limpar espaço no servidor de forma agressiva
function Invoke-ServerCleanup {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost,
        [string]$ServerPath,
        [int]$RequiredSpaceMB = 500
    )
    
    Write-Host "Iniciando limpeza automática do servidor..." -ForegroundColor Cyan
    
    $cleanupCommands = @"
set -e
echo '=== Limpeza Automática do Servidor ==='
echo ''

# 1. Limpar TODOS os diretórios temporários client-dist
echo '1. Limpando diretórios temporários /tmp/client-dist-*...'
FREED_TMP=0
if [ -d /tmp ]; then
    for dir in /tmp/client-dist-*; do
        if [ -d "`$dir" ]; then
            SIZE=`$(du -sm "`$dir" 2>/dev/null | cut -f1 || echo 0)
            rm -rf "`$dir" 2>/dev/null || true
            FREED_TMP=`$((FREED_TMP + SIZE))
        fi
    done
    echo "   Liberados ~`$FREED_TMP MB de /tmp"
fi

# 2. Limpar TODOS os backups dist-old-* (manter apenas o mais recente)
echo ''
echo '2. Limpando backups antigos de dist-old-*...'
FREED_DIST=0
if [ -d "$serverPath" ]; then
    cd "$serverPath" 2>/dev/null || true
    BACKUP_COUNT=`$(ls -d dist-old-* 2>/dev/null | wc -l || echo 0)
    if [ "`$BACKUP_COUNT" -gt 1 ]; then
        # Manter apenas o mais recente, remover todos os outros
        ls -dt dist-old-* 2>/dev/null | tail -n +2 | while read backup; do
            if [ -d "`$backup" ]; then
                SIZE=`$(du -sm "`$backup" 2>/dev/null | cut -f1 || echo 0)
                rm -rf "`$backup" 2>/dev/null || true
                FREED_DIST=`$((FREED_DIST + SIZE))
            fi
        done
        echo "   Liberados ~`$FREED_DIST MB de backups antigos"
    else
        echo "   Nenhum backup antigo encontrado"
    fi
fi

# 3. Limpar logs do PM2
echo ''
echo '3. Limpando logs do PM2...'
if command -v pm2 >/dev/null 2>&1; then
    pm2 flush 2>/dev/null || true
    echo "   Logs do PM2 limpos"
else
    echo "   PM2 não encontrado, ignorando"
fi

# 4. Limpar cache do npm (se existir)
echo ''
echo '4. Limpando cache do npm...'
if command -v npm >/dev/null 2>&1; then
    npm cache clean --force 2>/dev/null || true
    echo "   Cache do npm limpo"
fi

# 5. Limpar logs antigos do sistema (últimos 7 dias)
echo ''
echo '5. Limpando logs antigos do sistema...'
if [ -d /var/log ]; then
    find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    find /var/log -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || true
    echo "   Logs antigos removidos"
fi

# 6. Limpar pacotes .deb antigos (se existirem)
echo ''
echo '6. Limpando pacotes .deb antigos...'
if command -v apt-get >/dev/null 2>&1; then
    apt-get clean 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
    echo "   Cache de pacotes limpo"
fi

# 7. Mostrar espaço atual
echo ''
echo '=== Espaço Disponível Após Limpeza ==='
df -h /tmp | tail -1
df -h / | tail -1
echo ''

# Calcular espaço total liberado
TOTAL_FREED=`$((FREED_TMP + FREED_DIST))
echo "Espaço total liberado: ~`$TOTAL_FREED MB"
"@
    
    try {
        $cleanupOutput = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand $cleanupCommands
        Write-Host $cleanupOutput -ForegroundColor Gray
        
        # Verificar espaço após limpeza
        $diskLine = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "df -BM /tmp 2>/dev/null | tail -1 || df -BM / | tail -1"
        $availableSpaceMB = "0"
        if ($diskLine -match '\s+(\d+)M\s+') {
            $availableSpaceMB = $matches[1]
        } elseif ($diskLine -match '\s+(\d+)G\s+') {
            $availableSpaceMB = [string]([int]$matches[1] * 1024)
        }
        
        return [int]$availableSpaceMB
    } catch {
        Write-Host "Erro ao executar limpeza: $_" -ForegroundColor Yellow
        return 0
    }
}

# Função para verificar espaço disponível
function Get-AvailableSpace {
    param(
        [string]$SshKey,
        [string]$SshUser,
        [string]$SshHost
    )
    
    try {
        $diskLine = Invoke-SshCommand -User $SshUser -SshHost $SshHost -Key $SshKey -BashCommand "df -BM /tmp 2>/dev/null | tail -1 || df -BM / | tail -1"
        if ($LASTEXITCODE -ne 0) {
            return 0
        }
        
        $availableSpaceMB = "0"
        if ($diskLine -match '\s+(\d+)M\s+') {
            $availableSpaceMB = $matches[1]
        } elseif ($diskLine -match '\s+(\d+)G\s+') {
            $availableSpaceMB = [string]([int]$matches[1] * 1024)
        }
        
        return [int]$availableSpaceMB
    } catch {
        return 0
    }
}

Write-Host "=== 2. Enviar build para servidor ===" -ForegroundColor Cyan
if ($gitUpdateSuccess) {
    Write-Host "[INFO] Enviando build da versão mais recente do GitHub para o servidor..." -ForegroundColor Cyan
} else {
    Write-Host "[AVISO] Enviando build do código local (versão GitHub pode não estar atualizada)" -ForegroundColor Yellow
}
Write-Host ""
$tempPath = "/tmp/client-dist-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Verificar espaço em disco antes de fazer upload
Write-Host "Verificando espaço em disco no servidor..." -ForegroundColor Gray
try {
    $diskInfo = Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand "df -h /tmp 2>/dev/null | tail -1 || df -h / | tail -1"
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
$availableSpaceMB = Get-AvailableSpace -SshKey $sshKey -SshUser $sshUser -SshHost $sshHost
Write-Host "Espaço disponível: $availableSpaceMB MB" -ForegroundColor Gray

# Se houver pouco espaço, fazer limpeza automática
$requiredSpaceMB = 500
if ($availableSpaceMB -lt $requiredSpaceMB) {
    Write-Host ""
    Write-Host "AVISO: Pouco espaço em disco ($availableSpaceMB MB disponível, necessário: $requiredSpaceMB MB)" -ForegroundColor Yellow
    Write-Host "Executando limpeza automática do servidor..." -ForegroundColor Cyan
    
    $newSpaceMB = Invoke-ServerCleanup -SshKey $sshKey -SshUser $sshUser -SshHost $sshHost -ServerPath $serverPath -RequiredSpaceMB $requiredSpaceMB
    
    if ($newSpaceMB -lt $requiredSpaceMB) {
        Write-Host ""
        Write-Host "ERRO: Espaço ainda insuficiente após limpeza ($newSpaceMB MB disponível)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Soluções manuais:" -ForegroundColor Yellow
        Write-Host "  1. Verificar o que está ocupando espaço:"
        Write-Host "     ssh $sshUser@$sshHost 'du -sh /tmp/* ~/* 2>/dev/null | sort -h | tail -20'"
        Write-Host "  2. Limpar manualmente builds antigos:"
        Write-Host "     ssh $sshUser@$sshHost 'rm -rf $serverPath/dist-old-*'"
        Write-Host "  3. Limpar node_modules antigos (se houver):"
        Write-Host "     ssh $sshUser@$sshHost 'find ~ -name node_modules -type d -exec du -sh {} \; | sort -h | tail -10'"
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
    $createOutput = Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand $createDirCmd
    
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
            $finalSpaceMB = Invoke-ServerCleanup -SshKey $sshKey -SshUser $sshUser -SshHost $sshHost -ServerPath $serverPath -RequiredSpaceMB 1000
            if ($finalSpaceMB -lt 500) {
                Write-Host "ERRO: Espaço ainda insuficiente após limpeza" -ForegroundColor Red
                Exit-Script -ExitCode 1
            }
            # Tentar criar novamente após limpeza
            $createOutput = Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand $createDirCmd
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
        Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand "rm -rf $tempPath 2>/dev/null; mkdir -p $tempPath && chmod 755 $tempPath" | Out-Null
    }
    
    # Usar scp com compressão e timeout aumentado
    # IMPORTANTE: Enviar conteúdo de dist/* para tempPath diretamente (não dist inteiro)
    # O destino deve terminar com / para que scp coloque os arquivos diretamente no diretório
    Write-Host "Enviando arquivos (pode demorar para arquivos grandes)..." -ForegroundColor Gray
    # Estamos no diretório client após o build, então dist está aqui
    if (-not (Test-Path ".\dist")) {
        Write-Host "[ERRO] Diretório dist não encontrado!" -ForegroundColor Red
        Exit-Script -ExitCode 1
    }
    # Usar scp com wildcard - PowerShell pode não expandir, mas o script no servidor corrige se necessário
    # Tentar enviar conteúdo diretamente usando caminho relativo
    try {
        Write-Host "Executando SCP..." -ForegroundColor Gray
        Write-Host "   Origem: .\dist\*" -ForegroundColor Gray
        $destinoInfo = "${sshUser}@${sshHost}:${tempPath}/"
        Write-Host "   Destino: $destinoInfo" -ForegroundColor Gray
        
        $scpOutput = Invoke-ScpCommand -Source ".\dist\*" -Destination "$tempPath/" -User $sshUser -SshHost $sshHost -Key $sshKey -AdditionalOptions @("-C", "-r")
        
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
    Write-Host "  - Verificar espaço: ssh $sshUser@$sshHost 'df -h'"
    Write-Host "  - Limpar espaço: ssh $sshUser@$sshHost 'du -sh /tmp/client-dist-*'"
    Write-Host "  - Verificar permissões: ssh $sshUser@$sshHost 'ls -ld /tmp'"
    Write-Host ""
    Exit-Script -ExitCode 1
}
Write-Host ""

Write-Host "=== 3. Atualizar no servidor ===" -ForegroundColor Cyan
$sshCommands = @"
cd $serverPath

# Limpar backups antigos ANTES de criar novo (manter apenas os 2 mais recentes)
echo 'Limpando backups antigos (mantendo apenas os 2 mais recentes)...'
ls -dt dist-old-* 2>/dev/null | tail -n +3 | xargs rm -rf 2>/dev/null || true
BACKUP_COUNT=`$(ls -d dist-old-* 2>/dev/null | wc -l)
echo "Mantidos `$BACKUP_COUNT backups recentes"

# Mover novo build para dist
if [ -d $tempPath ]; then
    # PASSO 1: Verificar e corrigir estrutura ANTES de mover
    # Se scp criou tempPath/dist (porque wildcard não expandiu), corrigir
    if [ -d $tempPath/dist ]; then
        echo '[AVISO] Detectado estrutura incorreta (tempPath/dist), corrigindo...'
        # Mover conteúdo de tempPath/dist para tempPath (não criar duplicação)
        mv $tempPath/dist/* $tempPath/ 2>/dev/null || true
        # Tentar mover ficheiros ocultos (pode falhar se não houver, ignorar erro)
        find $tempPath/dist -maxdepth 1 -name '.*' -type f -exec mv {} $tempPath/ \; 2>/dev/null || true
        # Remover diretório dist vazio para evitar duplicação
        rmdir $tempPath/dist 2>/dev/null || true
        echo '[OK] Estrutura corrigida (sem duplicação)'
    fi
    
    # PASSO 2: Verificar se index.html está no local correto (tempPath diretamente)
    if [ ! -f $tempPath/index.html ] && [ -d $tempPath ]; then
        echo '[AVISO] index.html não encontrado diretamente em tempPath, procurando...'
        find $tempPath -name 'index.html' -type f | head -1
    fi
    
    # PASSO 3: Fazer backup do dist atual ANTES de substituir (apenas 1 backup)
    if [ -d dist ]; then
        rm -rf dist-old-previous 2>/dev/null || true
        mv dist dist-old-previous 2>/dev/null || true
        echo '[OK] Backup do dist anterior criado'
    fi
    
    # Mover tempPath para dist (agora garantidamente sem subdiretório dist)
    mv $tempPath dist
    chmod -R 755 dist
    
    # Verificação final: garantir que não há dist/dist
    if [ -d dist/dist ]; then
        echo '[ERRO CRITICO] dist/dist ainda existe após correção!'
        echo 'Corrigindo manualmente...'
        mv dist/dist/* dist/ 2>/dev/null || true
        rmdir dist/dist 2>/dev/null || true
    fi
    
    echo '[OK] Build atualizado no servidor!'
    if [ -f dist/index.html ]; then
        ls -lh dist/index.html
        echo ''
        # Mostrar espaço usado
        du -sh dist
        echo ''
        echo '[OK] Verificação: index.html está no local correto (dist/index.html)'
    else
        echo '[ERRO] dist/index.html não encontrado após atualização'
        echo 'Conteúdo de dist:'
        ls -la dist/ | head -10
        exit 1
    fi
else
    echo '[ERRO] Erro: Diretório temporário não encontrado: $tempPath'
    exit 1
fi
"@
$updateOutput = Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand $($sshCommands.Replace("`r`n", "`n"))
Write-Host $updateOutput -ForegroundColor Gray
if ($LASTEXITCODE -ne 0 -or $updateOutput -match "Erro|error|cannot access") {
    Write-Host "[ERRO] Erro ao atualizar build no servidor!" -ForegroundColor Red
    Write-Host "Verificando estado do servidor..." -ForegroundColor Yellow
    Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand "ls -la $serverPath/ | grep dist" | Out-Host
    Exit-Script -ExitCode 1
}
Write-Host "[OK] Build atualizado no servidor!" -ForegroundColor Green
Write-Host ""

Write-Host "=== 4. Verificar e Corrigir Limite de Upload (Nginx) ===" -ForegroundColor Cyan
Write-Host "[INFO] Verificação do Nginx pulada - configure manualmente se necessário" -ForegroundColor Gray
Write-Host "   Limites do Express já foram ajustados no código (15MB)" -ForegroundColor Gray
$nginxFixOutput = ""

# Verificar se houve aviso sobre sudo
if ($nginxFixOutput -match "precisa de sudo|sudo") {
    Write-Host "[AVISO] Pode ser necessário executar manualmente com sudo:" -ForegroundColor Yellow
    Write-Host "   ssh $sshUser@$sshHost 'sudo systemctl reload nginx'" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=== 4.5. Atualizar código do servidor no servidor remoto ===" -ForegroundColor Cyan
Write-Host "Atualizando código do servidor (server/) no servidor remoto via git pull..." -ForegroundColor Gray
$serverUpdateCommands = @"
cd $serverRootPath
echo '=== Atualizando código do servidor no servidor remoto ==='
echo ''

# Verificar se é repositório Git
if [ -d .git ]; then
    echo 'Repositório Git encontrado'
    echo 'Fazendo git fetch...'
    git fetch origin 2>&1
    FETCH_EXIT=`$?
    
    if [ `$FETCH_EXIT -eq 0 ]; then
        echo 'Fazendo git pull origin main...'
        CURRENT_BRANCH=`$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')
        if [ -z "`$CURRENT_BRANCH" ]; then
            CURRENT_BRANCH='main'
        fi
        echo "Branch atual: `$CURRENT_BRANCH"
        
        git pull origin `$CURRENT_BRANCH 2>&1
        PULL_EXIT=`$?
        
        if [ `$PULL_EXIT -eq 0 ]; then
            echo '[OK] Código do servidor atualizado com sucesso!'
            echo ''
            # Mostrar commit atual
            CURRENT_COMMIT=`$(git rev-parse --short HEAD 2>/dev/null || echo '')
            COMMIT_MSG=`$(git log -1 --pretty=format:"%s" 2>/dev/null || echo '')
            if [ -n "`$CURRENT_COMMIT" ]; then
                echo "Commit atual: `$CURRENT_COMMIT - `$COMMIT_MSG"
            fi
            echo ''
            echo '[OK] Código do servidor está atualizado'
        else
            echo '[AVISO] git pull falhou (código: '$PULL_EXIT')'
            echo 'Continuando com código existente no servidor...'
            echo ''
        fi
    else
        echo '[AVISO] git fetch falhou (código: '$FETCH_EXIT')'
        echo 'Continuando com código existente no servidor...'
        echo ''
    fi
else
    echo '[AVISO] Diretório .git não encontrado em '$serverRootPath
    echo 'Continuando sem atualizar código do servidor...'
    echo ''
fi
"@

$serverUpdateOutput = Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand $serverUpdateCommands
Write-Host $serverUpdateOutput -ForegroundColor Gray
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Pode ter havido problemas ao atualizar código do servidor" -ForegroundColor Yellow
    Write-Host "   Continuando mesmo assim..." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Código do servidor atualizado no servidor remoto!" -ForegroundColor Green
}
Write-Host ""

Write-Host "=== 5. Reiniciar Servidor ===" -ForegroundColor Cyan
Write-Host "Reiniciando servidor PM2..." -ForegroundColor Gray
# Criar comando bash usando here-string com aspas simples para evitar interpretação do PowerShell
$restartCommands = @'
echo 'Status atual do PM2:'
pm2 status $pm2AppName || echo 'App nao encontrado no PM2'
echo ''
echo 'Ultimas linhas dos logs (se houver erros):'
pm2 logs $pm2AppName --lines 10 --nostream 2>&1 | tail -20 || echo 'Nao foi possivel ler logs'
echo ''
echo 'Reiniciando servidor...'
pm2 restart $pm2AppName 2>&1
RESTART_EXIT=$?
if [ $RESTART_EXIT -eq 0 ]; then
    echo 'Servidor reiniciado com sucesso!'
    sleep 3
    echo ''
    echo 'Status do PM2:'
    pm2 status $pm2AppName
    echo ''
    echo 'Verificando processo...'
    PM2_PID=$(pm2 jlist | grep -A 5 "\"name\":\"$pm2AppName\"" | grep -o '"pid":[0-9]*' | cut -d: -f2 | head -1)
    if [ -n "$PM2_PID" ] && [ "$PM2_PID" != "null" ]; then
        echo "PID do servidor: $PM2_PID"
        if ps -p $PM2_PID > /dev/null 2>&1; then
            echo 'Processo esta rodando'
        else
            echo 'AVISO: Processo nao esta mais rodando!'
        fi
    else
        echo 'AVISO: Nao foi possivel obter PID do servidor'
    fi
    echo ''
    echo 'Aguardando servidor iniciar...'
    sleep 3
    echo 'Verificando se servidor backend responde...'
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/health 2>/dev/null || echo '000')
    if [ -z "$HTTP_CODE" ]; then
        HTTP_CODE='000'
    fi
    if [ "$HTTP_CODE" = "200" ]; then
        echo '✅ Backend esta online e respondendo na porta 5000!'
    elif [ "$HTTP_CODE" = "000" ]; then
        echo 'ERRO: Backend nao esta respondendo (curl falhou)'
        echo 'Verificando logs de erro...'
        pm2 logs $pm2AppName --err --lines 20 --nostream 2>&1 | tail -20
    else
        echo "AVISO: Backend respondeu com codigo HTTP $HTTP_CODE"
    fi
    echo ''
    echo 'Parando dev server (instructions-client) se estiver rodando...'
    CLIENT_STATUS=$(pm2 jlist | grep -A 5 "\"name\":\"instructions-client\"" | grep -o '"pm_id":[0-9]*' | cut -d: -f2 | head -1)
    if [ -n "$CLIENT_STATUS" ] && [ "$CLIENT_STATUS" != "null" ]; then
        echo 'Parando instructions-client (dev server)...'
        pm2 stop instructions-client 2>&1 || true
        pm2 delete instructions-client 2>&1 || true
        echo '✅ Dev server parado (produção usa build estático servido pelo Express)'
    else
        echo 'ℹ️  Dev server (instructions-client) nao estava rodando'
    fi
    echo ''
    echo 'Verificando se Express esta servindo build de produção (dist/)...'
    # Verificar se dist/ existe no servidor
    if [ -d "$serverPath/dist" ] && [ -f "$serverPath/dist/index.html" ]; then
        echo '✅ Build de produção encontrado em dist/'
        # Verificar se Express está servindo o frontend corretamente
        FRONTEND_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/ 2>/dev/null || echo '000')
        if [ "$FRONTEND_CODE" = "200" ] || [ "$FRONTEND_CODE" = "304" ]; then
            echo '✅ Express esta servindo o frontend corretamente na porta 5000!'
            # Verificar se é HTML (não JSON da API)
            CONTENT_TYPE=$(curl -s -I http://localhost:5000/ 2>/dev/null | grep -i 'content-type' | cut -d: -f2 | tr -d ' \r\n' || echo '')
            if echo "$CONTENT_TYPE" | grep -qi 'text/html'; then
                echo '✅ Frontend HTML sendo servido corretamente!'
            else
                echo "⚠️  Resposta nao e HTML (Content-Type: $CONTENT_TYPE) - pode estar servindo API info em vez de index.html"
            fi
        else
            echo "⚠️  Express respondeu com codigo HTTP $FRONTEND_CODE na porta 5000"
            echo '💡 Verifique se o Express detectou o dist/ e esta servindo arquivos estaticos'
        fi
    else
        echo '⚠️  Build de producao nao encontrado em dist/'
        echo "   Caminho esperado: $serverPath/dist"
        echo '💡 Certifique-se de que o build foi enviado corretamente'
    fi
else
    echo 'ERRO ao reiniciar servidor PM2'
    echo ''
    echo 'Tentando iniciar o servidor...'
    cd $serverRootPath/server
    pm2 start npm --name $pm2AppName -- start 2>&1 || echo 'Falha ao iniciar servidor'
    pm2 save 2>&1 || true
    echo ''
    echo 'Status final:'
    pm2 status
fi
RESTART_COUNT=$(pm2 jlist | grep -A 10 "\"name\":\"$pm2AppName\"" | grep -o '"restart_time":[0-9]*' | cut -d: -f2 | head -1)
if [ -n "$RESTART_COUNT" ] && [ "$RESTART_COUNT" != "null" ] && [ "$RESTART_COUNT" -gt 10 ] 2>/dev/null; then
    echo ''
    echo "AVISO: Servidor reiniciou $RESTART_COUNT vezes - possivel crash loop"
    echo 'Ultimos logs de erro:'
    pm2 logs $pm2AppName --err --lines 30 --nostream 2>&1 | tail -30
fi
'@ -replace '\$pm2AppName', $pm2AppName -replace '\$serverRootPath', $serverRootPath

Invoke-SshCommand -User $sshUser -SshHost $sshHost -Key $sshKey -BashCommand $restartCommands | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Pode ter havido problemas ao reiniciar o servidor" -ForegroundColor Yellow
    Write-Host "   Verifique manualmente: ssh $sshUser@$sshHost 'pm2 status'" -ForegroundColor Yellow
    Write-Host "   Ver logs: ssh $sshUser@$sshHost 'pm2 logs instructions-server --lines 50'" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Servidor reiniciado com sucesso!" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Build atualizado" -ForegroundColor Green
Write-Host "Servidor reiniciado" -ForegroundColor Green
Write-Host ""
if ($siteUrl) {
    Write-Host "Site disponivel em: $siteUrl" -ForegroundColor Yellow
}
Write-Host ""

# Garantir que o script retorna código de sucesso
Exit-Script -ExitCode 0

