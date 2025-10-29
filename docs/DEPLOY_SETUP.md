# Configuração de Deploy Automático via GitHub Actions

Este documento explica como configurar o deploy automático que executa sempre que há push para a branch `main`.

## Pré-requisitos

- Repositório GitHub configurado
- Servidor remoto acessível via SSH
- Chave SSH gerada e configurada

## Secrets do GitHub

Para o deploy funcionar, é necessário configurar os seguintes secrets no repositório GitHub:

### Como Adicionar Secrets

1. Vai ao repositório no GitHub: `https://github.com/andrebids/instructions`
2. Clica em **Settings** (no topo do repositório)
3. No menu lateral, clica em **Secrets and variables** > **Actions**
4. Clica em **New repository secret**
5. Adiciona cada um dos secrets abaixo:

### Lista de Secrets Necessários

#### 1. SSH_KEY
**Name:** `SSH_KEY`  
**Secret:** Conteúdo completo da chave privada SSH (formato OpenSSH)

```
-----BEGIN OPENSSH PRIVATE KEY-----
[conteúdo da chave]
-----END OPENSSH PRIVATE KEY-----
```

**Como obter:** Abre o ficheiro `$keyPath` localmente e copia tudo, incluindo as linhas `-----BEGIN` e `-----END`.

#### 2. SSH_HOST
**Name:** `SSH_HOST`  
**Secret:** 
```
35.239.46.72
```

#### 3. SSH_PORT
**Name:** `SSH_PORT`  
**Secret:** 
```
22
```

#### 4. SSH_USER
**Name:** `SSH_USER`  
**Secret:** 
```
andre
```

#### 5. REMOTE_PATH
**Name:** `REMOTE_PATH`  
**Secret:** 
```
~/apps/instructions
```

## Como Funciona o Deploy

Quando fazes push para a branch `main`, o GitHub Actions executa automaticamente:

1. **Checkout** - Obtém o código mais recente do GitHub
2. **Setup SSH** - Configura a chave SSH e known_hosts
3. **Rsync código** - Transfere código atualizado para o servidor (excluindo node_modules, dist, .git)
4. **Docker Compose** - Garante que o Postgres está a correr
5. **Build Frontend** - Instala dependências e faz build do React/Vite
6. **Instalar dependências server** - Instala dependências do backend
7. **Preservar .env** - Mantém ficheiros `.env` existentes (não os sobrescreve)
8. **Reiniciar PM2** - Reinicia o servidor Node.js com variáveis atualizadas
9. **Reload Nginx** - Recarrega o Nginx para servir os novos ficheiros
10. **Verificar serviços** - Verifica que Postgres e PM2 estão a correr
11. **Health check** - Verifica se o servidor responde corretamente ao endpoint `/health`

## Verificar Status do Deploy

1. Vai ao repositório no GitHub
2. Clica na aba **Actions**
3. Clica no workflow que está a correr para ver os logs em tempo real

## Notas Importantes

- Os ficheiros `.env` no servidor são preservados - o workflow só cria novos se não existirem
- O build do frontend é feito no servidor durante o deploy
- O PM2 reinicia automaticamente o servidor Node.js após cada deploy
- O Nginx é recarregado para servir os novos ficheiros compilados

## Troubleshooting

### Deploy falha no passo SSH
- Verifica se a chave SSH está correta
- Confirma que o SSH_HOST e SSH_PORT estão corretos
- Verifica que o servidor está acessível

### Deploy falha no build
- Verifica os logs do GitHub Actions para ver o erro específico
- Confirma que Node.js está instalado no servidor
- Verifica que há espaço em disco suficiente

### Servidor não reinicia
- Verifica se o PM2 está instalado: `pm2 list`
- Verifica os logs do PM2: `pm2 logs instructions-server`
- Confirma que o processo PM2 existe: `pm2 describe instructions-server`

