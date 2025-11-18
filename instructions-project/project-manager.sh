#!/bin/bash

# Project Manager - Instructions Project (Linux)
# Equivalente ao project-manager.bat para sistemas Linux

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${PROJECT_ROOT}/server"
CLIENT_DIR="${PROJECT_ROOT}/client"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

show_menu() {
    clear
    echo "========================================"
    echo "   PROJECT MANAGER - INSTRUCTIONS"
    echo "========================================"
    echo ""
    echo "1. 🚀 INICIAR PROJETO"
    echo "2. 📊 VERIFICAR STATUS"
    echo "3. 🔄 REINICIAR PROJETO"
    echo "4. 🛑 PARAR PROJETO"
    echo "5. ❌ SAIR"
    echo ""
    echo "========================================"
    read -p "Escolha uma opção (1-5): " choice
    
    case $choice in
        1) start_project ;;
        2) check_status ;;
        3) restart_project ;;
        4) stop_project ;;
        5) exit 0 ;;
        *) show_menu ;;
    esac
}

ensure_prereqs() {
    echo "========================================"
    echo "   VERIFICANDO PRÉ-REQUISITOS"
    echo "========================================"
    echo ""
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js não encontrado${NC}"
        echo "   -> Instala Node.js: https://nodejs.org/"
        return 1
    fi
    echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm não encontrado${NC}"
        return 1
    fi
    echo -e "${GREEN}✅ npm encontrado: $(npm --version)${NC}"
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠️  PM2 não encontrado. Instalando globalmente...${NC}"
        npm install -g pm2
    else
        echo -e "${GREEN}✅ PM2 encontrado${NC}"
    fi
    
    echo ""
    return 0
}

check_and_install_dependencies() {
    echo "========================================"
    echo "   VERIFICANDO DEPENDÊNCIAS"
    echo "========================================"
    echo ""
    
    # Dependências do servidor
    echo "[1/2] Verificando dependências do servidor..."
    cd "${SERVER_DIR}"
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/express" ] || [ ! -d "node_modules/sequelize" ] || [ ! -d "node_modules/pg" ]; then
        echo "📦 Instalando dependências do servidor..."
        if [ -f "package-lock.json" ]; then
            npm ci || npm install
        else
            npm install
        fi
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Erro ao instalar dependências do servidor${NC}"
            return 1
        fi
        echo -e "${GREEN}✅ Dependências do servidor instaladas${NC}"
    else
        echo -e "${GREEN}✅ Dependências do servidor já instaladas${NC}"
    fi
    echo ""
    
    # Dependências do cliente
    echo "[2/2] Verificando dependências do cliente..."
    cd "${CLIENT_DIR}"
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/react" ] || [ ! -d "node_modules/vite" ]; then
        echo "📦 Instalando dependências do cliente..."
        if [ -f "package-lock.json" ]; then
            npm ci || npm install
        else
            npm install
        fi
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Erro ao instalar dependências do cliente${NC}"
            return 1
        fi
        echo -e "${GREEN}✅ Dependências do cliente instaladas${NC}"
    else
        echo -e "${GREEN}✅ Dependências do cliente já instaladas${NC}"
    fi
    echo ""
    
    return 0
}

wait_for_postgres() {
    echo "Aguardando PostgreSQL estar pronto..."
    MAX_TRIES=12
    TRY_COUNT=0
    
    while [ $TRY_COUNT -lt $MAX_TRIES ]; do
        if nc -z localhost 5433 2>/dev/null; then
            sleep 2
            echo -e "${GREEN}✅ PostgreSQL pronto e acessível!${NC}"
            return 0
        fi
        TRY_COUNT=$((TRY_COUNT + 1))
        sleep 2
    done
    
    echo -e "${YELLOW}⚠️  PostgreSQL pode não estar totalmente pronto${NC}"
    return 1
}

start_project() {
    clear
    echo "========================================"
    echo "   INICIANDO PROJETO INSTRUCTIONS"
    echo "========================================"
    echo ""
    
    # Parar processos existentes
    stop_quick
    
    # Verificar pré-requisitos
    ensure_prereqs
    if [ $? -ne 0 ]; then
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    
    # Instalar dependências
    echo "========================================"
    echo "   [0/5] INSTALANDO DEPENDÊNCIAS"
    echo "========================================"
    echo ""
    check_and_install_dependencies
    if [ $? -ne 0 ]; then
        read -p "Pressione Enter para voltar ao menu..."
        return
    fi
    echo ""
    
    cd "${PROJECT_ROOT}"
    
    # Aguardar PostgreSQL
    echo "========================================"
    echo "   [1/4] AGUARDANDO POSTGRESQL"
    echo "========================================"
    echo ""
    wait_for_postgres
    echo ""
    
    # Setup da BD
    echo "========================================"
    echo "   [2/4] EXECUTANDO SETUP DA BD"
    echo "========================================"
    echo ""
    cd "${SERVER_DIR}"
    npm run setup
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Setup encontrou problemas. Tentando migrations manualmente...${NC}"
        npm run migrate:all || echo -e "${YELLOW}⚠️  Migrations podem ter falhado${NC}"
    else
        echo -e "${GREEN}✅ Setup da base de dados concluído!${NC}"
    fi
    echo ""
    
    # Iniciar servidor backend
    echo "========================================"
    echo "   [3/4] INICIANDO SERVIDOR BACKEND"
    echo "========================================"
    echo ""
    cd "${SERVER_DIR}"
    pm2 delete instructions-server 2>/dev/null || true
    pm2 start npm --name instructions-server -- start
    pm2 save
    echo -e "${GREEN}✅ Servidor backend iniciado em http://localhost:5000${NC}"
    echo ""
    
    # Iniciar cliente frontend (opcional - desenvolvimento)
    echo "========================================"
    echo "   [4/4] INICIANDO CLIENTE FRONTEND"
    echo "========================================"
    echo ""
    echo -e "${YELLOW}💡 Frontend pode ser servido via build estático ou dev server${NC}"
    echo "   Para desenvolvimento: cd client && npm run dev"
    echo "   Para produção: cd client && npm run build"
    echo ""
    
    echo "========================================"
    echo "   PROJETO INICIADO COM SUCESSO!"
    echo "========================================"
    echo ""
    echo "🔧 Backend:  http://localhost:5000"
    echo "🗄️  Database: localhost:5433"
    echo ""
    pm2 status
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

check_status() {
    clear
    echo "========================================"
    echo "   STATUS DO PROJETO INSTRUCTIONS"
    echo "========================================"
    echo ""
    
    echo "[1/2] Verificando processos PM2..."
    pm2 status
    echo ""
    
    echo "[2/2] Testando conectividade..."
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: http://localhost:5000 - ONLINE${NC}"
    else
        echo -e "${RED}❌ Backend: http://localhost:5000 - OFFLINE${NC}"
    fi
    echo ""
    
    echo "========================================"
    echo "   VERIFICAÇÃO CONCLUÍDA"
    echo "========================================"
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

restart_project() {
    clear
    echo "========================================"
    echo "   REINICIANDO PROJETO INSTRUCTIONS"
    echo "========================================"
    echo ""
    
    echo "[1/2] Parando projeto atual..."
    stop_quick
    echo ""
    
    echo "[2/2] Iniciando projeto novamente..."
    sleep 2
    start_project
}

stop_project() {
    clear
    echo "========================================"
    echo "   PARANDO PROJETO INSTRUCTIONS"
    echo "========================================"
    echo ""
    
    echo "[1/2] Parando processos PM2..."
    pm2 delete instructions-server 2>/dev/null || true
    pm2 save
    echo -e "${GREEN}✅ Processos PM2 parados${NC}"
    echo ""
    
    echo "[2/2] Verificando processos Node.js restantes..."
    pkill -f "node.*server" 2>/dev/null || true
    echo -e "${GREEN}✅ Processos Node.js parados${NC}"
    echo ""
    
    echo "========================================"
    echo "   PROJETO PARADO COM SUCESSO!"
    echo "========================================"
    echo ""
    read -p "Pressione Enter para voltar ao menu..."
}

stop_quick() {
    # Paragem rápida e silenciosa
    cd "${PROJECT_ROOT}"
    pm2 delete instructions-server > /dev/null 2>&1 || true
    pkill -f "node.*server" > /dev/null 2>&1 || true
}

# Main loop
while true; do
    show_menu
done

