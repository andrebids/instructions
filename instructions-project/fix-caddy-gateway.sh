#!/bin/bash

# Script para configurar Caddy no servidor GATEWAY
# Este script deve ser executado no servidor onde o Caddy está rodando
# (provavelmente o servidor com IP público 95.136.9.53)

set -e

echo "=========================================="
echo "Configuração do Caddy no Gateway"
echo "=========================================="
echo ""
echo "Este script configura o Caddy para fazer proxy reverso"
echo "para o servidor Express em 192.168.2.77:5000"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado com sudo"
    echo "💡 Execute: sudo bash fix-caddy-gateway.sh"
    exit 1
fi

CADDYFILE="/etc/caddy/Caddyfile"
BACKUP_FILE="/etc/caddy/Caddyfile.backup.$(date +%Y%m%d_%H%M%S)"

# Verificar se Caddyfile existe
if [ ! -f "$CADDYFILE" ]; then
    echo "❌ Caddyfile não encontrado em $CADDYFILE"
    echo "📝 Criando novo Caddyfile..."
    
    mkdir -p /etc/caddy
    
    cat > "$CADDYFILE" << 'EOF'
thecore.dsproject.pt {
    reverse_proxy 192.168.2.77:3003
    encode zstd gzip
    
    # Headers de segurança
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF
    echo "✅ Novo Caddyfile criado"
else
    echo "✅ Caddyfile encontrado"
    echo ""
    echo "📋 Conteúdo atual:"
    echo "----------------------------------------"
    cat "$CADDYFILE"
    echo "----------------------------------------"
    echo ""
    
    # Fazer backup
    cp "$CADDYFILE" "$BACKUP_FILE"
    echo "💾 Backup criado: $BACKUP_FILE"
    echo ""
    
    # Verificar se já tem configuração para thecore.dsproject.pt
    if grep -q "thecore.dsproject.pt" "$CADDYFILE"; then
        echo "✅ Configuração para thecore.dsproject.pt encontrada"
        
        # Verificar se está apontando para o IP correto
        if grep -q "reverse_proxy.*192.168.2.77:3003" "$CADDYFILE"; then
            echo "✅ Já está configurado para 192.168.2.77:3003"
        else
            echo "⚠️  Configuração não está apontando para 192.168.2.77:3003"
            echo "📝 Atualizando configuração..."
            
            # Remover configuração antiga do thecore
            sed -i '/thecore\.dsproject\.pt/,/^}/d' "$CADDYFILE"
            
            # Adicionar nova configuração
            cat >> "$CADDYFILE" << 'EOF'

thecore.dsproject.pt {
    reverse_proxy 192.168.2.77:3003
    encode zstd gzip
    
    # Headers de segurança
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF
            echo "✅ Configuração atualizada"
        fi
    else
        echo "⚠️  Configuração para thecore.dsproject.pt NÃO encontrada"
        echo "📝 Adicionando configuração..."
        cat >> "$CADDYFILE" << 'EOF'

thecore.dsproject.pt {
    reverse_proxy 192.168.2.77:3003
    encode zstd gzip
    
    # Headers de segurança
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF
        echo "✅ Configuração adicionada"
    fi
fi

echo ""
echo "=========================================="
echo "Validando configuração"
echo "=========================================="
if command -v caddy >/dev/null 2>&1; then
    if caddy validate --config "$CADDYFILE" 2>&1; then
        echo "✅ Configuração válida!"
    else
        echo "❌ Erro na validação da configuração"
        echo "💡 Restaurando backup..."
        cp "$BACKUP_FILE" "$CADDYFILE"
        exit 1
    fi
else
    echo "⚠️  Caddy não encontrado no PATH, pulando validação"
fi

echo ""
echo "=========================================="
echo "Recarregando Caddy"
echo "=========================================="
if systemctl is-active --quiet caddy; then
    echo "🔄 Recarregando Caddy..."
    systemctl reload caddy
    echo "✅ Caddy recarregado"
else
    echo "⚠️  Caddy não está rodando"
    echo "💡 Iniciando Caddy..."
    systemctl start caddy || echo "❌ Não foi possível iniciar o Caddy"
fi

echo ""
echo "=========================================="
echo "Verificando status"
echo "=========================================="
sleep 2
systemctl status caddy --no-pager -l | head -15

echo ""
echo "=========================================="
echo "Testando conectividade"
echo "=========================================="
echo "Testando frontend em 192.168.2.77:3003..."
if curl -s -f --connect-timeout 5 http://192.168.2.77:3003/ > /dev/null 2>&1; then
    echo "✅ Frontend respondendo em 192.168.2.77:3003"
else
    echo "⚠️  Frontend não está respondendo em 192.168.2.77:3003"
    echo "💡 Verifique se o instructions-client está rodando: ssh dev 'pm2 status'"
fi

echo ""
echo "Testando https://thecore.dsproject.pt/health..."
sleep 3
if curl -s -f -k https://thecore.dsproject.pt/health > /dev/null 2>&1; then
    echo "✅ Site respondendo corretamente!"
else
    echo "⚠️  Site ainda não está respondendo"
    echo "💡 Aguarde alguns segundos e tente novamente"
fi

echo ""
echo "=========================================="
echo "✅ Processo concluído!"
echo "=========================================="

