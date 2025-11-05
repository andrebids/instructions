# Instruções de Deploy - Instructions Project

## 📋 Configuração dos Segredos no GitHub

Vai a **Settings > Secrets and variables > Actions** no teu repositório GitHub e configura os seguintes segredos:

### Segredos Obrigatórios:
- **SSH_HOST**: `136.116.79.244`
- **SSH_USER**: `andre`
- **SSH_PORT**: `22`
- **SSH_KEY**: Conteúdo completo da tua chave privada SSH (correspondente à chave pública autorizada na VM)

### Segredos Opcionais (com valores padrão):
- **PM2_NAME**: `instructions-server` (padrão se não definido)
- **PORT**: `5000` (padrão se não definido)
- **NODE_ENV**: `production` (padrão se não definido)

## 🔥 Abrir Porta 5000 no Firewall

### Método 1: UFW (Ubuntu/Debian - Recomendado)

```bash
# Verificar se UFW está instalado
sudo apt-get update
sudo apt-get install -y ufw

# Verificar status atual
sudo ufw status

# Abrir porta 5000 (permitir tráfego TCP)
sudo ufw allow 5000/tcp

# Se quiseres permitir apenas de um IP específico:
# sudo ufw allow from SEU_IP to any port 5000

# Ativar UFW se ainda não estiver ativo
sudo ufw enable

# Verificar regras
sudo ufw status numbered

# Verificar se a porta está aberta
sudo netstat -tulpn | grep 5000
# ou
sudo ss -tulpn | grep 5000
```

### Método 2: iptables (Todos os Linux)

```bash
# Abrir porta 5000 para TCP
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT

# Se quiseres permitir apenas de um IP específico:
# sudo iptables -A INPUT -p tcp -s SEU_IP --dport 5000 -j ACCEPT

# Guardar regras (Debian/Ubuntu)
sudo iptables-save > /etc/iptables/rules.v4

# Ou criar script de guardar (RHEL/CentOS)
sudo service iptables save

# Verificar regras
sudo iptables -L -n -v | grep 5000
```

### Método 3: Cloud Provider (GCP/AWS/Azure)

#### Google Cloud Platform (GCP):
```bash
# Criar regra de firewall
gcloud compute firewall-rules create allow-instructions-port-5000 \
    --allow tcp:5000 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow port 5000 for instructions project"

# Verificar regras
gcloud compute firewall-rules list | grep 5000
```

#### AWS (Security Groups):
1. Vai ao EC2 Console > Security Groups
2. Seleciona o security group da tua instância
3. **Inbound Rules** > **Edit inbound rules**
4. Adiciona regra:
   - Type: Custom TCP
   - Port: 5000
   - Source: 0.0.0.0/0 (ou IP específico)
   - Description: Instructions Project

#### Azure (Network Security Group):
```bash
# Via Azure CLI
az network nsg rule create \
    --resource-group SEU_RESOURCE_GROUP \
    --nsg-name SEU_NSG \
    --name allow-port-5000 \
    --priority 1000 \
    --protocol Tcp \
    --destination-port-ranges 5000 \
    --access Allow
```

### Verificar se a Porta Está Aberta

```bash
# Testar localmente
curl http://localhost:5000/health

# Testar externamente (de outra máquina)
curl http://136.116.79.244:5000/health

# Verificar processos a escutar na porta
sudo lsof -i :5000
# ou
sudo netstat -tulpn | grep 5000
```

## 🚀 Usar o Script project-manager.sh (Linux)

```bash
# Dar permissões de execução
chmod +x project-manager.sh

# Executar
./project-manager.sh
```

O script oferece menu interativo:
1. 🚀 INICIAR PROJETO
2. 📊 VERIFICAR STATUS
3. 🔄 REINICIAR PROJETO
4. 🛑 PARAR PROJETO
5. ❌ SAIR

## 📝 Deploy Automático via GitHub Actions

1. **Configura os segredos** conforme indicado acima
2. **Faz push** para a branch `main` ou `master`
3. **Ou dispara manualmente**: Actions > Deploy instructions-project > Run workflow

O workflow vai:
- ✅ Fazer git pull no servidor
- ✅ Garantir que Docker Compose (PostgreSQL) está a correr
- ✅ Atualizar `.env` do servidor (DB_HOST=localhost)
- ✅ Instalar dependências do servidor
- ✅ Fazer build do cliente
- ✅ Reiniciar PM2 com o servidor
- ✅ Verificar se servidor está online

**Nota:** O PM2 está configurado para iniciar automaticamente após reinícios do servidor (via systemd).

## 🔍 Troubleshooting

### Porta 5000 não acessível externamente:
1. Verifica firewall local: `sudo ufw status` ou `sudo iptables -L`
2. Verifica firewall do cloud provider (GCP/AWS/Azure)
3. Verifica se o servidor está a escutar: `sudo lsof -i :5000`
4. Verifica logs do PM2: `pm2 logs instructions-server`

### Servidor não inicia:
1. Verifica logs: `pm2 logs instructions-server --lines 50`
2. Verifica PostgreSQL: `docker ps | grep postgres`
3. Verifica `.env` do servidor: `cat server/.env`
4. Executa setup manual: `cd server && npm run setup`

### Erro de conexão à BD:
1. Verifica se PostgreSQL está a correr: `docker ps`
2. Verifica DB_HOST no `.env`: deve ser `localhost` (não IP externo)
3. Testa conexão: `cd server && npm run check-connection`

## 📞 URLs Importantes

- **Backend API**: http://136.116.79.244:5000/api
- **Health Check**: http://136.116.79.244:5000/health
- **PM2 Dashboard**: `pm2 monit` (no servidor)

