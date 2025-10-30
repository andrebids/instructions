#!/bin/bash

echo "🔍 Verificando configuração do PostgreSQL na VM..."
echo ""

# Verificar se PostgreSQL está instalado
echo "📦 Verificando instalação do PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL instalado: $(psql --version)"
else
    echo "❌ PostgreSQL não encontrado"
    exit 1
fi
echo ""

# Verificar se PostgreSQL está a correr
echo "🔄 Verificando status do serviço PostgreSQL..."
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL está a correr"
else
    echo "⚠️ PostgreSQL não está a correr"
fi
echo ""

# Verificar porta
echo "🔌 Verificando porta PostgreSQL..."
if netstat -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "✅ PostgreSQL está a escutar na porta 5432"
    netstat -tlnp 2>/dev/null | grep ":5432"
elif ss -tlnp 2>/dev/null | grep -q ":5432"; then
    echo "✅ PostgreSQL está a escutar na porta 5432"
    ss -tlnp 2>/dev/null | grep ":5432"
else
    echo "⚠️ PostgreSQL não está a escutar na porta 5432"
fi
echo ""

# Verificar configuração postgresql.conf
echo "📝 Verificando postgresql.conf..."
if [ -f /etc/postgresql/*/main/postgresql.conf ]; then
    PG_CONF=$(ls /etc/postgresql/*/main/postgresql.conf 2>/dev/null | head -1)
    echo "   Localização: $PG_CONF"
    echo "   listen_addresses:"
    grep "^listen_addresses" "$PG_CONF" 2>/dev/null || grep "^#listen_addresses" "$PG_CONF" 2>/dev/null || echo "   (não encontrado)"
    echo "   port:"
    grep "^port" "$PG_CONF" 2>/dev/null || grep "^#port" "$PG_CONF" 2>/dev/null || echo "   (não encontrado)"
else
    echo "⚠️ Ficheiro postgresql.conf não encontrado"
fi
echo ""

# Verificar configuração pg_hba.conf
echo "🔐 Verificando pg_hba.conf..."
if [ -f /etc/postgresql/*/main/pg_hba.conf ]; then
    PG_HBA=$(ls /etc/postgresql/*/main/pg_hba.conf 2>/dev/null | head -1)
    echo "   Localização: $PG_HBA"
    echo "   Regras de autenticação remotas:"
    grep -E "^host\s+all" "$PG_HBA" 2>/dev/null | head -5 || echo "   (nenhuma regra 'host' encontrada)"
else
    echo "⚠️ Ficheiro pg_hba.conf não encontrado"
fi
echo ""

# Verificar bases de dados
echo "🗄️ Verificando bases de dados..."
sudo -u postgres psql -l 2>/dev/null | grep -E "instructions_demo|Name" || echo "⚠️ Não foi possível listar bases de dados"
echo ""

# Verificar utilizadores
echo "👤 Verificando utilizadores PostgreSQL..."
sudo -u postgres psql -c "\du" 2>/dev/null | grep -E "demo_user|Role name" || echo "⚠️ Não foi possível listar utilizadores"
echo ""

# Verificar firewall
echo "🔥 Verificando firewall (UFW)..."
if command -v ufw >/dev/null 2>&1; then
    echo "   Status UFW:"
    sudo ufw status | grep -E "5432|Status" || echo "   (porta 5432 não mencionada)"
else
    echo "⚠️ UFW não encontrado"
fi
echo ""

# Verificar firewall do Google Cloud (se disponível)
echo "☁️ Verificando regras de firewall do Google Cloud..."
if command -v gcloud >/dev/null 2>&1; then
    echo "   Tentando listar regras de firewall..."
    gcloud compute firewall-rules list --filter="allowed.ports:5432" 2>/dev/null || echo "   (não foi possível verificar via gcloud)"
else
    echo "⚠️ gcloud CLI não encontrado"
fi
echo ""

# Verificar IP externo
echo "🌐 IP externo da VM:"
curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "⚠️ Não foi possível obter IP externo"
echo ""

# Verificar Docker (caso esteja a usar Docker)
echo "🐳 Verificando Docker..."
if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker instalado"
    echo "   Containers PostgreSQL:"
    docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "   (nenhum container PostgreSQL encontrado)"
else
    echo "⚠️ Docker não encontrado"
fi
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "📋 Próximos passos se necessário:"
echo "   1. Configurar listen_addresses = '*' em postgresql.conf"
echo "   2. Adicionar regra em pg_hba.conf para permitir conexões remotas"
echo "   3. Abrir porta 5432 no firewall"
echo "   4. Reiniciar PostgreSQL: sudo systemctl restart postgresql"

