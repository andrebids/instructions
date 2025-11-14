import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add cartoucheByImage field to projects table
 * Adiciona campo para metadados do cartouche por imagem à tabela projects
 * 
 * Este campo armazena metadados do cartouche associados a cada imagem:
 * { imageId: { projectName, streetOrZone, option, hasCartouche } }
 * 
 * Uso: npm run migrate:cartouche
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campo cartoucheByImage ao projeto...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se o campo já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'cartoucheByImage';
    `;
    
    const existingColumns = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    const columnExists = existingColumns.length > 0;
    console.log('📋 Campo cartoucheByImage existe?', columnExists ? 'Sim' : 'Não');
    
    if (!columnExists) {
      // Adicionar campo
      const alterQuery = `
        ALTER TABLE projects 
        ADD COLUMN "cartoucheByImage" JSONB DEFAULT '{}'::jsonb;
      `;
      
      await sequelize.query(alterQuery);
      console.log('✅ Campo "cartoucheByImage" adicionado com sucesso');
      console.log('   Descrição: Metadados do cartouche por imagem: { imageId: { projectName, streetOrZone, option, hasCartouche } }');
    } else {
      console.log('⏭️  Campo "cartoucheByImage" já existe, pulando...');
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

