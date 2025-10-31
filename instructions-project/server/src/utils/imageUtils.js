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

/**
 * Converte uma imagem para WebP, mantendo qualidade e otimizando tamanho
 * @param {string} imagePath - Caminho da imagem original
 * @param {string} outputPath - Caminho onde salvar a imagem WebP (opcional, se não fornecido substitui o original)
 * @param {number} quality - Qualidade da imagem WebP (padrão: 85)
 * @returns {Promise<string>} - Caminho da imagem WebP gerada
 */
export async function convertToWebP(imagePath, outputPath, quality = 85) {
  try {
    // Se não fornecer outputPath, substituir o original
    if (!outputPath) {
      var ext = path.extname(imagePath);
      outputPath = imagePath.replace(ext, '.webp');
    }
    
    // Criar diretório se não existir
    var dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Converter para WebP usando sharp
    await sharp(imagePath)
      .webp({ quality: quality })
      .toFile(outputPath);
    
    console.log('✅ Imagem convertida para WebP:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('Erro ao converter imagem para WebP:', error);
    throw error;
  }
}

/**
 * Processa uma imagem: converte para WebP e retorna o caminho
 * Se já for WebP, apenas retorna o caminho original
 * @param {string} imagePath - Caminho da imagem original
 * @param {string} originalFilename - Nome original do arquivo
 * @returns {Promise<string>} - Caminho da imagem processada (WebP)
 */
export async function processImageToWebP(imagePath, originalFilename) {
  try {
    var ext = path.extname(originalFilename).toLowerCase();
    
    console.log('🔄 [processImageToWebP] Iniciando processamento:', {
      imagePath: imagePath,
      originalFilename: originalFilename,
      extension: ext,
      fileExists: fs.existsSync(imagePath)
    });
    
    // Se já for WebP, não precisa converter
    if (ext === '.webp') {
      console.log('✅ [processImageToWebP] Arquivo já é WebP, retornando original');
      return imagePath;
    }
    
    // Verificar se o arquivo original existe
    if (!fs.existsSync(imagePath)) {
      throw new Error('Arquivo original não encontrado: ' + imagePath);
    }
    
    // Converter para WebP
    var webpPath = imagePath.replace(/\.[^/.]+$/, '.webp');
    console.log('🔄 [processImageToWebP] Convertendo para WebP:', {
      from: imagePath,
      to: webpPath
    });
    
    await convertToWebP(imagePath, webpPath, 85);
    
    // Verificar se o WebP foi criado com sucesso antes de remover o original
    if (fs.existsSync(webpPath)) {
      console.log('✅ [processImageToWebP] Arquivo WebP criado com sucesso:', webpPath);
      // Remover arquivo original se não for WebP
      if (fs.existsSync(imagePath) && ext !== '.webp') {
        try {
          fs.unlinkSync(imagePath);
          console.log('✅ [processImageToWebP] Arquivo original removido:', imagePath);
        } catch (unlinkError) {
          console.warn('⚠️  [processImageToWebP] Erro ao remover arquivo original:', unlinkError.message);
        }
      }
      return webpPath;
    } else {
      throw new Error('Falha ao criar arquivo WebP: ' + webpPath);
    }
  } catch (error) {
    console.error('❌ [processImageToWebP] Erro ao processar imagem para WebP:', error);
    console.error('❌ [processImageToWebP] Stack:', error.stack);
    // Em caso de erro, retornar o caminho original se existir
    if (fs.existsSync(imagePath)) {
      console.log('📸 [processImageToWebP] Retornando arquivo original devido a erro');
      return imagePath;
    }
    throw error;
  }
}
