/**
 * Migration para criar índices de pesquisa otimizados
 * Cria índices trigram (pg_trgm) para melhorar performance de pesquisas ILIKE
 * Execute com: node src/migrations/create-search-indexes.js
 */

import sequelize from '../config/database.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function migrate() {
  try {
    console.log('🔄 Criando índices de pesquisa otimizados...');

    // Habilitar extensão pg_trgm (necessária para índices trigram)
    console.log('📦 Habilitando extensão pg_trgm...');
    await sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
    console.log('✅ Extensão pg_trgm habilitada');

    // Criar índices trigram GIN para products
    console.log('📊 Criando índices para tabela products...');
    
    // Índice para products.id (referência)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_products_id_trgm 
      ON products USING gin(id gin_trgm_ops);
    `);
    console.log('✅ Índice idx_products_id_trgm criado');

    // Índice para products.name
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
      ON products USING gin(name gin_trgm_ops);
    `);
    console.log('✅ Índice idx_products_name_trgm criado');

    // Índice para products.type
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_products_type_trgm 
      ON products USING gin(type gin_trgm_ops);
    `);
    console.log('✅ Índice idx_products_type_trgm criado');

    // Criar índices trigram GIN para projects
    console.log('📊 Criando índices para tabela projects...');
    
    // Índice para projects.name
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_name_trgm 
      ON projects USING gin(name gin_trgm_ops);
    `);
    console.log('✅ Índice idx_projects_name_trgm criado');

    console.log('🎉 Migração de índices concluída com sucesso!');
    console.log('');
    console.log('💡 Os índices trigram melhoram significativamente a performance');
    console.log('   de pesquisas ILIKE com wildcards (ex: %query%)');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (não quando importado)
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('create-search-indexes.js')
);

if (isMainModule) {
  migrate()
    .then(() => {
      console.log('✅ Migration executada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar migration:', error);
      process.exit(1);
    });
}





