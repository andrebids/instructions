#!/bin/bash
# Script para testar a conexão SMB com o TrueNAS
# Usa as credenciais do arquivo .env se disponíveis

set -e

echo "🔍 Testando conexão SMB com TrueNAS..."
echo "=================================================="

# Carregar variáveis do .env se existir
if [ -f "/app/.env" ]; then
    echo "📄 Carregando variáveis do arquivo .env..."
    export $(grep -v '^#' /app/.env | grep -E '^SMB_' | xargs)
fi

# Usar variáveis de ambiente ou valores padrão
SMB_SHARE="${SMB_SHARE:-//192.168.2.22/Olimpo/.dev/web/thecore}"
SMB_USER="${SMB_USER:-guest}"
SMB_PASS="${SMB_PASS:-}"
MOUNT_POINT="/tmp/test_smb_mount"
PRODUCTS_PATH="$MOUNT_POINT/products"

echo ""
echo "📋 Configuração:"
echo "   Share: $SMB_SHARE"
echo "   User: ${SMB_USER:-guest (anônimo)}"
echo "   Mount Point: $MOUNT_POINT"
echo ""

# Limpar montagem anterior se existir
if mountpoint -q "$MOUNT_POINT" 2>/dev/null; then
    echo "🧹 Desmontando montagem anterior..."
    umount "$MOUNT_POINT" 2>/dev/null || true
fi

# Criar diretório de teste
mkdir -p "$MOUNT_POINT"

# Preparar opções de montagem
if [ -n "$SMB_PASS" ] && [ "$SMB_USER" != "guest" ]; then
    echo "🔐 Usando autenticação com credenciais..."
    CREDS_FILE="/tmp/test_smb_creds"
    echo "username=$SMB_USER" > "$CREDS_FILE"
    echo "password=$SMB_PASS" >> "$CREDS_FILE"
    chmod 600 "$CREDS_FILE"
    MOUNT_OPTS="credentials=$CREDS_FILE,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777"
else
    echo "👤 Tentando acesso guest/anônimo..."
    MOUNT_OPTS="guest,uid=1000,gid=1000,iocharset=utf8,file_mode=0777,dir_mode=0777"
fi

# Tentar montar
echo ""
echo "📁 Montando compartilhamento SMB..."
if mount -t cifs "$SMB_SHARE" "$MOUNT_POINT" -o "$MOUNT_OPTS"; then
    echo "✅ SMB montado com sucesso!"
    echo ""
    
    # Verificar se o diretório de produtos existe
    if [ -d "$PRODUCTS_PATH" ]; then
        echo "✅ Diretório 'products' encontrado!"
        echo ""
        
        # Contar arquivos
        TOTAL_FILES=$(find "$PRODUCTS_PATH" -type f | wc -l)
        IMAGE_FILES=$(find "$PRODUCTS_PATH" -type f \( -iname "*.webp" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)
        TEMP_FILES=$(find "$PRODUCTS_PATH" -type f -name "temp_*" | wc -l)
        REAL_FILES=$((TOTAL_FILES - TEMP_FILES))
        
        echo "📊 Estatísticas:"
        echo "   Total de arquivos: $TOTAL_FILES"
        echo "   Imagens (webp/jpg/png): $IMAGE_FILES"
        echo "   Arquivos temporários: $TEMP_FILES"
        echo "   Arquivos reais: $REAL_FILES"
        echo ""
        
        # Listar alguns arquivos
        echo "📁 Primeiros 10 arquivos encontrados:"
        ls -lh "$PRODUCTS_PATH" | head -11 | tail -10 | awk '{print "   " $9 " (" $5 ")"}'
        echo ""
        
        # Testar leitura de um arquivo
        FIRST_FILE=$(find "$PRODUCTS_PATH" -type f -name "*.webp" | head -1)
        if [ -n "$FIRST_FILE" ]; then
            FILE_SIZE=$(stat -f%z "$FIRST_FILE" 2>/dev/null || stat -c%s "$FIRST_FILE" 2>/dev/null || echo "0")
            echo "✅ Teste de leitura:"
            echo "   Arquivo: $(basename "$FIRST_FILE")"
            echo "   Tamanho: $FILE_SIZE bytes"
            if [ "$FILE_SIZE" -gt 0 ]; then
                echo "   Status: ✅ Arquivo acessível e legível"
            else
                echo "   Status: ⚠️ Arquivo vazio ou não legível"
            fi
        fi
        
    else
        echo "⚠️ Diretório 'products' não encontrado em $MOUNT_POINT"
        echo "📁 Conteúdo do mount point:"
        ls -la "$MOUNT_POINT" | head -10
    fi
    
    # Desmontar
    echo ""
    echo "🧹 Desmontando..."
    umount "$MOUNT_POINT"
    rmdir "$MOUNT_POINT"
    
    # Limpar credenciais
    [ -f "$CREDS_FILE" ] && rm -f "$CREDS_FILE"
    
    echo ""
    echo "=================================================="
    echo "✅ Teste concluído com sucesso!"
    echo "=================================================="
    exit 0
    
else
    echo "❌ Falha ao montar SMB!"
    echo ""
    echo "Possíveis causas:"
    echo "   1. Credenciais incorretas (verifique SMB_USER e SMB_PASS no .env)"
    echo "   2. Serviço SMB não está ativo no TrueNAS"
    echo "   3. Caminho do compartilhamento incorreto"
    echo "   4. Problemas de rede/firewall"
    echo ""
    echo "💡 Dicas:"
    echo "   - Verifique se o serviço SMB está ativo no TrueNAS"
    echo "   - Teste o acesso manualmente: smbclient //192.168.2.22/Olimpo -U seu_usuario"
    echo "   - Verifique as credenciais no arquivo .env"
    
    # Limpar
    rmdir "$MOUNT_POINT" 2>/dev/null || true
    [ -f "$CREDS_FILE" ] && rm -f "$CREDS_FILE"
    
    echo ""
    echo "=================================================="
    echo "❌ Teste falhou!"
    echo "=================================================="
    exit 1
fi

