import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migration: Create SequelizeMeta table for tracking executed migrations
 * 
 * Esta migration cria a tabela SequelizeMeta que rastreia quais migrations
 * já foram executadas. Esta tabela é compatível com o padrão Sequelize CLI.
 * 
 * Uso: node src/migrations/create-migrations-tracking-table.js
 */
export async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Criar tabela de tracking de migrations...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SequelizeMeta'
      );
    `;
    
    const tableExists = await sequelize.query(checkTableQuery, {
      type: QueryTypes.SELECT
    });
    
    if (tableExists[0].exists) {
      console.log('⏭️  Tabela SequelizeMeta já existe, pulando criação...');
      console.log('✅ Migration concluída (tabela já existe)');
      return;
    }
    
    // Criar tabela SequelizeMeta
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `;
    
    await sequelize.query(createTableQuery);
    console.log('✅ Tabela SequelizeMeta criada com sucesso');
    
    // Adicionar índice para melhor performance (opcional, mas útil)
    try {
      const createIndexQuery = `
        CREATE INDEX IF NOT EXISTS "SequelizeMeta_name_idx" 
        ON "SequelizeMeta" (name);
      `;
      await sequelize.query(createIndexQuery);
      console.log('✅ Índice criado na coluna name');
    } catch (indexError) {
      // Índice pode já existir, não é crítico
      console.log('⚠️  Índice já existe ou não foi necessário');
    }
    
    console.log('\n📊 Resumo da migration:');
    console.log('   ✅ Tabela SequelizeMeta criada');
    console.log('   📋 Esta tabela será usada para rastrear migrations executadas');
    console.log('\n🎉 Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migration:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar migration apenas se for chamada diretamente (não quando importada)
// Quando importada pelo migrationRunner, não deve chamar process.exit()
// Verificar se o arquivo está sendo executado diretamente comparando caminhos
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('create-migrations-tracking-table.js')
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

