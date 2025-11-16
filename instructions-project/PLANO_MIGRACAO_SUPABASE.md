# 📋 Plano de Migração para Supabase

## 🎯 Objetivo
Migrar o projeto de PostgreSQL local/remoto para Supabase (PostgreSQL gerenciado + Storage).

---

## 📊 Estrutura Atual do Projeto

### Base de Dados
- **Tipo**: PostgreSQL
- **ORM**: Sequelize
- **Modelos**: Project, Product, Decoration, ProjectElement, ProjectNote
- **Conexão**: Via variáveis de ambiente (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)

### Storage de Arquivos
- **Sistema**: Multer (armazenamento local)
- **Diretórios**:
  - `public/uploads/products/` - Imagens de produtos
  - `public/uploads/projects/{projectId}/day/` - Imagens de projetos (dia)
  - `public/uploads/projects/{projectId}/night/` - Imagens de projetos (noite)
  - `public/uploads/editor/` - Imagens do editor

---

## ✅ O QUE EU POSSO FAZER (Auto)

### 1. Atualizar Configuração de Base de Dados
- ✅ Modificar `server/src/config/database.js` para usar Supabase
- ✅ Atualizar variáveis de ambiente necessárias
- ✅ Configurar SSL para conexão Supabase

### 2. Instalar Dependências do Supabase
- ✅ Adicionar `@supabase/supabase-js` ao `package.json`
- ✅ Configurar cliente Supabase para Storage

### 3. Criar Serviço de Upload para Supabase Storage
- ✅ Criar `server/src/services/supabaseStorage.js`
- ✅ Substituir Multer por upload direto para Supabase Storage
- ✅ Atualizar middlewares de upload:
  - `server/src/middleware/upload.js`
  - `server/src/middleware/projectUpload.js`
  - `server/src/routes/editor-upload.js`

### 4. Atualizar Serviços que Usam Uploads
- ✅ Atualizar `server/src/services/projectUploadService.js`
- ✅ Atualizar referências de URLs de arquivos

### 5. Criar Script de Migração de Dados
- ✅ Script para exportar dados da base atual
- ✅ Script para importar para Supabase (se necessário)

### 6. Atualizar Documentação
- ✅ Atualizar `.env.example` com novas variáveis
- ✅ Atualizar `SETUP.md` com instruções Supabase

---

## 🔧 O QUE VOCÊ PRECISA CONFIGURAR NO SUPABASE

### 1. Criar Projeto no Supabase

1. Aceda a [https://supabase.com](https://supabase.com)
2. Crie uma conta (se não tiver)
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: `instructions-project` (ou outro nome)
   - **Database Password**: Guarde esta senha! (será usada em `DB_PASSWORD`)
   - **Region**: Escolha a região mais próxima
   - **Pricing Plan**: Free tier é suficiente para começar

### 2. Obter Credenciais de Conexão

Após criar o projeto, vá em **Settings** → **Database**:

1. **Connection String**:
   - Copie a **Connection string** (URI format)
   - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - Ou use os valores individuais:
     - **Host**: `db.[PROJECT_REF].supabase.co`
     - **Port**: `5432`
     - **Database**: `postgres`
     - **User**: `postgres`
     - **Password**: A senha que definiu ao criar o projeto

2. **Connection Pooling** (opcional, para melhor performance):
   - Vá em **Settings** → **Database** → **Connection Pooling**
   - Use a porta `6543` para connection pooling (recomendado para produção)

### 3. Configurar Storage (Buckets)

Vá em **Storage** no menu lateral:

#### Bucket 1: `products`
1. Clique em **"New bucket"**
2. Nome: `products`
3. **Public bucket**: ✅ Sim (para acesso público às imagens)
4. **File size limit**: `10 MB` (ou ajuste conforme necessário)
5. **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

#### Bucket 2: `projects`
1. Clique em **"New bucket"**
2. Nome: `projects`
3. **Public bucket**: ✅ Sim
4. **File size limit**: `15 MB`
5. **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

#### Bucket 3: `editor`
1. Clique em **"New bucket"**
2. Nome: `editor`
3. **Public bucket**: ✅ Sim
4. **File size limit**: `15 MB`
5. **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif`

### 4. Configurar Políticas de Storage (RLS)

Para cada bucket, configure políticas de acesso:

#### Política para `products` (Read/Write):
```sql
-- Permitir leitura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'products');

-- Permitir upload (ajuste conforme suas necessidades de autenticação)
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'products');
```

#### Política para `projects` (Read/Write):
```sql
-- Permitir leitura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'projects');

-- Permitir upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'projects');
```

#### Política para `editor` (Read/Write):
```sql
-- Permitir leitura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'editor');

-- Permitir upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'editor');
```

**Como aplicar:**
1. Vá em **Storage** → Selecione o bucket
2. Clique em **"Policies"**
3. Clique em **"New Policy"**
4. Use o template acima ou configure conforme suas necessidades

### 5. Obter API Keys

Vá em **Settings** → **API**:

1. **Project URL**: `https://[PROJECT_REF].supabase.co`
2. **anon/public key**: Use esta para operações públicas (frontend)
3. **service_role key**: Use esta para operações no backend (⚠️ NUNCA exponha no frontend!)

### 6. Executar Migrações/Schema

Após eu atualizar o código, você precisará:

1. **Opção A - Via Supabase Dashboard (SQL Editor)**:
   - Vá em **SQL Editor**
   - Execute o script de criação de tabelas (eu vou gerar)
   - Ou importe via `npm run setup` (após atualizar conexão)

2. **Opção B - Via Sequelize (Recomendado)**:
   - Após configurar `.env` com credenciais Supabase
   - Execute: `npm run setup` no diretório `server/`
   - Isso criará todas as tabelas automaticamente

---

## 📝 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Após configurar no Supabase, você precisará atualizar `server/.env`:

```env
# Base de Dados Supabase
DB_HOST=db.[PROJECT_REF].supabase.co
DB_PORT=5432
# Para connection pooling (recomendado): DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=[SUA_SENHA_DO_SUPABASE]

# Supabase Storage
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
SUPABASE_ANON_KEY=[ANON_KEY]  # Opcional, para frontend

# Outras configurações (manter)
NODE_ENV=production
PORT=5000
CLERK_SECRET_KEY=
ENABLE_AUTH=false
UPLOAD_MAX_SIZE=10485760
VIDEO_MAX_SIZE=52428800
```

---

## 🔄 PROCESSO DE MIGRAÇÃO (Passo a Passo)

### Fase 1: Preparação (Você)
1. ✅ Criar projeto no Supabase
2. ✅ Criar buckets de storage
3. ✅ Configurar políticas RLS
4. ✅ Obter credenciais (URL, keys, connection string)

### Fase 2: Atualização do Código (Eu)
1. ✅ Instalar dependências Supabase
2. ✅ Atualizar configuração de base de dados
3. ✅ Criar serviço de storage Supabase
4. ✅ Atualizar middlewares de upload
5. ✅ Atualizar serviços que usam uploads

### Fase 3: Migração de Dados (Você + Eu)
1. ✅ Exportar dados da base atual (se tiver acesso)
2. ✅ Importar schema para Supabase
3. ✅ Importar dados (se necessário)
4. ✅ Migrar arquivos para Supabase Storage (se necessário)

### Fase 4: Testes (Você)
1. ✅ Testar conexão com base de dados
2. ✅ Testar upload de imagens
3. ✅ Testar criação de projetos
4. ✅ Verificar se URLs de imagens funcionam

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### Storage de Arquivos
- **Antes**: Arquivos salvos localmente em `public/uploads/`
- **Depois**: Arquivos salvos no Supabase Storage
- **URLs**: Mudarão de `/uploads/...` para `https://[PROJECT_REF].supabase.co/storage/v1/object/public/...`
- **Migração**: Se tiver arquivos existentes, precisará fazer upload manual ou criar script de migração

### Base de Dados
- **Compatibilidade**: Supabase usa PostgreSQL, então Sequelize funciona sem mudanças
- **SSL**: Conexões Supabase requerem SSL (eu vou configurar)
- **Connection Pooling**: Recomendado usar porta `6543` para melhor performance

### Custos
- **Free Tier**: 
  - 500 MB de base de dados
  - 1 GB de storage
  - 2 GB de bandwidth
- **Monitoramento**: Acompanhe uso em **Settings** → **Usage**

### Segurança
- ⚠️ **NUNCA** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- Use `SUPABASE_ANON_KEY` apenas no frontend (se necessário)
- Configure políticas RLS adequadamente

---

## 📚 RECURSOS ÚTEIS

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## ✅ CHECKLIST FINAL

### No Supabase:
- [ ] Projeto criado
- [ ] Credenciais obtidas (URL, keys, connection string)
- [ ] Buckets criados (`products`, `projects`, `editor`)
- [ ] Políticas RLS configuradas
- [ ] Schema/tabelas criadas (via `npm run setup`)

### No Projeto:
- [ ] `.env` atualizado com credenciais Supabase
- [ ] Dependências instaladas (`npm install`)
- [ ] Código atualizado (eu faço)
- [ ] Testes realizados
- [ ] Arquivos migrados (se necessário)

---

**Próximo Passo**: Após você configurar o Supabase e me fornecer as credenciais, eu atualizo todo o código do projeto! 🚀

