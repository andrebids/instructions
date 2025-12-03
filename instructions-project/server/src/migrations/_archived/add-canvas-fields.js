import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add canvas fields to projects table
 * Adiciona campos para dados do canvas (AI Designer) à tabela projects
 * 
 * Esta migration adiciona os seguintes campos:
 * - canvasDecorations: Array de decorações geradas pelo AI Designer
 * - canvasImages: Array de imagens adicionadas ao canvas
 * - snapZonesByImage: Objeto com zonas de snap por imagem { 'image-id': { day: [], night: [] } }
 * - decorationsByImage: Objeto com decorações por imagem { 'image-id': [...] }
 * 
 * Uso: npm run migrate
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campos de canvas ao projeto...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
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
    console.log('📋 Colunas existentes:', existingColumnNames.length > 0 ? existingColumnNames : 'Nenhuma');
    
    // Adicionar campos que não existem
    const fieldsToAdd = [
      {
        name: 'canvasDecorations',
        type: 'JSONB',
        defaultValue: "'[]'::jsonb",
        description: 'Array de decorações geradas pelo AI Designer'
      },
      {
        name: 'canvasImages',
        type: 'JSONB',
        defaultValue: "'[]'::jsonb",
        description: 'Array de imagens adicionadas ao canvas'
      },
      {
        name: 'snapZonesByImage',
        type: 'JSONB',
        defaultValue: "'{}'::jsonb",
        description: 'Zonas de snap por imagem: { "image-id": { "day": [], "night": [] } }'
      },
      {
        name: 'decorationsByImage',
        type: 'JSONB',
        defaultValue: "'{}'::jsonb",
        description: 'Decorações por imagem: { "image-id": [...] }'
      }
    ];
    
    var addedCount = 0;
    var skippedCount = 0;
    
    for (var i = 0; i < fieldsToAdd.length; i++) {
      var field = fieldsToAdd[i];
      if (!existingColumnNames.includes(field.name)) {
        var alterQuery = `
          ALTER TABLE projects 
          ADD COLUMN "${field.name}" ${field.type} DEFAULT ${field.defaultValue};
        `;
        
        await sequelize.query(alterQuery);
        console.log(`✅ Campo "${field.name}" adicionado com sucesso (${field.description})`);
        addedCount++;
      } else {
        console.log(`⏭️  Campo "${field.name}" já existe, pulando...`);
        skippedCount++;
      }
    }
    
    console.log('\n📊 Resumo da migration:');
    console.log(`   ✅ Campos adicionados: ${addedCount}`);
    console.log(`   ⏭️  Campos já existentes: ${skippedCount}`);
    console.log(`   📋 Total de campos: ${fieldsToAdd.length}`);
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

