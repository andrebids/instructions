import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add logoDetails field to projects table
 * Adiciona campo para dados das instruções do logo à tabela projects
 * 
 * logoDetails: Objeto JSON com todas as especificações do logo (logoNumber, logoName, requestedBy, dimensions, usageOutdoor, fixationType, composition, description, attachmentFiles, etc)
 * 
 * Uso: npm run migrate:logoDetails
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campo logoDetails ao projeto...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se o campo já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'logoDetails';
    `;
    
    const existingColumns = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    const logoDetailsExists = existingColumns.length > 0;
    
    console.log('📋 Campo logoDetails existe?', logoDetailsExists ? 'Sim' : 'Não');
    
    if (!logoDetailsExists) {
      // Adicionar campo logoDetails
      const alterQuery = `
        ALTER TABLE projects 
        ADD COLUMN "logoDetails" JSONB DEFAULT '{}'::jsonb;
      `;
      
      await sequelize.query(alterQuery);
      console.log('✅ Campo "logoDetails" adicionado com sucesso');
      console.log('   Descrição: Dados das instruções do logo: { logoNumber, logoName, requestedBy, dimensions, usageOutdoor, fixationType, composition, description, attachmentFiles, etc }');
    } else {
      console.log('⏭️  Campo "logoDetails" já existe, pulando...');
    }
    
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

