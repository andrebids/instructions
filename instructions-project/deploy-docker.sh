#!/bin/bash

# ============================================
# Script de Deploy Docker no Servidor
# Executa deploy completo do container Docker
# ============================================

# Não usar set -e para ter melhor controle sobre tratamento de erros

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

print_header() {
    echo ""
    echo "========================================"
    echo "$1"
    echo "========================================"
    echo ""
}

# Verificar se imagem foi fornecida
if [ -z "$1" ]; then
    print_error "Uso: $0 <imagem-completa>"
    print_info "Exemplo: $0 ghcr.io/user/repo:latest"
    exit 1
fi

IMAGE_NAME="$1"
CONTAINER_NAME="instructions-prod"
CONTAINER_PORT="5000:5000"
CONTAINER_RESTART="unless-stopped"
CONTAINER_NETWORK="bridge"
VOLUME_HOST="/mnt/olimpo/.dev/web/thecore"
VOLUME_CONTAINER="/app/server/public/uploads"
ENV_FILE="$HOME/apps/instructions-project/instructions-project/server/.env"

print_header "Deploy Docker - Instructions Project"
print_info "Imagem: $IMAGE_NAME"
print_info "Container: $CONTAINER_NAME"
echo ""

# Verificar se Docker está disponível
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado ou não está no PATH"
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    print_error "Docker não está rodando"
    exit 1
fi

print_success "Docker verificado"
echo ""

# ============================================
# Passo 1: Parar e Remover Container Antigo
# ============================================
print_header "Passo 1/5: Parando e Removendo Container Antigo"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_info "Container '$CONTAINER_NAME' encontrado"
    
    # Verificar se está rodando
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Parando container..."
        docker stop "$CONTAINER_NAME" || {
            print_warning "Falha ao parar container, tentando forçar remoção..."
        }
    fi
    
    # Remover container
    print_info "Removendo container..."
    docker rm -f "$CONTAINER_NAME" || {
        print_error "Falha ao remover container"
        exit 1
    }
    print_success "Container antigo removido"
else
    print_info "Container '$CONTAINER_NAME' não existe, prosseguindo..."
fi

echo ""

# ============================================
# Passo 2: Fazer Pull da Imagem
# ============================================
print_header "Passo 2/5: Fazendo Pull da Imagem"

print_info "Fazendo pull da imagem: $IMAGE_NAME"
print_info "Isso pode levar alguns minutos..."

if docker pull "$IMAGE_NAME"; then
    print_success "Pull da imagem concluído com sucesso"
else
    print_error "Falha ao fazer pull da imagem"
    print_info "Verifique se:"
    print_info "  - A imagem existe no registry"
    print_info "  - Você tem permissão para acessar o registry"
    print_info "  - O Docker está autenticado no registry (ghcr.io)"
    exit 1
fi

echo ""

# ============================================
# Passo 3: Criar Novo Container
# ============================================
print_header "Passo 3/5: Criando Container"

# Verificar se arquivo .env existe
if [ ! -f "$ENV_FILE" ]; then
    print_warning "Arquivo .env não encontrado em: $ENV_FILE"
    print_info "Container será criado sem --env-file"
    ENV_FILE_ARG=""
else
    print_success "Arquivo .env encontrado: $ENV_FILE"
    ENV_FILE_ARG="--env-file $ENV_FILE"
fi

# Verificar se diretório do volume existe
if [ ! -d "$VOLUME_HOST" ]; then
    print_warning "Diretório do volume não existe: $VOLUME_HOST"
    print_info "Criando diretório..."
    mkdir -p "$VOLUME_HOST" || {
        print_error "Falha ao criar diretório do volume"
        exit 1
    }
fi

print_info "Criando container com as seguintes configurações:"
print_info "  Nome: $CONTAINER_NAME"
print_info "  Porta: $CONTAINER_PORT"
print_info "  Restart: $CONTAINER_RESTART"
print_info "  Network: $CONTAINER_NETWORK"
print_info "  Volume: $VOLUME_HOST -> $VOLUME_CONTAINER"
if [ -n "$ENV_FILE_ARG" ]; then
    print_info "  Env file: $ENV_FILE"
fi
echo ""

# Construir comando docker run
DOCKER_CMD="docker run -d \
    --name $CONTAINER_NAME \
    -p $CONTAINER_PORT \
    --restart $CONTAINER_RESTART \
    --network $CONTAINER_NETWORK \
    --add-host host.docker.internal:host-gateway \
    -v $VOLUME_HOST:$VOLUME_CONTAINER \
    $ENV_FILE_ARG \
    $IMAGE_NAME"

print_info "Executando comando Docker..."
if eval "$DOCKER_CMD"; then
    print_success "Container criado com sucesso"
else
    print_error "Falha ao criar container"
    print_info "Verifique se:"
    print_info "  - A imagem existe localmente"
    print_info "  - O volume host existe: $VOLUME_HOST"
    if [ -n "$ENV_FILE_ARG" ]; then
        print_info "  - O arquivo .env existe: $ENV_FILE"
    fi
    print_info "  - As portas não estão em uso"
    exit 1
fi

echo ""

# ============================================
# Passo 4: Criar Symlink do Frontend
# ============================================
print_header "Passo 4/5: Criando Symlink do Frontend"

print_info "Aguardando container iniciar..."
sleep 3

print_info "Criando diretório /app/client no container..."
if docker exec "$CONTAINER_NAME" mkdir -p /app/client; then
    print_success "Diretório criado"
else
    print_warning "Falha ao criar diretório - container pode não estar totalmente iniciado"
    print_info "Tentando novamente em 5 segundos..."
    sleep 5
    if ! docker exec "$CONTAINER_NAME" mkdir -p /app/client; then
        print_error "Falha ao criar diretório após segunda tentativa"
        exit 1
    fi
fi

print_info "Criando symlink do frontend..."
if docker exec "$CONTAINER_NAME" ln -sf /app/server/public/client /app/client/dist; then
    print_success "Symlink criado com sucesso"
else
    print_warning "Falha ao criar symlink"
    print_info "Tentando novamente..."
    sleep 2
    if docker exec "$CONTAINER_NAME" ln -sf /app/server/public/client /app/client/dist; then
        print_success "Symlink criado na segunda tentativa"
    else
        print_error "Falha ao criar symlink após múltiplas tentativas"
        print_info "Você pode criar manualmente com:"
        print_info "  docker exec $CONTAINER_NAME mkdir -p /app/client"
        print_info "  docker exec $CONTAINER_NAME ln -sf /app/server/public/client /app/client/dist"
        exit 1
    fi
fi

# Verificar symlink
if docker exec "$CONTAINER_NAME" ls -la /app/client/dist > /dev/null 2>&1; then
    print_success "Symlink verificado"
else
    print_warning "Symlink pode não estar funcionando corretamente"
fi

# Reiniciar container para que o servidor Node.js detecte o symlink
print_info "Reiniciando container para que o servidor detecte o symlink..."
if docker restart "$CONTAINER_NAME" > /dev/null 2>&1; then
    print_success "Container reiniciado"
    print_info "Aguardando container reiniciar..."
    sleep 5
else
    print_warning "Falha ao reiniciar container (pode não ser necessário)"
fi

echo ""

# ============================================
# Passo 5: Verificar Deploy
# ============================================
print_header "Passo 5/5: Verificando Deploy"

print_info "Aguardando serviços iniciarem..."
sleep 5

# Verificar se container está rodando
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    print_success "Container está rodando: $CONTAINER_NAME"
else
    print_error "Container não está rodando"
    print_info "Verificando logs do container..."
    docker logs "$CONTAINER_NAME" --tail 50
    exit 1
fi

# Verificar health endpoint (se curl estiver disponível)
if command -v curl &> /dev/null; then
    print_info "Verificando endpoint de health..."
    if curl -f -s http://localhost:5000/health > /dev/null 2>&1; then
        print_success "Health endpoint respondeu com sucesso"
    else
        print_warning "Health endpoint não respondeu ainda (pode estar iniciando)"
    fi
else
    print_info "curl não disponível, pulando verificação de health endpoint"
fi

echo ""

# ============================================
# Resumo Final
# ============================================
print_header "Resumo do Deploy"

print_success "Deploy concluído com sucesso!"
echo ""
print_info "Container: $CONTAINER_NAME"
print_info "Imagem: $IMAGE_NAME"
print_info "Porta: $CONTAINER_PORT"
echo ""
print_info "Para verificar logs:"
print_info "  docker logs $CONTAINER_NAME --tail 50"
echo ""
print_info "Para parar o container:"
print_info "  docker stop $CONTAINER_NAME"
echo ""

exit 0

