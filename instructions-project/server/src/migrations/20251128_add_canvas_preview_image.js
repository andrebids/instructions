/**
 * Migration para adicionar campo canvasPreviewImage à tabela projects
 * Execute com: node src/migrations/20251128_add_canvas_preview_image.js
 */

import sequelize from '../config/database.js';

async function migrate() {
  try {
    console.log('🔄 Adicionando campo canvasPreviewImage...');

    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'canvasPreviewImage';
    `);

    if (results.length > 0) {
      console.log('⏭️  Campo canvasPreviewImage já existe');
    } else {
      // Adicionar a coluna
      await sequelize.query(`
        ALTER TABLE projects 
        ADD COLUMN "canvasPreviewImage" TEXT;
      `);
      console.log('✅ Campo canvasPreviewImage adicionado');
    }

    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();

