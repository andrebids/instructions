import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add lastEditedStep field to projects table
 * Adiciona campo para guardar o último step onde o usuário estava editando
 * 
 * Campo adicionado:
 * - lastEditedStep: STRING (nullable) - Último step do editor onde o usuário estava (ex: "ai-designer", "project-details")
 * 
 * Uso: node src/migrations/add-last-edited-step-field.js
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campo lastEditedStep à tabela projects...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela projects existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      );
    `;
    
    const tableExists = await sequelize.query(tableExistsQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!tableExists[0].exists) {
      console.log('⚠️  Tabela "projects" não existe. Execute o sync dos modelos primeiro.');
      return;
    }
    
    // Verificar se o campo já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'lastEditedStep';
    `;
    
    const existingColumns = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    const columnExists = existingColumns.length > 0;
    
    if (columnExists) {
      console.log('⏭️  Campo "lastEditedStep" já existe, pulando...');
      console.log('\n🎉 Migration concluída (sem alterações necessárias)!');
      return;
    }
    
    // Adicionar campo
    const alterQuery = `
      ALTER TABLE projects 
      ADD COLUMN "lastEditedStep" VARCHAR(255) NULL;
    `;
    
    await sequelize.query(alterQuery);
    console.log('✅ Campo "lastEditedStep" adicionado com sucesso');
    
    // Adicionar comentário na coluna (PostgreSQL)
    const commentQuery = `
      COMMENT ON COLUMN projects."lastEditedStep" IS 'Último step do editor onde o usuário estava (ex: "ai-designer", "project-details")';
    `;
    
    try {
      await sequelize.query(commentQuery);
      console.log('✅ Comentário adicionado à coluna');
    } catch (commentError) {
      console.log('⚠️  Não foi possível adicionar comentário (pode não ser suportado):', commentError.message);
    }
    
    console.log('\n📊 Resumo da migration:');
    console.log('   ✅ Campo adicionado: lastEditedStep');
    console.log('\n🎉 Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migration:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar migration
migrate()
  .then(() => {
    console.log('✅ Migration executada com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  });

