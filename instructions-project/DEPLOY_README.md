# 📤 Guia de Deploy - Upload Build para Servidor

Este guia explica como usar o script `upload-build.ps1` para fazer build local e enviar para o servidor.

## 🚀 Uso Rápido

### Opção 1: Via Project Manager (Recomendado)
1. Execute `project-manager.bat`
2. Escolha a opção **4** (📤 FAZER BUILD E ENVIAR PARA SERVIDOR)
3. Confirme com **S**

### Opção 2: Diretamente
```powershell
.\upload-build.ps1
```

## ⚙️ Configuração

O script funciona em qualquer PC, mas precisa de configuração na primeira vez.

### Método 1: Ficheiro .env.deploy (Recomendado)

1. Copie o ficheiro de exemplo:
   ```powershell
   copy .env.deploy.example .env.deploy
   ```

2. Edite `.env.deploy` com os seus dados:
   ```env
   DEPLOY_SSH_KEY=C:\caminho\para\sua\chave\ssh
   DEPLOY_SSH_USER=seu_usuario
   DEPLOY_SSH_HOST=seu_servidor.com
   DEPLOY_SERVER_PATH=/caminho/no/servidor/client
   DEPLOY_SITE_URL=https://seu_servidor.com
   ```

3. Execute o script normalmente - ele carregará automaticamente `.env.deploy`

### Método 2: Variáveis de Ambiente

Defina as variáveis de ambiente no Windows:

```powershell
$env:DEPLOY_SSH_KEY = "C:\caminho\para\chave"
$env:DEPLOY_SSH_USER = "seu_usuario"
$env:DEPLOY_SSH_HOST = "seu_servidor.com"
$env:DEPLOY_SERVER_PATH = "/caminho/no/servidor/client"
$env:DEPLOY_SITE_URL = "https://seu_servidor.com"
```

### Método 3: Valores Padrão

Se não configurar nada, o script usa valores padrão:
- **SSH Key**: `%USERPROFILE%\.ssh\thecore`
- **SSH User**: `andre`
- **SSH Host**: `136.116.79.244`
- **Server Path**: `/home/andre/apps/instructions/instructions-project/client`
- **Site URL**: `https://136.116.79.244`

## 📋 Pré-requisitos

1. **Node.js e npm** instalados
2. **Chave SSH** configurada e acessível
3. **Acesso SSH** ao servidor remoto
4. **Permissões** para escrever no servidor

## 🔑 Configurar Chave SSH

### Passo 1: Gerar chave SSH (se não tiver)
```powershell
ssh-keygen -t ed25519 -C "seu_email@exemplo.com"
```

### Passo 2: Copiar chave pública para o servidor
```powershell
ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@servidor.com
```

Ou manualmente:
1. Copie o conteúdo de `~/.ssh/id_ed25519.pub`
2. Cole em `~/.ssh/authorized_keys` no servidor

### Passo 3: Testar conexão
```powershell
ssh -i ~/.ssh/id_ed25519 usuario@servidor.com
```

## 📝 Exemplo Completo

### Primeira vez em novo PC:

1. **Clone o repositório**
   ```powershell
   git clone <repo-url>
   cd instructions-project
   ```

2. **Crie ficheiro de configuração**
   ```powershell
   copy .env.deploy.example .env.deploy
   notepad .env.deploy  # Edite com seus dados
   ```

3. **Configure chave SSH**
   - Copie a chave SSH para o local especificado em `DEPLOY_SSH_KEY`
   - Ou gere uma nova e adicione ao servidor

4. **Execute o deploy**
   ```powershell
   .\upload-build.ps1
   ```

## 🔍 Troubleshooting

### Erro: "Chave SSH não encontrada"
- Verifique o caminho em `DEPLOY_SSH_KEY`
- Certifique-se que a chave existe nesse local
- Verifique permissões da chave (deve ser `-rw-------` no Linux)

### Erro: "Upload falhou"
- Verifique se o servidor está acessível: `ping SEU_SERVIDOR`
- Teste SSH manualmente: `ssh -i CHAVE usuario@servidor`
- Verifique se o utilizador tem permissões no caminho do servidor

### Erro: "Build falhou"
- Verifique se tem Node.js instalado: `node --version`
- Instale dependências: `cd client && npm install`
- Verifique erros no output do build

## 📚 Variáveis de Configuração

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DEPLOY_SSH_KEY` | Caminho para chave SSH privada | `%USERPROFILE%\.ssh\thecore` |
| `DEPLOY_SSH_USER` | Utilizador SSH no servidor | `andre` |
| `DEPLOY_SSH_HOST` | IP ou hostname do servidor | `136.116.79.244` |
| `DEPLOY_SERVER_PATH` | Caminho completo no servidor | `/home/andre/apps/instructions/instructions-project/client` |
| `DEPLOY_SITE_URL` | URL do site (apenas visual) | `https://136.116.79.244` |

## ✅ Verificação

Após o deploy, verifique:
1. Ficheiros foram enviados: `ssh usuario@servidor "ls -lh /caminho/client/dist"`
2. Site está atualizado: Aceda à URL do site
3. Build está correto: Verifique console do navegador (F12)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do script
2. Teste conexão SSH manualmente
3. Verifique se o servidor está online
4. Confirme que tem permissões necessárias

