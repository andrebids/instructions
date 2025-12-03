import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migration: Add animationSimulationUrl field to products table
 * Adiciona campo para URL do vídeo de simulação animada do produto
 * 
 * Campo adicionado:
 * - animationSimulationUrl: VARCHAR(255) - URL do vídeo de simulação animada
 * 
 * Uso: node src/migrations/add-animation-simulation-url-field.js
 */
export async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campo animationSimulationUrl aos produtos...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela products existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      );
    `;
    
    const tableExists = await sequelize.query(tableExistsQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!tableExists[0].exists) {
      console.log('⚠️  Tabela "products" não existe. Execute o sync dos modelos primeiro.');
      return;
    }
    
    // Verificar se o campo já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'animationSimulationUrl';
    `;
    
    const existingColumns = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    if (existingColumns.length > 0) {
      console.log('⏭️  Campo "animationSimulationUrl" já existe, pulando...');
      return;
    }
    
    // Adicionar campo
    const alterQuery = `
      ALTER TABLE products 
      ADD COLUMN "animationSimulationUrl" VARCHAR(255) NULL;
    `;
    
    await sequelize.query(alterQuery);
    console.log('✅ Campo "animationSimulationUrl" adicionado com sucesso!');
    
    console.log('\n🎉 Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migration:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

// Executar apenas se chamado diretamente (não quando importado)
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('add-animation-simulation-url-field.js')
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

