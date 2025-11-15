#!/bin/bash

# Script para corrigir erro 502 Bad Gateway
# Execute no servidor: bash fix-server-502.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnosticando erro 502 Bad Gateway...${NC}"
echo ""

# 1. Verificar Nginx
echo -e "${YELLOW}[1/5] Verificando configuração do Nginx...${NC}"
NGINX_CONFIG="/etc/nginx/sites-enabled/instructions-project"

if [ -f "$NGINX_CONFIG" ]; then
    echo -e "${GREEN}✅ Arquivo de configuração encontrado: $NGINX_CONFIG${NC}"
    
    # Contar client_max_body_size
    CLIENT_MAX_COUNT=$(grep -c "client_max_body_size" "$NGINX_CONFIG" 2>/dev/null || echo "0")
    echo "   Ocorrências de client_max_body_size: $CLIENT_MAX_COUNT"
    
    if [ "$CLIENT_MAX_COUNT" -gt 1 ]; then
        echo -e "${RED}❌ Duplicação detectada!${NC}"
        echo -e "${YELLOW}⚠️  Corrigindo duplicação...${NC}"
        
        # Fazer backup
        BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
        sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
        
        # Remover todas as ocorrências
        sudo sed -i '/client_max_body_size/d' "$NGINX_CONFIG"
        
        # Adicionar uma única ocorrência no bloco server ou http
        if grep -q "^[[:space:]]*server {" "$NGINX_CONFIG"; then
            sudo sed -i '/^[[:space:]]*server {/a\    client_max_body_size 15M;' "$NGINX_CONFIG"
        elif grep -q "^http {" "$NGINX_CONFIG"; then
            sudo sed -i '/^http {/a\    client_max_body_size 15M;' "$NGINX_CONFIG"
        else
            sudo sed -i '1i client_max_body_size 15M;' "$NGINX_CONFIG"
        fi
        
        echo -e "${GREEN}✅ Duplicação corrigida${NC}"
    else
        echo -e "${GREEN}✅ Sem duplicações${NC}"
    fi
    
    # Verificar sintaxe
    echo "   Verificando sintaxe do Nginx..."
    if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
        echo -e "${GREEN}✅ Sintaxe OK${NC}"
        echo "   Recarregando Nginx..."
        sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null
        echo -e "${GREEN}✅ Nginx recarregado${NC}"
    else
        echo -e "${RED}❌ Erro de sintaxe no Nginx!${NC}"
        sudo nginx -t
        echo ""
        echo -e "${YELLOW}💡 Restaurar backup:${NC}"
        echo "   sudo cp $BACKUP_FILE $NGINX_CONFIG"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Arquivo de configuração não encontrado${NC}"
fi
echo ""

# 2. Verificar PM2
echo -e "${YELLOW}[2/5] Verificando status do PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 status
    echo ""
    
    # Verificar app específico
    PM2_APP="instructions-server"
    if pm2 jlist | grep -q "\"name\":\"$PM2_APP\""; then
        echo -e "${GREEN}✅ App $PM2_APP encontrado no PM2${NC}"
        
        # Verificar restart count
        RESTART_COUNT=$(pm2 jlist | grep -A 10 "\"name\":\"$PM2_APP\"" | grep -o '"restart_time":[0-9]*' | cut -d: -f2 | head -1)
        if [ -n "$RESTART_COUNT" ] && [ "$RESTART_COUNT" -gt 10 ]; then
            echo -e "${RED}❌ App reiniciou $RESTART_COUNT vezes (possível crash loop)${NC}"
            echo ""
            echo -e "${YELLOW}📋 Últimos logs de erro:${NC}"
            pm2 logs "$PM2_APP" --err --lines 30 --nostream 2>&1 | tail -30
        fi
    else
        echo -e "${YELLOW}⚠️  App $PM2_APP não encontrado no PM2${NC}"
    fi
else
    echo -e "${RED}❌ PM2 não encontrado${NC}"
fi
echo ""

# 3. Verificar se backend está respondendo
echo -e "${YELLOW}[3/5] Verificando se backend está respondendo...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5000/health 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend está respondendo (HTTP $HTTP_CODE)${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}❌ Backend não está respondendo${NC}"
    echo -e "${YELLOW}💡 Verifique:${NC}"
    echo "   - PM2 status: pm2 status"
    echo "   - Logs: pm2 logs instructions-server --lines 50"
    echo "   - Porta 5000: netstat -tlnp | grep 5000"
else
    echo -e "${YELLOW}⚠️  Backend respondeu com HTTP $HTTP_CODE${NC}"
fi
echo ""

# 4. Verificar proxy_pass no Nginx
echo -e "${YELLOW}[4/5] Verificando proxy_pass no Nginx...${NC}"
if [ -f "$NGINX_CONFIG" ]; then
    if grep -q "proxy_pass" "$NGINX_CONFIG"; then
        echo -e "${GREEN}✅ proxy_pass encontrado${NC}"
        echo "   Configuração:"
        grep "proxy_pass" "$NGINX_CONFIG" | head -3 | sed 's/^/   /'
        
        # Verificar se está apontando para localhost:5000
        if grep -q "proxy_pass.*localhost:5000\|proxy_pass.*127.0.0.1:5000" "$NGINX_CONFIG"; then
            echo -e "${GREEN}✅ proxy_pass aponta para localhost:5000${NC}"
        else
            echo -e "${YELLOW}⚠️  Verifique se proxy_pass está correto${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  proxy_pass não encontrado (servidor pode não estar usando proxy reverso)${NC}"
    fi
fi
echo ""

# 5. Verificar diretório server
echo -e "${YELLOW}[5/5] Verificando diretório server...${NC}"
SERVER_DIR="/home/andre/apps/instructions/instructions-project/server"

if [ -d "$SERVER_DIR" ]; then
    echo -e "${GREEN}✅ Diretório server encontrado${NC}"
    
    if [ -f "$SERVER_DIR/package.json" ]; then
        echo -e "${GREEN}✅ package.json encontrado${NC}"
    else
        echo -e "${RED}❌ package.json não encontrado${NC}"
        echo -e "${YELLOW}💡 Execute: cd $SERVER_DIR && git checkout HEAD -- package.json${NC}"
    fi
    
    if [ -f "$SERVER_DIR/.env" ]; then
        echo -e "${GREEN}✅ .env encontrado${NC}"
    else
        echo -e "${YELLOW}⚠️  .env não encontrado (pode ser necessário criar)${NC}"
    fi
else
    echo -e "${RED}❌ Diretório server não encontrado${NC}"
fi
echo ""

# Resumo
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RESUMO DO DIAGNÓSTICO${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Se o erro 502 persistir, verifique:"
echo "  1. Nginx está rodando: sudo systemctl status nginx"
echo "  2. Backend está rodando: pm2 status"
echo "  3. Logs do backend: pm2 logs instructions-server --lines 50"
echo "  4. Logs do Nginx: sudo tail -50 /var/log/nginx/error.log"
echo "  5. Porta 5000: netstat -tlnp | grep 5000"
echo ""
echo -e "${GREEN}✅ Diagnóstico concluído!${NC}"

