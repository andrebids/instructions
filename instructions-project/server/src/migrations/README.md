# Sistema de Migrations

Este diretório contém as migrations para alterações no schema da base de dados.

## Como usar

### Executar uma migration específica

```bash
node src/migrations/add-product-category-fields.js
```

### Lista de migrations disponíveis

1. **add-canvas-fields.js** - Adiciona campos de canvas à tabela projects
2. **add-product-category-fields.js** - Adiciona campos de categoria à tabela products:
   - `season`: ENUM('xmas', 'summer') - Estação/categoria do produto
   - `isTrending`: BOOLEAN - Se o produto está em trending
   - `releaseYear`: INTEGER - Ano de lançamento da coleção (usado para tag "new" automática)
   - `isOnSale`: BOOLEAN - Se o produto está em promoção

3. **add-product-dimensions-fields.js** - Adiciona campos de dimensões à tabela products:
   - `height`: DECIMAL(10, 2) - Altura em metros (H)
   - `width`: DECIMAL(10, 2) - Largura em metros (W)
   - `depth`: DECIMAL(10, 2) - Profundidade em metros (D)
   - `diameter`: DECIMAL(10, 2) - Diâmetro em metros

4. **remove-isSourceImage-field.js** - Remove o campo `isSourceImage` da tabela products:
   - Remove o campo `isSourceImage`: BOOLEAN - Campo removido porque não é mais necessário

**Nota sobre `releaseYear`**: 
- Este campo é usado para marcar automaticamente produtos como "new"
- A tag "new" é adicionada automaticamente aos produtos com o `releaseYear` mais recente
- A tag "new" é removida automaticamente de produtos com anos anteriores quando um novo produto com ano mais recente é adicionado/atualizado

**Nota sobre dimensões**:
- Os campos de dimensões são usados para filtros no backend
- Suporta filtros por range: `minHeight`, `maxHeight`, `minWidth`, `maxWidth`, `minDepth`, `maxDepth`, `minDiameter`, `maxDiameter`
- Exemplo de uso: `/api/products?minHeight=2&maxHeight=3&minWidth=1.5`

## Estrutura de uma migration

Cada migration deve:
1. Verificar se os campos já existem antes de adicionar
2. Ser idempotente (pode ser executada múltiplas vezes sem problemas)
3. Fechar a conexão no finally
4. Retornar exit codes apropriados (0 para sucesso, 1 para erro)

## Boas práticas

- ✅ Sempre verificar se a tabela/coluna existe antes de criar/modificar
- ✅ Usar transações quando possível
- ✅ Fazer backup antes de migrations em produção
- ✅ Testar migrations em ambiente de desenvolvimento primeiro
- ✅ Documentar o que cada migration faz

## Próximos passos

Para um sistema mais robusto, considere usar Sequelize CLI:
```bash
npm install --save-dev sequelize-cli
npx sequelize-cli migration:generate --name add-something
```

