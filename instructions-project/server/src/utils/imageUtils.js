import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Gera thumbnail a partir de uma imagem
 * @param {string} imagePath - Caminho da imagem original
 * @param {string} outputPath - Caminho onde salvar o thumbnail
 * @param {number} width - Largura do thumbnail (padrão: 300)
 * @param {number} height - Altura do thumbnail (padrão: 300)
 * @returns {Promise<string>} - Caminho do thumbnail gerado
 */
export async function generateThumbnail(imagePath, outputPath, width = 300, height = 300) {
  try {
    // Criar diretório se não existir
    var dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Gerar thumbnail
    await sharp(imagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error);
    throw error;
  }
}

