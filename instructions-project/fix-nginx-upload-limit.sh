#!/bin/bash

# Script para corrigir limite de upload no nginx
# Execute este script no servidor SSH onde a aplicação está hospedada
# Uso: ssh usuario@servidor 'bash -s' < fix-nginx-upload-limit.sh
# Ou copie para o servidor e execute diretamente

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Verificando configuração do nginx...${NC}"

# Verificar se nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx não encontrado. Verificando se há outro proxy reverso...${NC}"
    
    # Verificar se há Apache
    if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
        echo -e "${YELLOW}⚠️  Apache encontrado. Para Apache, ajuste: LimitRequestBody no httpd.conf${NC}"
        echo "   Adicione: LimitRequestBody 52428800  # 50MB"
    fi
    
    # Verificar se está usando PM2 diretamente (sem proxy)
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✅ PM2 encontrado. O servidor pode estar rodando diretamente sem proxy reverso.${NC}"
        echo -e "${GREEN}✅ Os limites do Express já foram ajustados no código.${NC}"
        echo ""
        echo -e "${YELLOW}💡 Se ainda tiver erro 413, verifique:${NC}"
        echo "   1. Se há um proxy reverso em outro servidor"
        echo "   2. Se há um load balancer na frente"
        echo "   3. Se há configurações de firewall/proxy no servidor"
    fi
    
    exit 0
fi

# Encontrar arquivo de configuração do nginx
NGINX_CONF="/etc/nginx/nginx.conf"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# Verificar qual arquivo de configuração usar
CONFIG_FILE=""

# Verificar se há sites-available (Ubuntu/Debian)
if [ -d "$NGINX_SITES_ENABLED" ]; then
    echo -e "${GREEN}📁 Verificando sites habilitados...${NC}"
    # Procurar por arquivos de configuração que possam estar servindo a aplicação
    for file in "$NGINX_SITES_ENABLED"/*; do
        if [ -f "$file" ] && grep -q "proxy_pass\|upstream" "$file" 2>/dev/null; then
            CONFIG_FILE="$file"
            echo -e "${GREEN}✅ Encontrado: $file${NC}"
            break
        fi
    done
fi

# Se não encontrou, usar nginx.conf principal
if [ -z "$CONFIG_FILE" ]; then
    CONFIG_FILE="$NGINX_CONF"
fi

if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ Arquivo de configuração não encontrado: $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}📄 Arquivo de configuração: $CONFIG_FILE${NC}"

# Verificar se já tem client_max_body_size configurado
if grep -q "client_max_body_size" "$CONFIG_FILE"; then
    CURRENT_LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk '{print $2}' | tr -d ';')
    echo -e "${YELLOW}⚠️  Limite atual encontrado: $CURRENT_LIMIT${NC}"
    
    # Verificar se o limite é muito baixo (menor que 15MB)
    CURRENT_MB=$(echo "$CURRENT_LIMIT" | sed 's/[^0-9]//g')
    if [ -z "$CURRENT_MB" ] || [ "$CURRENT_MB" -lt 15 ]; then
        echo -e "${YELLOW}⚠️  Limite muito baixo! Ajustando para 15MB...${NC}"
        
        # Fazer backup
        cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        echo -e "${GREEN}✅ Backup criado${NC}"
        
        # Substituir o limite existente
        sed -i 's/client_max_body_size.*/client_max_body_size 15M;/' "$CONFIG_FILE"
        echo -e "${GREEN}✅ Limite atualizado para 15MB${NC}"
    else
        echo -e "${GREEN}✅ Limite já está adequado ($CURRENT_LIMIT)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  client_max_body_size não encontrado. Adicionando...${NC}"
    
    # Fazer backup
    cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup criado${NC}"
    
    # Adicionar no bloco http (se existir) ou no início do arquivo
    if grep -q "^http {" "$CONFIG_FILE"; then
        # Adicionar após a linha "http {"
        sed -i '/^http {/a\    client_max_body_size 15M;' "$CONFIG_FILE"
    else
        # Adicionar no início do arquivo
        sed -i '1i client_max_body_size 15M;' "$CONFIG_FILE"
    fi
    
    echo -e "${GREEN}✅ client_max_body_size 15M adicionado${NC}"
fi

# Verificar sintaxe do nginx
echo -e "${YELLOW}🔍 Verificando sintaxe do nginx...${NC}"
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✅ Sintaxe OK${NC}"
    
    # Tentar recarregar nginx automaticamente
    echo ""
    echo -e "${YELLOW}🔄 Tentando recarregar nginx...${NC}"
    if systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx recarregado com sucesso!${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível recarregar automaticamente${NC}"
        echo -e "${YELLOW}💡 Execute manualmente:${NC}"
        echo "   sudo systemctl reload nginx"
        echo "   ou"
        echo "   sudo nginx -s reload"
    fi
    echo ""
    echo -e "${GREEN}✅ Configuração atualizada com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na sintaxe do nginx!${NC}"
    nginx -t
    echo ""
    echo -e "${YELLOW}💡 Restaurar backup se necessário:${NC}"
    echo "   cp ${CONFIG_FILE}.backup.* $CONFIG_FILE"
    exit 1
fi

