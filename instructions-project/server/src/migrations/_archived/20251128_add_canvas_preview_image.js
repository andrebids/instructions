/**
 * Migration para adicionar campo canvasPreviewImage à tabela projects
 * Execute com: node src/migrations/20251128_add_canvas_preview_image.js
 */

import sequelize from '../config/database.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function migrate() {
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
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (não quando importado)
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('20251128_add_canvas_preview_image.js')
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

