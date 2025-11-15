#!/bin/bash

# Script de diagnóstico e correção completa para erro 413
# Execute diretamente no servidor: bash diagnose-fix-413.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  DIAGNÓSTICO E CORREÇÃO ERRO 413${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. Verificar proxies reversos instalados
echo -e "${YELLOW}[1/6] Verificando proxies reversos instalados...${NC}"
HAS_NGINX=false
HAS_APACHE=false

if command -v nginx &> /dev/null; then
    HAS_NGINX=true
    NGINX_VERSION=$(nginx -v 2>&1 | head -1)
    echo -e "${GREEN}✅ Nginx encontrado: $NGINX_VERSION${NC}"
else
    echo -e "${YELLOW}ℹ️  Nginx não encontrado${NC}"
fi

if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    HAS_APACHE=true
    APACHE_CMD=$(command -v apache2 || command -v httpd)
    echo -e "${GREEN}✅ Apache encontrado: $APACHE_CMD${NC}"
else
    echo -e "${YELLOW}ℹ️  Apache não encontrado${NC}"
fi

if [ "$HAS_NGINX" = false ] && [ "$HAS_APACHE" = false ]; then
    echo -e "${GREEN}✅ Nenhum proxy reverso encontrado (servidor rodando diretamente)${NC}"
    echo -e "${YELLOW}💡 O erro 413 pode vir de outro lugar. Verificando Express...${NC}"
fi

echo ""

# 2. Corrigir Nginx se instalado
if [ "$HAS_NGINX" = true ]; then
    echo -e "${YELLOW}[2/6] Corrigindo configuração do Nginx...${NC}"
    
    NGINX_CONF="/etc/nginx/nginx.conf"
    NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
    CONFIG_FILE=""
    
    # Encontrar arquivo de configuração
    if [ -d "$NGINX_SITES_ENABLED" ]; then
        for file in "$NGINX_SITES_ENABLED"/*; do
            if [ -f "$file" ] && grep -q "proxy_pass\|upstream" "$file" 2>/dev/null; then
                CONFIG_FILE="$file"
                echo -e "${GREEN}✅ Arquivo encontrado: $file${NC}"
                break
            fi
        done
    fi
    
    if [ -z "$CONFIG_FILE" ]; then
        CONFIG_FILE="$NGINX_CONF"
    fi
    
    if [ ! -f "$CONFIG_FILE" ]; then
        echo -e "${RED}❌ Arquivo de configuração não encontrado: $CONFIG_FILE${NC}"
    else
        echo -e "${BLUE}📄 Arquivo: $CONFIG_FILE${NC}"
        
        # Verificar limite atual
        if grep -q "client_max_body_size" "$CONFIG_FILE"; then
            CURRENT_LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk '{print $2}' | tr -d ';')
            echo -e "${YELLOW}📊 Limite atual: $CURRENT_LIMIT${NC}"
            
            CURRENT_MB=$(echo "$CURRENT_LIMIT" | sed 's/[^0-9]//g')
            if [ -z "$CURRENT_MB" ] || [ "$CURRENT_MB" -lt 15 ]; then
                echo -e "${YELLOW}⚠️  Limite muito baixo! Ajustando para 15MB...${NC}"
                
                # Backup
                BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
                cp "$CONFIG_FILE" "$BACKUP_FILE"
                echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
                
                # Atualizar limite
                sed -i 's/client_max_body_size.*/client_max_body_size 15M;/' "$CONFIG_FILE"
                echo -e "${GREEN}✅ Limite atualizado para 15M${NC}"
                
                # Verificar sintaxe
                if nginx -t 2>&1 | grep -q "syntax is ok"; then
                    echo -e "${GREEN}✅ Sintaxe OK${NC}"
                    
                    # Tentar recarregar
                    if systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null; then
                        echo -e "${GREEN}✅ Nginx recarregado com sucesso!${NC}"
                    else
                        echo -e "${YELLOW}⚠️  Não foi possível recarregar automaticamente${NC}"
                        echo -e "${YELLOW}💡 Execute manualmente: sudo systemctl reload nginx${NC}"
                    fi
                else
                    echo -e "${RED}❌ Erro na sintaxe! Restaurando backup...${NC}"
                    cp "$BACKUP_FILE" "$CONFIG_FILE"
                    nginx -t
                fi
            else
                echo -e "${GREEN}✅ Limite já está adequado ($CURRENT_LIMIT)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  client_max_body_size não encontrado. Adicionando...${NC}"
            
            # Backup
            BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
            
            # Adicionar limite
            if grep -q "^http {" "$CONFIG_FILE"; then
                sed -i '/^http {/a\    client_max_body_size 15M;' "$CONFIG_FILE"
            else
                sed -i '1i client_max_body_size 15M;' "$CONFIG_FILE"
            fi
            
            echo -e "${GREEN}✅ client_max_body_size 15M adicionado${NC}"
            
            # Verificar sintaxe
            if nginx -t 2>&1 | grep -q "syntax is ok"; then
                echo -e "${GREEN}✅ Sintaxe OK${NC}"
                
                # Tentar recarregar
                if systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null; then
                    echo -e "${GREEN}✅ Nginx recarregado com sucesso!${NC}"
                else
                    echo -e "${YELLOW}⚠️  Não foi possível recarregar automaticamente${NC}"
                    echo -e "${YELLOW}💡 Execute manualmente: sudo systemctl reload nginx${NC}"
                fi
            else
                echo -e "${RED}❌ Erro na sintaxe! Restaurando backup...${NC}"
                cp "$BACKUP_FILE" "$CONFIG_FILE"
                nginx -t
            fi
        fi
    fi
fi

echo ""

# 3. Corrigir Apache se instalado
if [ "$HAS_APACHE" = true ]; then
    echo -e "${YELLOW}[3/6] Corrigindo configuração do Apache...${NC}"
    
    APACHE_CONF="/etc/apache2/apache2.conf"
    if [ ! -f "$APACHE_CONF" ]; then
        APACHE_CONF="/etc/httpd/httpd.conf"
    fi
    
    if [ -f "$APACHE_CONF" ]; then
        echo -e "${BLUE}📄 Arquivo: $APACHE_CONF${NC}"
        
        if grep -q "LimitRequestBody" "$APACHE_CONF"; then
            CURRENT_LIMIT=$(grep "LimitRequestBody" "$APACHE_CONF" | head -1 | awk '{print $2}')
            echo -e "${YELLOW}📊 Limite atual: $CURRENT_LIMIT${NC}"
            
            if [ -z "$CURRENT_LIMIT" ] || [ "$CURRENT_LIMIT" -lt 15728640 ]; then
                echo -e "${YELLOW}⚠️  Ajustando para 15MB (15728640 bytes)...${NC}"
                BACKUP_FILE="${APACHE_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
                cp "$APACHE_CONF" "$BACKUP_FILE"
                sed -i 's/^LimitRequestBody.*/LimitRequestBody 15728640/' "$APACHE_CONF"
                echo -e "${GREEN}✅ Limite atualizado${NC}"
                echo -e "${YELLOW}💡 Execute: sudo systemctl reload apache2${NC}"
            else
                echo -e "${GREEN}✅ Limite já está adequado${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Adicionando LimitRequestBody...${NC}"
            BACKUP_FILE="${APACHE_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$APACHE_CONF" "$BACKUP_FILE"
            echo "LimitRequestBody 15728640" >> "$APACHE_CONF"
            echo -e "${GREEN}✅ LimitRequestBody adicionado${NC}"
            echo -e "${YELLOW}💡 Execute: sudo systemctl reload apache2${NC}"
        fi
    fi
fi

echo ""

# 4. Verificar Express/Node.js
echo -e "${YELLOW}[4/6] Verificando configuração do Express...${NC}"
PROJECT_ROOT="/home/andre/apps/instructions/instructions-project"
SERVER_DIR="${PROJECT_ROOT}/server"

if [ -d "$SERVER_DIR" ]; then
    APP_JS="${SERVER_DIR}/src/app.js"
    if [ -f "$APP_JS" ]; then
        echo -e "${BLUE}📄 Verificando: $APP_JS${NC}"
        
        if grep -q "express.json({ limit:" "$APP_JS" || grep -q "express.json()" "$APP_JS"; then
            if grep -q "express.json({ limit: '50mb' })" "$APP_JS" || grep -q "express.json({ limit: \"50mb\" })" "$APP_JS"; then
                echo -e "${GREEN}✅ Express já configurado com limite de 50MB${NC}"
            else
                echo -e "${YELLOW}⚠️  Express pode precisar de ajuste${NC}"
                echo -e "${YELLOW}💡 Verifique se app.js tem: express.json({ limit: '50mb' })${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Não encontrado express.json em app.js${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  app.js não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Diretório do servidor não encontrado${NC}"
fi

echo ""

# 5. Reiniciar PM2
echo -e "${YELLOW}[5/6] Reiniciando servidor Node.js...${NC}"
if command -v pm2 &> /dev/null; then
    PM2_APP="instructions-server"
    if pm2 list | grep -q "$PM2_APP"; then
        echo -e "${BLUE}🔄 Reiniciando $PM2_APP...${NC}"
        pm2 restart "$PM2_APP"
        sleep 2
        pm2 status "$PM2_APP"
        echo -e "${GREEN}✅ Servidor reiniciado${NC}"
    else
        echo -e "${YELLOW}⚠️  App PM2 '$PM2_APP' não encontrado${NC}"
        pm2 list
    fi
else
    echo -e "${YELLOW}⚠️  PM2 não encontrado${NC}"
fi

echo ""

# 6. Teste final
echo -e "${YELLOW}[6/6] Testando configuração...${NC}"
echo -e "${BLUE}💡 Para testar, tente fazer upload de uma imagem${NC}"
echo -e "${BLUE}💡 Se ainda tiver erro 413, verifique:${NC}"
echo "   1. Se há outro proxy reverso na frente (load balancer, CDN)"
echo "   2. Se há configurações de firewall/proxy"
echo "   3. Logs do nginx: sudo tail -f /var/log/nginx/error.log"
echo "   4. Logs do PM2: pm2 logs instructions-server"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  DIAGNÓSTICO CONCLUÍDO${NC}"
echo -e "${GREEN}========================================${NC}"

