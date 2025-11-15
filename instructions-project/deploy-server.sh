#!/bin/bash

# Script de Deploy Manual para o Servidor
# Execute este script diretamente no servidor via SSH

set -e  # Parar em caso de erro

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Definir diretórios do projeto
PROJECT_ROOT="/home/andre/apps/instructions/instructions-project"
SERVER_DIR="${PROJECT_ROOT}/server"
CLIENT_DIR="${PROJECT_ROOT}/client"

echo -e "${GREEN}🚀 Iniciando deploy do Instructions Project...${NC}"
echo ""

# 1. Garantir que Docker Compose está a correr
echo -e "${YELLOW}🐳 [1/6] Verificando Docker Compose (PostgreSQL)...${NC}"
cd "${PROJECT_ROOT}"
if command -v docker-compose &> /dev/null; then
  docker-compose -f docker-compose.prod.yml up -d || docker-compose -f docker-compose.dev.yml up -d
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
  docker compose -f docker-compose.prod.yml up -d || docker compose -f docker-compose.dev.yml up -d
fi
echo -e "${GREEN}✅ PostgreSQL verificado/iniciado${NC}"
echo ""

# 2. Atualizar código via git pull
echo -e "${YELLOW}📥 [2/6] Atualizando código via git pull...${NC}"
cd "${PROJECT_ROOT}"
if [ -d .git ]; then
  git fetch origin
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [ "$CURRENT_BRANCH" = "master" ] || [ "$CURRENT_BRANCH" = "main" ]; then
    git reset --hard origin/${CURRENT_BRANCH}
  else
    git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null
  fi
  echo -e "${GREEN}✅ Código atualizado da branch ${CURRENT_BRANCH}${NC}"
else
  echo -e "${RED}❌ Diretório .git não encontrado!${NC}"
  echo "⚠️ Execute manualmente: git clone <repo-url> ${PROJECT_ROOT}"
  exit 1
fi
echo ""

# 3. Atualizar .env do servidor
echo -e "${YELLOW}🔧 [3/6] Configurando variáveis de ambiente...${NC}"
cd "${SERVER_DIR}"
if [ -f .env ]; then
  # Garantir DB_HOST=localhost
  if grep -q "^DB_HOST=" .env; then
    sed -i 's|^DB_HOST=.*$|DB_HOST=localhost|' .env
  else
    echo "DB_HOST=localhost" >> .env
  fi
  
  # Atualizar PORT
  PORT_FINAL="${PORT:-5000}"
  if grep -q "^PORT=" .env; then
    sed -i "s|^PORT=.*$|PORT=${PORT_FINAL}|" .env
  else
    echo "PORT=${PORT_FINAL}" >> .env
  fi
  
  # Atualizar NODE_ENV
  NODE_ENV_FINAL="${NODE_ENV:-production}"
  if grep -q "^NODE_ENV=" .env; then
    sed -i "s|^NODE_ENV=.*$|NODE_ENV=${NODE_ENV_FINAL}|" .env
  else
    echo "NODE_ENV=${NODE_ENV_FINAL}" >> .env
  fi
  
  echo -e "${GREEN}✅ .env atualizado${NC}"
else
  echo "⚠️ Ficheiro .env não encontrado, criando..."
  echo "DB_HOST=localhost" > .env
  echo "DB_PORT=5433" >> .env
  echo "DB_NAME=instructions_demo" >> .env
  echo "DB_USER=demo_user" >> .env
  echo "DB_PASSWORD=demo_password" >> .env
  echo "PORT=${PORT:-5000}" >> .env
  echo "NODE_ENV=${NODE_ENV:-production}" >> .env
  echo -e "${GREEN}✅ .env criado${NC}"
fi
echo ""

# 4. Instalar dependências do servidor
echo -e "${YELLOW}📦 [4/6] Instalando dependências do servidor...${NC}"
cd "${SERVER_DIR}"
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi
echo -e "${GREEN}✅ Dependências do servidor instaladas${NC}"
echo ""

# 5. Build do cliente (se necessário)
echo -e "${YELLOW}🏗️  [5/6] Fazendo build do cliente...${NC}"
cd "${CLIENT_DIR}"
if [ -f package-lock.json ]; then
  npm ci || npm install
else
  npm install
fi
npm run build
echo -e "${GREEN}✅ Cliente compilado${NC}"
echo ""

# 6. Verificar/Ajustar configuração nginx (se necessário)
echo -e "${YELLOW}🔧 [6/7] Verificando configuração nginx para uploads...${NC}"
if command -v nginx &> /dev/null; then
  if [ -f "${PROJECT_ROOT}/fix-nginx-upload-limit.sh" ]; then
    echo -e "${YELLOW}💡 Execute manualmente se necessário:${NC}"
    echo "   bash ${PROJECT_ROOT}/fix-nginx-upload-limit.sh"
    echo "   sudo systemctl reload nginx"
  else
    echo -e "${YELLOW}⚠️  Script fix-nginx-upload-limit.sh não encontrado${NC}"
  fi
else
  echo -e "${GREEN}✅ Nginx não encontrado (pode estar usando PM2 diretamente)${NC}"
fi
echo ""

# 7. Reiniciar PM2
echo -e "${YELLOW}🔄 [7/7] Reiniciando servidor com PM2...${NC}"
PM2_NAME_FINAL="${PM2_NAME:-instructions-server}"
pm2 delete ${PM2_NAME_FINAL} 2>/dev/null || true
cd "${SERVER_DIR}"
pm2 start npm --name ${PM2_NAME_FINAL} -- start
pm2 save
echo ""

# Aguardar servidor iniciar
echo -e "${YELLOW}⏳ Aguardando servidor iniciar...${NC}"
sleep 5

# Verificar se servidor está online
if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Servidor online e respondendo!${NC}"
else
  echo -e "${YELLOW}⚠️ Servidor pode não estar totalmente pronto ainda${NC}"
fi
echo ""

# Verificar status final
echo -e "${GREEN}📊 Status final:${NC}"
pm2 status
echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo "🌐 Servidor disponível em: https://136.116.79.244"

