import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add canvas fields to projects table
 * Adiciona campos para dados do canvas (AI Designer) à tabela projects
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campos de canvas ao projeto...');
    
    // Verificar se os campos já existem
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('canvasDecorations', 'canvasImages', 'snapZonesByImage', 'decorationsByImage');
    `;
    
    const existingColumns = await sequelize.query(checkColumnsQuery, {
      type: QueryTypes.SELECT
    });
    
    const existingColumnNames = existingColumns.map(col => col.column_name);
    console.log('📋 Colunas existentes:', existingColumnNames);
    
    // Adicionar campos que não existem
    const fieldsToAdd = [
      {
        name: 'canvasDecorations',
        type: 'JSONB',
        defaultValue: "'[]'::jsonb"
      },
      {
        name: 'canvasImages',
        type: 'JSONB',
        defaultValue: "'[]'::jsonb"
      },
      {
        name: 'snapZonesByImage',
        type: 'JSONB',
        defaultValue: "'{}'::jsonb"
      },
      {
        name: 'decorationsByImage',
        type: 'JSONB',
        defaultValue: "'{}'::jsonb"
      }
    ];
    
    for (const field of fieldsToAdd) {
      if (!existingColumnNames.includes(field.name)) {
        const alterQuery = `
          ALTER TABLE projects 
          ADD COLUMN "${field.name}" ${field.type} DEFAULT ${field.defaultValue};
        `;
        
        await sequelize.query(alterQuery);
        console.log(`✅ Campo "${field.name}" adicionado com sucesso`);
      } else {
        console.log(`⏭️  Campo "${field.name}" já existe, pulando...`);
      }
    }
    
    console.log('🎉 Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migration:', error);
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

