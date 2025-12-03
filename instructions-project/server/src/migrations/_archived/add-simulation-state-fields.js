import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add uploadedImages and simulationState fields to projects table
 * Adiciona campos para estado completo das simulações à tabela projects
 * 
 * uploadedImages: Array com metadados das imagens uploadadas
 * simulationState: Objeto com estado da simulação (uploadStep, selectedImageId, isDayMode, conversionComplete)
 * 
 * Uso: npm run migrate:simulationState
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campos uploadedImages e simulationState ao projeto...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se os campos já existem
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('uploadedImages', 'simulationState');
    `;
    
    const existingColumns = await sequelize.query(checkColumnsQuery, {
      type: QueryTypes.SELECT
    });
    
    const existingColumnNames = existingColumns.map(col => col.column_name);
    const uploadedImagesExists = existingColumnNames.includes('uploadedImages');
    const simulationStateExists = existingColumnNames.includes('simulationState');
    
    console.log('📋 Campo uploadedImages existe?', uploadedImagesExists ? 'Sim' : 'Não');
    console.log('📋 Campo simulationState existe?', simulationStateExists ? 'Sim' : 'Não');
    
    if (!uploadedImagesExists) {
      // Adicionar campo uploadedImages
      const alterQuery1 = `
        ALTER TABLE projects 
        ADD COLUMN "uploadedImages" JSONB DEFAULT '[]'::jsonb;
      `;
      
      await sequelize.query(alterQuery1);
      console.log('✅ Campo "uploadedImages" adicionado com sucesso');
      console.log('   Descrição: Array com metadados das imagens uploadadas: [{ id, name, thumbnail, dayVersion, nightVersion, originalUrl, conversionStatus, cartouche }]');
    } else {
      console.log('⏭️  Campo "uploadedImages" já existe, pulando...');
    }
    
    if (!simulationStateExists) {
      // Adicionar campo simulationState
      const alterQuery2 = `
        ALTER TABLE projects 
        ADD COLUMN "simulationState" JSONB DEFAULT '{"uploadStep":"uploading","selectedImageId":null,"isDayMode":true,"conversionComplete":{}}'::jsonb;
      `;
      
      await sequelize.query(alterQuery2);
      console.log('✅ Campo "simulationState" adicionado com sucesso');
      console.log('   Descrição: Estado da simulação: { uploadStep, selectedImageId, isDayMode, conversionComplete }');
    } else {
      console.log('⏭️  Campo "simulationState" já existe, pulando...');
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

