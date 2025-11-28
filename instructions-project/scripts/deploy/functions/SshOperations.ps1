# SshOperations.ps1
# Funções de comunicação SSH/SCP

# Função auxiliar para obter comando nginx fix codificado em base64
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
    # Normalizar quebras de linha para Unix (\n) para evitar erros com \r no bash
    $normalizedCmd = $BashCommand -replace "`r`n", "`n" -replace "`r", ""
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($normalizedCmd)
    $encoded = [Convert]::ToBase64String($bytes)
        
    # Adicionar comando bash como elemento único do array (PowerShell manterá como string única)
    $bashCmd = "bash -c 'echo $encoded | base64 -d | bash'"
    $sshCmdParts += $bashCmd
  }
  else {
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
  }
  catch {
    $ErrorActionPreference = $oldErrorAction
    # Capturar exceção e retornar como output para análise
    $errorMsg = if ($null -eq $_) { "Unknown error" } else { $_.ToString() }
    Write-Host "[AVISO] Exceção capturada no SCP: $errorMsg" -ForegroundColor Yellow
    return "SCP_ERROR: $errorMsg"
  }
}

