/**
 * Migration para converter imagens preview de base64 para ficheiros físicos
 * Execute com: node src/migrations/20251128_convert_canvas_preview_to_files.js
 */

import sequelize from '../config/database.js';
import { Project } from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function migrate() {
  return convertCanvasPreviewImages();
}

async function convertCanvasPreviewImages() {
  try {
    console.log('🔄 Iniciando conversão de imagens preview de base64 para ficheiros...');
    
    // Buscar todos os projetos com canvasPreviewImage em base64
    const projects = await Project.findAll({
      where: {
        canvasPreviewImage: {
          [sequelize.Sequelize.Op.not]: null
        }
      }
    });

    console.log(`📋 Encontrados ${projects.length} projetos com canvasPreviewImage`);

    let converted = 0;
    let skipped = 0;
    let errors = 0;

    for (const project of projects) {
      const previewImage = project.canvasPreviewImage;

      // Verificar se já é uma URL (já convertido)
      if (previewImage && !previewImage.startsWith('data:image/')) {
        console.log(`⏭️  Projeto ${project.id}: Já é URL, pulando...`);
        skipped++;
        continue;
      }

      // Verificar se é base64
      if (!previewImage || !previewImage.startsWith('data:image/')) {
        console.log(`⚠️  Projeto ${project.id}: Formato inválido, pulando...`);
        skipped++;
        continue;
      }

      try {
        // Extrair base64
        const base64Match = previewImage.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
        if (!base64Match) {
          console.log(`⚠️  Projeto ${project.id}: Formato base64 não suportado`);
          skipped++;
          continue;
        }

        const base64Data = base64Match[2];

        // Criar diretório
        const previewDir = path.resolve(process.cwd(), `public/uploads/projects/${project.id}/preview`);
        if (!fs.existsSync(previewDir)) {
          fs.mkdirSync(previewDir, { recursive: true });
          console.log(`📁 Diretório criado: ${previewDir}`);
        }

        // Nome do ficheiro
        const timestamp = Date.now();
        const filename = `canvas-preview-${timestamp}.png`;
        const filePath = path.join(previewDir, filename);

        // Converter e guardar
        const imageBuffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, imageBuffer);

        // URL relativa
        const imageUrl = `/uploads/projects/${project.id}/preview/${filename}`;

        // Atualizar na base de dados
        await project.update({ canvasPreviewImage: imageUrl });

        console.log(`✅ Projeto ${project.id}: Convertido para ${imageUrl}`);
        converted++;
      } catch (error) {
        console.error(`❌ Erro ao converter projeto ${project.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n🎉 Conversão concluída!');
    console.log(`   ✅ Convertidos: ${converted}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   ❌ Erros: ${errors}`);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente (não quando importado)
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('20251128_convert_canvas_preview_to_files.js')
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

