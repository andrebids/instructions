#!/bin/bash

# Script para corrigir problema de arquivos estáticos interferindo com /api/uploads
# Execute no servidor: bash fix-nginx-static-files.sh
# Ou: ssh usuario@servidor 'bash -s' < fix-nginx-static-files.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Corrigindo configuração do Nginx para /api/uploads...${NC}"
echo ""

NGINX_CONFIG="/etc/nginx/sites-enabled/instructions-project"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${RED}❌ Arquivo de configuração não encontrado: $NGINX_CONFIG${NC}"
    exit 1
fi

# Fazer backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"

# Verificar se a regra de arquivos estáticos está interferindo
if grep -q "location ~\* \\.(jpg|jpeg|png" "$NGINX_CONFIG"; then
    echo -e "${YELLOW}⚠️  Regra de arquivos estáticos encontrada${NC}"
    
    # Verificar se já está comentada
    if grep -q "^[[:space:]]*#[[:space:]]*location ~\*" "$NGINX_CONFIG"; then
        echo -e "${GREEN}✅ Regra já está comentada${NC}"
    else
        echo -e "${YELLOW}💡 Comentando regra de arquivos estáticos para evitar conflito com /api/uploads${NC}"
        
        # Comentar a regra de arquivos estáticos usando Python para preservar formatação
        sudo python3 << 'PYTHON'
import re

with open('/etc/nginx/sites-enabled/instructions-project', 'r') as f:
    content = f.read()

# Encontrar e comentar a regra de arquivos estáticos
pattern = r'(    # Servir ficheiros est[^\n]+\n    location ~\* \\\\.\([^)]+\)\\$ \{[^}]+\})'
match = re.search(pattern, content, re.MULTILINE | re.DOTALL)

if match:
    old_block = match.group(1)
    # Comentar cada linha que não está vazia e não começa com #
    lines = old_block.split('\n')
    commented_lines = []
    for line in lines:
        if line.strip() and not line.strip().startswith('#'):
            commented_lines.append('    # ' + line.lstrip())
        else:
            commented_lines.append(line)
    commented_block = '\n'.join(commented_lines)
    content = content.replace(old_block, commented_block)
    
    with open('/etc/nginx/sites-enabled/instructions-project', 'w') as f:
        f.write(content)
    print('✅ Regra comentada com sucesso')
else:
    print('⚠️  Regra não encontrada ou já comentada')
PYTHON
        
        echo -e "${GREEN}✅ Regra comentada${NC}"
    fi
else
    echo -e "${GREEN}✅ Regra de arquivos estáticos não encontrada ou já corrigida${NC}"
fi

# Verificar sintaxe
echo ""
echo -e "${YELLOW}🔍 Verificando sintaxe do Nginx...${NC}"
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}✅ Sintaxe OK${NC}"
    
    # Recarregar nginx
    echo -e "${YELLOW}🔄 Recarregando Nginx...${NC}"
    if sudo systemctl reload nginx 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx recarregado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao recarregar Nginx${NC}"
        echo -e "${YELLOW}💡 Execute manualmente: sudo systemctl reload nginx${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Erro na sintaxe do Nginx${NC}"
    echo -e "${YELLOW}💡 Restaurando backup...${NC}"
    sudo cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo -e "${GREEN}✅ Backup restaurado${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Correção aplicada com sucesso!${NC}"
echo ""
echo -e "${BLUE}💡 Nota: A regra de arquivos estáticos foi comentada para evitar conflito${NC}"
echo -e "${BLUE}   com /api/uploads. Arquivos estáticos do frontend continuam sendo servidos${NC}"
echo -e "${BLUE}   normalmente através do root /client/dist${NC}"

