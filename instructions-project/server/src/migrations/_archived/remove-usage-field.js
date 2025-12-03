import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Remove usage field from products table
 * Remove o campo usage da tabela products
 * 
 * Campo removido:
 * - usage: STRING - Campo removido porque não é mais necessário
 * 
 * Uso: node src/migrations/remove-usage-field.js
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Remover campo usage da tabela products...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela products existe
    var tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      );
    `;
    
    var tableExists = await sequelize.query(tableExistsQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!tableExists[0].exists) {
      console.log('⚠️  Tabela "products" não existe. Nada para fazer.');
      return;
    }
    
    // Verificar se a coluna existe
    var checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'usage';
    `;
    
    var existingColumn = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    if (existingColumn.length === 0) {
      console.log('✅ Coluna "usage" já não existe na tabela products. Nada para fazer.');
      return;
    }
    
    console.log('📝 Coluna "usage" encontrada. Removendo...');
    
    // Remover a coluna
    var dropColumnQuery = `
      ALTER TABLE products 
      DROP COLUMN IF EXISTS "usage";
    `;
    
    await sequelize.query(dropColumnQuery, {
      type: QueryTypes.RAW
    });
    
    console.log('✅ Coluna "usage" removida com sucesso!');
    console.log('🎉 Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    // Não fechar a conexão para permitir que outras operações continuem
    // await sequelize.close();
  }
}

// Executar migration se chamado diretamente
if (process.argv[1] && process.argv[1].indexOf('remove-usage-field.js') >= 0) {
  migrate()
    .then(function() {
      console.log('✅ Migration executada com sucesso!');
      process.exit(0);
    })
    .catch(function(error) {
      console.error('❌ Erro ao executar migration:', error);
      process.exit(1);
    });
}

export default migrate;

