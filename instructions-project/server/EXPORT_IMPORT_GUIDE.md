# 📤 Guia de Exportação e Importação de Base de Dados

Este guia explica como partilhar a sua base de dados PostgreSQL com outros desenvolvedores.

## 📋 Pré-requisitos

- PostgreSQL instalado com ferramentas de linha de comando (`pg_dump` e `psql`)
- Base de dados configurada e a funcionar
- Node.js instalado

## 🚀 Como Exportar a Base de Dados (Você)

### Opção 1: Usando o Script Node.js (Recomendado)

```bash
cd instructions-project/server
npm run export-db
```

Isto irá criar um ficheiro `database-export-YYYY-MM-DD-HHmmss.sql` na pasta `server/`.

### Opção 2: Usando pg_dump Manualmente

```bash
cd instructions-project/server

# Windows (PowerShell/CMD)
set PGPASSWORD=demo_password
pg_dump -h localhost -p 5433 -U demo_user -d instructions_demo --no-owner --no-acl > database-export.sql

# Linux/Mac
PGPASSWORD=demo_password pg_dump -h localhost -p 5433 -U demo_user -d instructions_demo --no-owner --no-acl > database-export.sql
```

**Nota:** Substitua as credenciais pelas suas (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` do seu `.env`).

## 📤 Partilhar o Ficheiro

1. Localize o ficheiro `.sql` criado (ex: `database-export-2025-01-30-143022.sql`)
2. Partilhe o ficheiro com o seu colega via:
   - Email
   - Google Drive / Dropbox
   - WeTransfer
   - Ou qualquer outro método de partilha de ficheiros

**⚠️ IMPORTANTE:** 
- O ficheiro pode ser grande se tiver muitos dados
- Pode conter dados sensíveis - tenha cuidado ao partilhar
- Compressa o ficheiro (ZIP) para reduzir tamanho se necessário

## 📥 Como Importar a Base de Dados (Colega)

### Passo 1: Preparar Ambiente

1. Certifique-se que PostgreSQL está a correr
2. Certifique-se que a base de dados existe:
   ```sql
   CREATE DATABASE instructions_demo;
   CREATE USER demo_user WITH PASSWORD 'demo_password';
   GRANT ALL PRIVILEGES ON DATABASE instructions_demo TO demo_user;
   ```
3. Configure o `.env` com as credenciais corretas

### Passo 2: Colocar o Ficheiro SQL

Coloque o ficheiro `.sql` recebido na pasta `server/`:
```
instructions-project/
└── server/
    └── database-export-XXXXXX.sql  ← Coloque aqui
```

### Passo 3: Importar

#### Opção 1: Usando o Script Node.js (Recomendado)

```bash
cd instructions-project/server

# Importar automaticamente o ficheiro mais recente
npm run import-db

# Ou especificar o ficheiro
npm run import-db -- database-export-2025-01-30-143022.sql
```

#### Opção 2: Usando psql Manualmente

```bash
cd instructions-project/server

# Windows (PowerShell/CMD)
set PGPASSWORD=demo_password
psql -h localhost -p 5433 -U demo_user -d instructions_demo -f database-export-XXXXXX.sql

# Linux/Mac
PGPASSWORD=demo_password psql -h localhost -p 5433 -U demo_user -d instructions_demo -f database-export-XXXXXX.sql
```

### Passo 4: Executar Setup (Importante!)

Após importar, execute o setup para garantir que o schema está atualizado:

```bash
npm run setup
```

Isto irá:
- Verificar a estrutura da base de dados
- Executar migrations necessárias
- Garantir que tudo está sincronizado

### Passo 5: Verificar

```bash
npm run diagnose
```

Isto verifica se todas as tabelas foram importadas corretamente.

## 🔍 Troubleshooting

### Erro: "pg_dump não encontrado"

**Solução:** Instale PostgreSQL client tools:
- Windows: Instale PostgreSQL completo (inclui pg_dump)
- Ou adicione a pasta `bin` do PostgreSQL ao PATH

### Erro: "psql não encontrado"

**Solução:** Mesmo que acima - instale PostgreSQL client tools

### Erro: "permission denied" ou "access denied"

**Solução:** 
- Verifique que o utilizador tem permissões na base de dados
- Verifique credenciais no `.env`

### Erro: "database does not exist"

**Solução:** Crie a base de dados primeiro:
```sql
CREATE DATABASE instructions_demo;
```

### Erro: "relation already exists"

**Solução:** Isto é normal se já existirem tabelas. Pode continuar ou limpar a base de dados primeiro:
```sql
DROP DATABASE instructions_demo;
CREATE DATABASE instructions_demo;
```

## 📝 Notas Importantes

1. **Backup:** Sempre faça backup antes de importar!
2. **Schema:** O schema deve ser compatível entre versões
3. **Migrations:** Execute sempre `npm run setup` após importar
4. **Credenciais:** Certifique-se que ambos têm as mesmas credenciais ou ajuste o `.env`
5. **Tamanho:** Ficheiros grandes podem demorar vários minutos a importar

## 🌐 Base de Dados Partilhada na VM Google Cloud

### ⚡ Configuração Atual

A base de dados está hospedada numa VM do Google Cloud e pode ser acedida remotamente por todos os desenvolvedores.

**Configuração:**
- **IP da VM:** `35.239.46.72`
- **Porta:** `5433`
- **Base de dados:** `instructions_demo`
- **Utilizador:** `demo_user`
- **Password:** `demo_password`
- **Status:** ✅ Firewall configurado e PostgreSQL acessível remotamente

### 📝 Como Conectar à Base de Dados Partilhada

#### Passo 1: Atualizar `.env`

Edite o ficheiro `server/.env` e altere o `DB_HOST`:

```env
NODE_ENV=development
PORT=5000

DB_HOST=35.239.46.72  # ← IP da VM do Google Cloud
DB_PORT=5433
DB_NAME=instructions_demo
DB_USER=demo_user
DB_PASSWORD=demo_password

CLERK_SECRET_KEY=
ENABLE_AUTH=false

UPLOAD_MAX_SIZE=10485760
VIDEO_MAX_SIZE=52428800
```

#### Passo 2: Testar Conexão

```bash
cd instructions-project/server
npm run diagnose
```

Deve mostrar: `✅ Conexão PostgreSQL estabelecida com sucesso!`

#### Passo 3: Executar Setup (Primeira Vez)

Se for a primeira vez a conectar, execute o setup para criar as tabelas:

```bash
npm run setup
```

### ✅ Vantagens da Base de Dados Partilhada

1. **Dados sincronizados:** Todos trabalham com os mesmos dados
2. **Sem exportar/importar:** Não precisa de partilhar ficheiros SQL
3. **Tempo real:** Alterações são imediatas para todos
4. **Centralizada:** Backups e manutenção num só local

### ⚠️ Considerações Importantes

1. **Concorrência:** 
   - PostgreSQL suporta múltiplos utilizadores simultâneos
   - Tenha cuidado ao alterar os mesmos dados ao mesmo tempo
   - Use transações para operações críticas

2. **Latência:**
   - Pode ser mais lento que localhost devido à distância
   - Operações pesadas podem demorar mais tempo

3. **Conexão:**
   - Requer ligação à internet
   - Se a VM cair, todos ficam sem acesso

4. **Segurança:**
   - A password está partilhada entre toda a equipa
   - Use apenas para desenvolvimento
   - Para produção, considere VPN ou IPs restritos

### 🔧 Troubleshooting

#### Erro: "timeout" ou "connection refused"

**Solução:**
1. Verifique ligação à internet
2. Verifique se o IP está correto: `35.239.46.72`
3. Verifique firewall do seu computador/local
4. Teste ping: `ping 35.239.46.72`

#### Erro: "password authentication failed"

**Solução:**
- Verifique se a password no `.env` está correta: `demo_password`
- Verifique se o utilizador está correto: `demo_user`

#### Erro: "database does not exist"

**Solução:**
- Verifique se o nome da base de dados está correto: `instructions_demo`
- Execute `npm run setup` para criar as tabelas

### 🔄 Voltar para Localhost

Se quiser trabalhar localmente novamente, altere o `.env`:

```env
DB_HOST=localhost  # ← Voltar para localhost
DB_PORT=5433
```

Certifique-se que tem PostgreSQL a correr localmente!

## 🎯 Resumo Rápido

**Exportar/Importar (método antigo):**
```bash
cd server && npm run export-db
# Partilhe o ficheiro .sql criado
```

**Usar Base de Dados Partilhada (recomendado):**
```bash
# Atualizar server/.env com DB_HOST=35.239.46.72
cd server
npm run diagnose  # Testar conexão
npm run setup      # Primeira vez apenas
npm run dev        # Iniciar servidor
```

