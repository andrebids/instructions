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

#### 6. VITE_CLERK_PUBLISHABLE_KEY
**Name:** `VITE_CLERK_PUBLISHABLE_KEY`  
**Secret:** A chave pública do Clerk (publishable key) obtida no dashboard do Clerk

**Como obter:**
1. Vai ao dashboard do Clerk: https://dashboard.clerk.com
2. Seleciona a tua aplicação
3. Vai a **API Keys**
4. Copia a **Publishable Key** (começa com `pk_test_` ou `pk_live_`)

**Importante:** Esta chave é necessária para o build do frontend funcionar corretamente. O workflow configura automaticamente esta variável no arquivo `client/.env` antes do build.

## Como Funciona o Deploy

Quando fazes push para a branch `main`, o GitHub Actions executa automaticamente:

1. **Checkout** - Obtém o código mais recente do GitHub
2. **Setup SSH** - Configura a chave SSH e known_hosts
3. **Rsync código** - Transfere código atualizado para o servidor (excluindo node_modules, dist, .git)
4. **Docker Compose** - Garante que o Postgres está a correr
5. **Configurar client/.env** - Configura automaticamente `VITE_CLERK_PUBLISHABLE_KEY` no arquivo `.env` do cliente usando o secret do GitHub
6. **Build Frontend** - Instala dependências e faz build do React/Vite (com as variáveis de ambiente configuradas)
7. **Instalar dependências server** - Instala dependências do backend
8. **Preservar server/.env** - Mantém ficheiro `.env` do servidor existente (não o sobrescreve)
9. **Reiniciar PM2** - Reinicia o servidor Node.js com variáveis atualizadas
10. **Reload Nginx** - Recarrega o Nginx para servir os novos ficheiros
11. **Verificar serviços** - Verifica que Postgres e PM2 estão a correr
12. **Health check** - Verifica se o servidor responde corretamente ao endpoint `/health`

## Verificar Status do Deploy

1. Vai ao repositório no GitHub
2. Clica na aba **Actions**
3. Clica no workflow que está a correr para ver os logs em tempo real

## Notas Importantes

- A chave `VITE_CLERK_PUBLISHABLE_KEY` é configurada automaticamente no arquivo `client/.env` antes do build através do secret do GitHub
- O arquivo `client/.env` é atualizado automaticamente a cada deploy, preservando outras variáveis de ambiente que possam existir
- O ficheiro `server/.env` é preservado - o workflow só cria novo se não existir
- O build do frontend é feito no servidor durante o deploy com as variáveis de ambiente corretas
- O PM2 reinicia automaticamente o servidor Node.js após cada deploy
- O Nginx é recarregado para servir os novos ficheiros compilados

## Troubleshooting

### Deploy falha no passo SSH
- Verifica se a chave SSH está correta
- Confirma que o SSH_HOST e SSH_PORT estão corretos
- Verifica que o servidor está acessível

### Deploy falha no build
- Verifica os logs do GitHub Actions para ver o erro específico
- Confirma que o secret `VITE_CLERK_PUBLISHABLE_KEY` está configurado no GitHub
- Verifica que a chave Clerk está correta (deve começar com `pk_test_` ou `pk_live_`)
- Confirma que Node.js está instalado no servidor
- Verifica que há espaço em disco suficiente

### Erro "Missing Clerk Publishable Key"
- Verifica se o secret `VITE_CLERK_PUBLISHABLE_KEY` está configurado no GitHub (Settings > Secrets and variables > Actions)
- Confirma que o secret contém a chave completa do Clerk (sem espaços extras)
- Verifica os logs do deploy para confirmar que a chave foi passada corretamente

### Servidor não reinicia
- Verifica se o PM2 está instalado: `pm2 list`
- Verifica os logs do PM2: `pm2 logs instructions-server`
- Confirma que o processo PM2 existe: `pm2 describe instructions-server`

---

*Última atualização: 2025-10-30 - Configuração automática de VITE_CLERK_PUBLISHABLE_KEY via secrets*

