#!/bin/bash

# Script para corrigir limite de upload no nginx
# Execute este script no servidor SSH onde a aplicação está hospedada
# Uso: ssh usuario@servidor 'bash -s' < fix-nginx-upload-limit.sh
# Ou copie para o servidor e execute diretamente

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Verificando configuração do nginx e proxies reversos...${NC}"

NGINX_FOUND=false
NGINX_IN_DOCKER=false

# Verificar se nginx está instalado diretamente
if command -v nginx &> /dev/null; then
    NGINX_FOUND=true
    echo -e "${GREEN}✅ Nginx encontrado no sistema${NC}"
fi

# Verificar se há nginx rodando em Docker
if docker ps 2>/dev/null | grep -q nginx; then
    NGINX_IN_DOCKER=true
    NGINX_FOUND=true
    echo -e "${BLUE}🐳 Nginx encontrado rodando em Docker${NC}"
    docker ps | grep nginx
fi

# Verificar processos na porta 80/443 (pode indicar proxy reverso)
echo -e "${BLUE}🔍 Verificando processos nas portas 80 e 443...${NC}"
PROCESS_ON_80=""
PROCESS_ON_443=""
if command -v netstat &> /dev/null; then
    PROCESS_ON_80=$(sudo netstat -tlnp 2>/dev/null | grep ':80 ' | head -1 || netstat -tlnp 2>/dev/null | grep ':80 ' | head -1)
    PROCESS_ON_443=$(sudo netstat -tlnp 2>/dev/null | grep ':443 ' | head -1 || netstat -tlnp 2>/dev/null | grep ':443 ' | head -1)
elif command -v ss &> /dev/null; then
    PROCESS_ON_80=$(sudo ss -tlnp 2>/dev/null | grep ':80 ' | head -1 || ss -tlnp 2>/dev/null | grep ':80 ' | head -1)
    PROCESS_ON_443=$(sudo ss -tlnp 2>/dev/null | grep ':443 ' | head -1 || ss -tlnp 2>/dev/null | grep ':443 ' | head -1)
fi

if [ -n "$PROCESS_ON_80" ] || [ -n "$PROCESS_ON_443" ]; then
    echo -e "${YELLOW}⚠️  Processos encontrados nas portas 80/443:${NC}"
    [ -n "$PROCESS_ON_80" ] && echo "   Porta 80: $PROCESS_ON_80"
    [ -n "$PROCESS_ON_443" ] && echo "   Porta 443: $PROCESS_ON_443"
    
    # Tentar identificar o processo usando lsof ou fuser
    PROCESS_NAME=""
    if command -v lsof &> /dev/null; then
        PROCESS_NAME=$(sudo lsof -i :80 -i :443 2>/dev/null | grep LISTEN | head -1 | awk '{print $1}' || lsof -i :80 -i :443 2>/dev/null | grep LISTEN | head -1 | awk '{print $1}')
    elif command -v fuser &> /dev/null; then
        PROCESS_NAME=$(sudo fuser 80/tcp 443/tcp 2>/dev/null | head -1 || fuser 80/tcp 443/tcp 2>/dev/null | head -1)
    fi
    
    if [ -n "$PROCESS_NAME" ]; then
        echo -e "${BLUE}   Processo identificado: $PROCESS_NAME${NC}"
        
        if echo "$PROCESS_NAME" | grep -qi nginx; then
            echo -e "${GREEN}✅ Nginx detectado nas portas 80/443!${NC}"
            NGINX_FOUND=true
        elif echo "$PROCESS_NAME" | grep -qi apache; then
            echo -e "${YELLOW}⚠️  Apache detectado nas portas 80/443${NC}"
            echo -e "${YELLOW}💡 Para Apache, ajuste LimitRequestBody no httpd.conf${NC}"
        else
            echo -e "${YELLOW}⚠️  Processo '$PROCESS_NAME' encontrado nas portas 80/443${NC}"
            # Tentar encontrar arquivos de configuração comuns mesmo sem nginx no PATH
            if [ -f "/etc/nginx/nginx.conf" ] || [ -d "/etc/nginx/sites-enabled" ]; then
                echo -e "${GREEN}✅ Arquivos de configuração do nginx encontrados!${NC}"
                NGINX_FOUND=true
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Não foi possível identificar o processo (pode precisar de sudo)${NC}"
        # Tentar encontrar arquivos de configuração mesmo assim
        if [ -f "/etc/nginx/nginx.conf" ] || [ -d "/etc/nginx/sites-enabled" ]; then
            echo -e "${GREEN}✅ Arquivos de configuração do nginx encontrados! Tentando ajustar...${NC}"
            NGINX_FOUND=true
        fi
    fi
else
    echo "   Nenhum processo encontrado nas portas 80/443"
fi

# Verificar se há Apache
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    echo -e "${YELLOW}⚠️  Apache encontrado. Para Apache, ajuste: LimitRequestBody no httpd.conf${NC}"
    echo "   Adicione: LimitRequestBody 52428800  # 50MB"
fi

# Se não encontrou nginx, verificar outras possibilidades
if [ "$NGINX_FOUND" = false ]; then
    echo -e "${YELLOW}⚠️  Nginx não encontrado diretamente. Verificando outras possibilidades...${NC}"
    
    # Verificar se está usando PM2 diretamente (sem proxy)
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✅ PM2 encontrado. O servidor pode estar rodando diretamente sem proxy reverso.${NC}"
        echo -e "${GREEN}✅ Os limites do Express já foram ajustados no código (15MB).${NC}"
        echo ""
        echo -e "${YELLOW}💡 Se ainda tiver erro 413, verifique:${NC}"
        echo "   1. Se há um proxy reverso em outro servidor (load balancer)"
        echo "   2. Se há um nginx rodando em Docker (verifique: docker ps | grep nginx)"
        echo "   3. Se há configurações de firewall/proxy no servidor"
        echo "   4. Se o servidor está acessível via HTTPS (geralmente requer proxy reverso)"
        echo ""
        echo -e "${BLUE}💡 Para verificar nginx em Docker:${NC}"
        echo "   docker ps | grep nginx"
        echo "   docker exec -it <container> nginx -t"
        echo ""
        echo -e "${BLUE}💡 Para verificar processos nas portas:${NC}"
        echo "   sudo netstat -tlnp | grep -E ':(80|443)'"
        echo "   ou"
        echo "   sudo ss -tlnp | grep -E ':(80|443)'"
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

# Variável para guardar nome do backup (usada no tratamento de erros)
BACKUP_FILE=""

# Se nginx está em Docker, precisamos ajustar dentro do container
if [ "$NGINX_IN_DOCKER" = true ]; then
    echo -e "${BLUE}🐳 Nginx está em Docker. Verificando containers...${NC}"
    NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i nginx | head -1)
    if [ -n "$NGINX_CONTAINER" ]; then
        echo -e "${GREEN}✅ Container encontrado: $NGINX_CONTAINER${NC}"
        echo -e "${YELLOW}⚠️  Para ajustar nginx em Docker, execute manualmente:${NC}"
        echo "   docker exec -it $NGINX_CONTAINER bash"
        echo "   # Dentro do container, edite o arquivo de configuração"
        echo "   # Adicione: client_max_body_size 15M; no bloco http {"
        echo "   # Depois: nginx -s reload"
        echo ""
        echo -e "${BLUE}💡 Ou copie o arquivo de configuração:${NC}"
        echo "   docker cp $NGINX_CONTAINER:/etc/nginx/nginx.conf ./nginx.conf"
        echo "   # Edite o arquivo localmente"
        echo "   # Adicione: client_max_body_size 15M; no bloco http {"
        echo "   docker cp ./nginx.conf $NGINX_CONTAINER:/etc/nginx/nginx.conf"
        echo "   docker exec $NGINX_CONTAINER nginx -s reload"
        exit 0
    fi
fi

# Contar quantas vezes client_max_body_size aparece
CLIENT_MAX_COUNT=$(grep -c "client_max_body_size" "$CONFIG_FILE" 2>/dev/null || echo "0")

# Verificar se já tem client_max_body_size configurado
if [ "$CLIENT_MAX_COUNT" -gt 0 ]; then
    # Se há duplicação, remover todas e adicionar apenas uma
    if [ "$CLIENT_MAX_COUNT" -gt 1 ]; then
        echo -e "${YELLOW}⚠️  Detectada duplicação de client_max_body_size ($CLIENT_MAX_COUNT ocorrências)${NC}"
        echo -e "${YELLOW}⚠️  Removendo duplicações e mantendo apenas uma configuração...${NC}"
        
        # Fazer backup (tentar com sudo se necessário)
        BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        if sudo cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null || cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ Backup criado${NC}"
        else
            echo -e "${YELLOW}⚠️  Não foi possível criar backup (pode precisar de sudo)${NC}"
            BACKUP_FILE=""
        fi
        
        # Remover todas as ocorrências de client_max_body_size
        if sudo sed -i '/client_max_body_size/d' "$CONFIG_FILE" 2>/dev/null || sed -i '/client_max_body_size/d' "$CONFIG_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ Duplicações removidas${NC}"
        else
            echo -e "${RED}❌ Não foi possível remover duplicações${NC}"
            if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
                sudo cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || true
            fi
            exit 1
        fi
        
        # Adicionar uma única ocorrência no bloco http
        if grep -q "^http {" "$CONFIG_FILE"; then
            if sudo sed -i '/^http {/a\    client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null || sed -i '/^http {/a\    client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null; then
                echo -e "${GREEN}✅ client_max_body_size 15M adicionado${NC}"
            else
                echo -e "${RED}❌ Não foi possível adicionar${NC}"
                if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
                    sudo cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || true
                fi
                exit 1
            fi
        else
            # Se não há bloco http, adicionar no início
            if sudo sed -i '1i client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null || sed -i '1i client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null; then
                echo -e "${GREEN}✅ client_max_body_size 15M adicionado${NC}"
            else
                echo -e "${RED}❌ Não foi possível adicionar${NC}"
                if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
                    sudo cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || true
                fi
                exit 1
            fi
        fi
    else
        # Apenas uma ocorrência, verificar se está adequada
        CURRENT_LIMIT=$(grep "client_max_body_size" "$CONFIG_FILE" | head -1 | awk '{print $2}' | tr -d ';')
        echo -e "${YELLOW}⚠️  Limite atual encontrado: $CURRENT_LIMIT${NC}"
        
        # Verificar se o limite é muito baixo (menor que 15MB)
        CURRENT_MB=$(echo "$CURRENT_LIMIT" | sed 's/[^0-9]//g')
        if [ -z "$CURRENT_MB" ] || [ "$CURRENT_MB" -lt 15 ]; then
            echo -e "${YELLOW}⚠️  Limite muito baixo! Ajustando para 15MB...${NC}"
            
            # Fazer backup (tentar com sudo se necessário)
            BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            if sudo cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null || cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null; then
                echo -e "${GREEN}✅ Backup criado${NC}"
            else
                echo -e "${YELLOW}⚠️  Não foi possível criar backup (pode precisar de sudo)${NC}"
                BACKUP_FILE=""
            fi
            
            # Substituir o limite existente (tentar com sudo se necessário)
            if sudo sed -i 's/client_max_body_size.*/client_max_body_size 15M;/' "$CONFIG_FILE" 2>/dev/null || sed -i 's/client_max_body_size.*/client_max_body_size 15M;/' "$CONFIG_FILE" 2>/dev/null; then
                echo -e "${GREEN}✅ Limite atualizado para 15MB${NC}"
            else
                echo -e "${RED}❌ Não foi possível atualizar (pode precisar de sudo)${NC}"
                if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
                    sudo cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || true
                fi
                exit 1
            fi
        else
            echo -e "${GREEN}✅ Limite já está adequado ($CURRENT_LIMIT)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  client_max_body_size não encontrado. Adicionando 15MB...${NC}"
    
    # Fazer backup (tentar com sudo se necessário)
    BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    if sudo cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null || cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ Backup criado${NC}"
    else
        echo -e "${YELLOW}⚠️  Não foi possível criar backup (pode precisar de sudo)${NC}"
        BACKUP_FILE=""
    fi
    
    # Adicionar no bloco http (se existir) ou no início do arquivo
    if grep -q "^http {" "$CONFIG_FILE"; then
        # Adicionar após a linha "http {"
        if sudo sed -i '/^http {/a\    client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null || sed -i '/^http {/a\    client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ client_max_body_size 15M adicionado${NC}"
        else
            echo -e "${RED}❌ Não foi possível adicionar (pode precisar de sudo)${NC}"
            if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
                sudo cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || true
            fi
            exit 1
        fi
    else
        # Adicionar no início do arquivo
        if sudo sed -i '1i client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null || sed -i '1i client_max_body_size 15M;' "$CONFIG_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ client_max_body_size 15M adicionado${NC}"
        else
            echo -e "${RED}❌ Não foi possível adicionar (pode precisar de sudo)${NC}"
            if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
                sudo cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || cp "$BACKUP_FILE" "$CONFIG_FILE" 2>/dev/null || true
            fi
            exit 1
        fi
    fi
fi

# Verificar sintaxe do nginx
echo -e "${YELLOW}🔍 Verificando sintaxe do nginx...${NC}"
NGINX_TEST_OUTPUT=""
if sudo nginx -t 2>&1 | tee /tmp/nginx-test-output.txt | grep -q "syntax is ok"; then
    NGINX_TEST_OUTPUT=$(cat /tmp/nginx-test-output.txt)
    rm -f /tmp/nginx-test-output.txt
    echo -e "${GREEN}✅ Sintaxe OK${NC}"
    
    # Tentar recarregar nginx automaticamente
    echo ""
    echo -e "${YELLOW}🔄 Tentando recarregar nginx...${NC}"
    if sudo systemctl reload nginx 2>/dev/null || sudo nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null; then
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
    NGINX_TEST_OUTPUT=$(cat /tmp/nginx-test-output.txt 2>/dev/null || sudo nginx -t 2>&1 || nginx -t 2>&1)
    rm -f /tmp/nginx-test-output.txt
    echo -e "${RED}❌ Erro na sintaxe do nginx!${NC}"
    echo "$NGINX_TEST_OUTPUT"
    echo ""
    echo -e "${YELLOW}💡 Restaurar backup se necessário:${NC}"
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        echo "   sudo cp $BACKUP_FILE $CONFIG_FILE"
    else
        echo "   sudo cp ${CONFIG_FILE}.backup.* $CONFIG_FILE"
    fi
    exit 1
fi

