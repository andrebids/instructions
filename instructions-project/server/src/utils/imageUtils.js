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
    
    // Gerar thumbnail em WebP
    await sharp(imagePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .ensureAlpha() // Garante transparência se existir
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Erro ao gerar thumbnail:', error);
    throw error;
  }
}

/**
 * Remove fundo de imagens PNG (inferindo pixels de fundo baseado em thresholds)
 * @param {string} imagePath - Caminho da imagem original
 * @param {string} outputPath - Caminho onde salvar a imagem sem fundo
 * @param {number} threshold - Threshold para detecção de fundo (padrão: 80)
 * @returns {Promise<string>} - Caminho da imagem processada
 */
export async function removeBackground(imagePath, outputPath, threshold = 80) {
  try {
    console.log('🔄 [removeBackground] Removendo fundo da imagem:', imagePath);
    
    // Carregar imagem e dados de pixels
    const image = sharp(imagePath);
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Processar pixels para remover fundo
    // Se o pixel for muito escuro (fundos pretos/cinza escuro), tornar transparente
    const pixels = new Uint8ClampedArray(data);
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calcular brilho
      const brightness = (r + g + b) / 3;
      
      // Se for um pixel escuro (como fundo preto), tornar transparente
      if (brightness < threshold) {
        pixels[i + 3] = 0; // alpha = 0 (transparente)
      }
    }
    
    // Salvar resultado
    await sharp(pixels, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
      .png()
      .toFile(outputPath);
    
    console.log('✅ [removeBackground] Fundo removido com sucesso:', outputPath);
    return outputPath;
  } catch (error) {
    console.error('❌ [removeBackground] Erro ao remover fundo:', error);
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
    const start = Date.now();
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
    const statBefore = fs.existsSync(imagePath) ? fs.statSync(imagePath) : null;
    await sharp(imagePath)
      .ensureAlpha() // Garante canal alpha para transparência
      .webp({ quality: quality })
      .toFile(outputPath);
    const statAfter = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
    console.log('✅ Imagem convertida para WebP:', {
      outputPath,
      ms: Date.now() - start,
      inputBytes: statBefore?.size,
      outputBytes: statAfter?.size,
    });
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
    
    const t0 = Date.now();
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
    
    // Se for PNG, remover fundo primeiro
    var imageToProcess = imagePath;
    if (ext === '.png') {
      try {
        var noBgPath = imagePath.replace(/\.png$/, '_no-bg.png');
        console.log('🔄 [processImageToWebP] Removendo fundo da imagem PNG:', {
          from: imagePath,
          to: noBgPath
        });
        await removeBackground(imagePath, noBgPath);
        imageToProcess = noBgPath;
      } catch (bgError) {
        console.warn('⚠️  [processImageToWebP] Erro ao remover fundo:', bgError.message);
        // Continuar com a imagem original se falhar
      }
    }
    
    // Converter para WebP
    var webpPath = imagePath.replace(/\.[^/.]+$/, '.webp');
    console.log('🔄 [processImageToWebP] Convertendo para WebP:', {
      from: imageToProcess,
      to: webpPath
    });
    
    await convertToWebP(imageToProcess, webpPath, 85);
    
    // Limpar arquivo temporário sem fundo se foi criado
    if (imageToProcess !== imagePath && fs.existsSync(imageToProcess)) {
      try {
        fs.unlinkSync(imageToProcess);
        console.log('✅ [processImageToWebP] Arquivo temporário removido:', imageToProcess);
      } catch (cleanError) {
        console.warn('⚠️  [processImageToWebP] Erro ao remover arquivo temporário:', cleanError.message);
      }
    }
    
    // Verificar se o WebP foi criado com sucesso antes de remover o original
    if (fs.existsSync(webpPath)) {
      const stat = fs.statSync(webpPath);
      console.log('✅ [processImageToWebP] Arquivo WebP criado com sucesso:', { webpPath, bytes: stat.size, ms: Date.now() - t0 });
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
