# Sistema de Migrations

Este diretório contém as migrations para alterações no schema da base de dados.

## Como usar

### Executar uma migration específica

```bash
node src/migrations/add-product-category-fields.js
```

### Lista de migrations disponíveis

1. **add-canvas-fields.js** - Adiciona campos de canvas à tabela projects
2. **add-product-category-fields.js** - Adiciona campos de categoria à tabela products (season, isTrending, releaseYear, isOnSale)

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

