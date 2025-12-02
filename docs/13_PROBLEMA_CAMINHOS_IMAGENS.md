# Problema: Caminhos de Imagens Não Funcionam Entre Utilizadores

## Problema Identificado

Quando dois utilizadores usam a mesma base de dados e os ficheiros estão num local comum, um utilizador não consegue ver as imagens dos produtos que o outro uploadou.

## Causa Raiz

O código usa `process.cwd()` em vários lugares críticos, o que torna os caminhos dependentes do **diretório de trabalho atual** onde o servidor é iniciado.

### Locais Problemáticos

1. **`server/src/app.js` (linha 120)**:
   ```javascript
   app.use('/api/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));
   ```
   - Se o servidor for iniciado de `instructions-project/server/`, procura `server/public/uploads`
   - Se o servidor for iniciado de `instructions-project/`, procura `instructions-project/public/uploads`

2. **`server/src/middleware/upload.js` (linha 10)**:
   ```javascript
   var uploadDir = path.resolve(process.cwd(), 'public/uploads/products');
   ```
   - Mesmo problema: depende de onde o servidor é iniciado

3. **`server/src/services/projectUploadService.js`**:
   - Usa `process.cwd()` em múltiplos lugares para construir caminhos

## Solução Recomendada

### Opção 1: Usar `__dirname` (Recomendado)

Usar `__dirname` em vez de `process.cwd()` garante que os caminhos são sempre relativos ao ficheiro de código, não ao diretório de execução.

**Vantagens:**
- Caminhos consistentes independentemente de onde o servidor é iniciado
- Mais previsível e confiável
- Não requer configuração adicional

**Desvantagens:**
- Requer alterações em múltiplos ficheiros

### Opção 2: Variável de Ambiente

Definir uma variável de ambiente `UPLOADS_BASE_PATH` ou `PUBLIC_DIR` que define o diretório base.

**Vantagens:**
- Flexível para diferentes configurações
- Pode ser configurado por utilizador/ambiente

**Desvantagens:**
- Requer configuração em cada ambiente
- Mais complexo de manter

### Opção 3: Caminho Absoluto Configurável

Usar um caminho absoluto definido numa configuração central.

## Implementação Recomendada (Opção 1)

### 1. Criar utilitário para caminhos base

```javascript
// server/src/utils/pathUtils.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Retorna o diretório base do servidor (onde está o package.json do servidor)
 */
export function getServerBaseDir() {
  return path.resolve(__dirname, '../..');
}

/**
 * Retorna o caminho para o diretório public do servidor
 */
export function getPublicDir() {
  return path.resolve(getServerBaseDir(), 'public');
}

/**
 * Retorna o caminho para o diretório de uploads
 */
export function getUploadsDir() {
  return path.resolve(getPublicDir(), 'uploads');
}

/**
 * Retorna o caminho para uploads de produtos
 */
export function getProductsUploadDir() {
  return path.resolve(getUploadsDir(), 'products');
}

/**
 * Retorna o caminho para uploads de projetos
 */
export function getProjectsUploadDir(projectId = null) {
  const base = path.resolve(getUploadsDir(), 'projects');
  if (projectId) {
    return path.resolve(base, projectId);
  }
  return base;
}
```

### 2. Atualizar `app.js`

```javascript
import { getUploadsDir } from './utils/pathUtils.js';

// Em vez de:
// app.use('/api/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Usar:
app.use('/api/uploads', express.static(getUploadsDir()));
```

### 3. Atualizar `middleware/upload.js`

```javascript
import { getProductsUploadDir } from '../utils/pathUtils.js';

// Em vez de:
// var uploadDir = path.resolve(process.cwd(), 'public/uploads/products');

// Usar:
var uploadDir = getProductsUploadDir();
```

### 4. Atualizar `projectUploadService.js`

Substituir todas as ocorrências de `process.cwd()` por funções do `pathUtils.js`.

## Verificação

Após implementar, verificar:

1. **Servidor iniciado de `server/`**:
   ```bash
   cd instructions-project/server
   npm start
   ```
   - Deve servir ficheiros de `server/public/uploads/`

2. **Servidor iniciado de raiz**:
   ```bash
   cd instructions-project
   npm start  # se houver script na raiz
   ```
   - Deve servir ficheiros do mesmo local: `server/public/uploads/`

3. **Teste com dois utilizadores**:
   - Utilizador A faz upload de imagem
   - Utilizador B deve conseguir ver a imagem
   - Ambos devem ver a mesma imagem na base de dados

## Notas Adicionais

- Os caminhos na base de dados são relativos (`/uploads/products/...`), o que está correto
- O problema está na resolução do caminho físico no servidor
- Imagens estáticas em `/SHOP/` funcionam porque são servidas de `client/public`, que usa `__dirname`

## Configuração para Pasta de Rede Compartilhada (UNC)

**IMPORTANTE**: O sistema já está configurado para usar automaticamente a pasta de rede compartilhada `\\192.168.2.22\.dev\web\thecore` por padrão. Não é necessário configurar variáveis de ambiente a menos que queira usar um caminho diferente.

### Caminhos Padrão (Hardcoded)

O sistema usa automaticamente estes caminhos se existirem:

- **Produtos**: `\\192.168.2.22\.dev\web\thecore\products`
- **Projetos**: `\\192.168.2.22\.dev\web\thecore\projects`
- **Editor**: `\\192.168.2.22\.dev\web\thecore\editor`
- **Base de Uploads**: `\\192.168.2.22\.dev\web\thecore`

Se a pasta de rede não estiver disponível, o sistema usa automaticamente o caminho local como fallback.

### Variáveis de Ambiente (Opcional - Apenas se Quiser Sobrescrever)

Se precisar usar um caminho diferente do padrão, pode configurar estas variáveis de ambiente:

### Variáveis de Ambiente Disponíveis

1. **`UPLOADS_BASE_PATH`** - Caminho base para todos os uploads
   - Exemplo: `\\192.168.2.22\.dev\web\thecore`
   - Se definido, substitui o caminho padrão `server/public/uploads`

2. **`PRODUCTS_UPLOAD_PATH`** - Caminho específico para produtos
   - Exemplo: `\\192.168.2.22\.dev\web\thecore\products`
   - Se definido, usa este caminho diretamente para produtos
   - Tem prioridade sobre `UPLOADS_BASE_PATH` para produtos

3. **`PROJECTS_UPLOAD_PATH`** - Caminho específico para projetos
   - Exemplo: `\\192.168.2.22\.dev\web\thecore\projects`
   - Se definido, usa este caminho diretamente para projetos

4. **`EDITOR_UPLOAD_PATH`** - Caminho específico para editor
   - Exemplo: `\\192.168.2.22\.dev\web\thecore\editor`
   - Se definido, usa este caminho diretamente para editor

### Como Configurar

#### Opção 1: Ficheiro `.env` no servidor

Criar ou editar `instructions-project/server/.env`:

```env
# Caminho específico para produtos na rede compartilhada
PRODUCTS_UPLOAD_PATH=\\192.168.2.22\.dev\web\thecore\products

# Ou caminho base para todos os uploads
UPLOADS_BASE_PATH=\\192.168.2.22\.dev\web\thecore
```

#### Opção 2: Variáveis de Ambiente do Sistema

No Windows PowerShell:
```powershell
$env:PRODUCTS_UPLOAD_PATH="\\192.168.2.22\.dev\web\thecore\products"
```

No Linux/Mac:
```bash
export PRODUCTS_UPLOAD_PATH="//192.168.2.22/.dev/web/thecore/products"
```

### Notas Importantes

1. **Permissões**: Certifique-se de que o utilizador que executa o servidor tem permissões de leitura/escrita na pasta de rede compartilhada

2. **Formato de Caminho**:
   - Windows: Use barras invertidas `\\server\share\path`
   - Linux/Mac: Use barras normais `//server/share/path` ou monte como SMB

3. **Acesso à Rede**: O servidor precisa ter acesso à rede compartilhada antes de iniciar

4. **Fallback**: Se o caminho UNC não existir ou não for acessível, o sistema tentará criar o diretório. Se falhar, usará o caminho padrão local e mostrará um aviso no log.

### Exemplo Completo

Para configurar produtos para usar `\\192.168.2.22\.dev\web\thecore\products`:

1. Criar ficheiro `.env` em `instructions-project/server/.env`:
```env
PRODUCTS_UPLOAD_PATH=\\192.168.2.22\.dev\web\thecore\products
```

2. Reiniciar o servidor

3. Verificar nos logs que aparece:
```
📁 [PATHUTILS] Usando caminho de rede compartilhada para produtos: \\192.168.2.22\.dev\web\thecore\products
```

## Próximos Passos

1. ✅ Implementar `pathUtils.js` - **CONCLUÍDO**
2. ✅ Atualizar todos os ficheiros que usam `process.cwd()` - **CONCLUÍDO**
3. ✅ Suporte para caminhos UNC via variáveis de ambiente - **CONCLUÍDO**
4. Testar com múltiplos utilizadores
5. Configurar variáveis de ambiente para usar pasta de rede compartilhada
6. Documentar a estrutura de diretórios esperada

