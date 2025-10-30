# Setup Guide - Novo Ambiente Local

Este guia explica como configurar o projeto num novo ambiente localhost após fazer `git pull` ou `git clone`.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado e a correr
- Git instalado

## 🚀 Passos de Setup

### 1. Instalar Dependências

```bash
cd instructions-project/server
npm install
```

```bash
cd instructions-project/client
npm install
```

### 2. Configurar Variáveis de Ambiente

#### Backend (server/.env)

Criar ficheiro `.env` no diretório `server` com:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5433
DB_NAME=instructions_demo
DB_USER=demo_user
DB_PASSWORD=demo_password

CLERK_SECRET_KEY=
ENABLE_AUTH=false

UPLOAD_MAX_SIZE=10485760
VIDEO_MAX_SIZE=52428800
```

#### Frontend (client/.env)

Se necessário, criar `.env` no diretório `client`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Criar Base de Dados

Criar a base de dados PostgreSQL:

```sql
CREATE DATABASE instructions_demo;
CREATE USER demo_user WITH PASSWORD 'demo_password';
GRANT ALL PRIVILEGES ON DATABASE instructions_demo TO demo_user;
```

### 4. Executar Setup da Base de Dados

Executar o script de setup que cria tabelas e executa migrations:

```bash
cd instructions-project/server
npm run setup
```

Este script:
- ✅ Verifica conexão com a base de dados
- ✅ Carrega modelos Sequelize
- ✅ Cria/sincroniza tabelas
- ✅ Executa migrations necessárias

### 5. Popular Base de Dados com Dados de Teste (Opcional)

```bash
# Popular produtos
npm run seed:products

# Popular outros dados (projetos, decorações)
npm run seed
```

### 6. Iniciar Servidores

#### Terminal 1 - Backend:
```bash
cd instructions-project/server
npm run dev
```

#### Terminal 2 - Frontend:
```bash
cd instructions-project/client
npm run dev
```

### 7. Verificar se está a funcionar

- Backend: http://localhost:5000/health
- Frontend: http://localhost:3003
- API: http://localhost:5000/api/products

## 🔧 Scripts Disponíveis

### Backend

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm start` - Inicia servidor em modo produção
- `npm run setup` - Setup inicial da base de dados (migrations)
- `npm run migrate` - Executa migration de campos de canvas
- `npm run migrate:products` - Executa migration de campos de produtos
- `npm run migrate:all` - Executa todas as migrations
- `npm run seed:products` - Popular produtos na base de dados
- `npm run seed` - Popular todos os dados de teste

### Frontend

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção

## ⚠️ Troubleshooting

### Erro de conexão à base de dados

1. Verificar se PostgreSQL está a correr
2. Verificar credenciais no `.env`
3. Verificar se a base de dados existe

### Erro `Cannot find package 'sharp'` ou outras dependências

Se vês erros como `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'sharp'`:

**Causa:** As dependências não foram instaladas completamente após `git pull`.

**Soluções:**

1. **Usar o project-manager.bat (Recomendado):**
   - O script agora verifica automaticamente se `sharp` está instalado usando `npm list`
   - Se faltar, instala automaticamente antes de iniciar o servidor
   - Executa: `project-manager.bat` e escolhe opção 1 (INICIAR PROJETO)

2. **Instalar dependências manualmente:**
   ```bash
   cd instructions-project/server
   npm install
   ```

3. **Verificar se sharp está instalado:**
   ```bash
   cd instructions-project/server
   npm list sharp
   ```
   Se não estiver instalado, aparecerá um erro

4. **Limpar e reinstalar (se necessário):**
   ```bash
   cd instructions-project/server
   rm -rf node_modules package-lock.json
   npm install
   ```

**Nota:** O `sharp` foi adicionado recentemente ao `package.json`. Se fizeste `git pull` antes de executar `npm install`, o `sharp` não estará instalado.

### Erro de migrations

Se as migrations falharem, podes executá-las manualmente:

```bash
npm run migrate:all
```

### Porta já em uso

Se a porta 5000 ou 3003 estiverem ocupadas:

1. Alterar `PORT` no `.env` do servidor
2. Alterar `proxy.target` no `vite.config.js` do cliente

## 📝 Notas Importantes

- **Nunca commitar** ficheiros `.env` (já estão no `.gitignore`)
- O script `setup` é **idempotente** - pode ser executado múltiplas vezes sem problemas
- As migrations verificam se os campos já existem antes de criar
- Em produção, usar migrations em vez de `sequelize.sync()`

## 🔄 Atualizar após Pull

Quando fazes `git pull` e há novas migrations:

```bash
cd instructions-project/server
npm install  # Instalar novas dependências se houver
npm run setup  # Executar novas migrations
npm run dev  # Reiniciar servidor
```

