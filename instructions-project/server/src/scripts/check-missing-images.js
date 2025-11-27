/**
 * Script para verificar imagens faltantes no servidor
 * Verifica se as imagens referenciadas no banco de dados existem fisicamente
 */

import sequelize from '../config/database.js';
import { Product } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para verificar se uma imagem existe no servidor
function checkImageExists(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return { exists: false, reason: 'URL vazia ou inválida' };
  }

  // Normalizar o caminho
  const normalizedPath = imageUrl.replace(/^\//, '');
  const fullPath = path.resolve(process.cwd(), 'public', normalizedPath);

  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      path: fullPath,
      size: stats.size,
      modified: stats.mtime
    };
  } else {
    return {
      exists: false,
      path: fullPath,
      reason: 'Arquivo não encontrado'
    };
  }
}

// Função principal
async function checkMissingImages() {
  try {
    console.log('🔍 [CHECK IMAGES] Iniciando verificação de imagens...\n');

    // Buscar todos os produtos
    const products = await Product.findAll({
      attributes: ['id', 'name', 'imagesNightUrl', 'imagesDayUrl', 'thumbnailUrl', 'isActive']
    });

    console.log(`📦 [CHECK IMAGES] Total de produtos encontrados: ${products.length}\n`);

    const missingImages = [];
    const tempImages = [];
    const validImages = [];

    for (const product of products) {
      const productData = product.get({ plain: true });
      const checks = {
        id: productData.id,
        name: productData.name,
        isActive: productData.isActive,
        imagesNightUrl: null,
        imagesDayUrl: null,
        thumbnailUrl: null
      };

      // Verificar imagem noturna
      if (productData.imagesNightUrl) {
        // Verificar se é uma imagem temporária
        if (productData.imagesNightUrl.includes('temp_') || productData.imagesNightUrl.includes('temp_nightImage_')) {
          tempImages.push({
            product: productData.id,
            name: productData.name,
            url: productData.imagesNightUrl,
            type: 'night'
          });
        }

        const nightCheck = checkImageExists(productData.imagesNightUrl);
        checks.imagesNightUrl = nightCheck;
        
        if (!nightCheck.exists) {
          missingImages.push({
            product: productData.id,
            name: productData.name,
            url: productData.imagesNightUrl,
            type: 'night',
            reason: nightCheck.reason
          });
        } else {
          validImages.push({
            product: productData.id,
            url: productData.imagesNightUrl,
            type: 'night'
          });
        }
      }

      // Verificar imagem diurna
      if (productData.imagesDayUrl) {
        if (productData.imagesDayUrl.includes('temp_') || productData.imagesDayUrl.includes('temp_nightImage_')) {
          tempImages.push({
            product: productData.id,
            name: productData.name,
            url: productData.imagesDayUrl,
            type: 'day'
          });
        }

        const dayCheck = checkImageExists(productData.imagesDayUrl);
        checks.imagesDayUrl = dayCheck;
        
        if (!dayCheck.exists) {
          missingImages.push({
            product: productData.id,
            name: productData.name,
            url: productData.imagesDayUrl,
            type: 'day',
            reason: dayCheck.reason
          });
        } else {
          validImages.push({
            product: productData.id,
            url: productData.imagesDayUrl,
            type: 'day'
          });
        }
      }

      // Verificar thumbnail
      if (productData.thumbnailUrl) {
        if (productData.thumbnailUrl.includes('temp_') || productData.thumbnailUrl.includes('temp_nightImage_')) {
          tempImages.push({
            product: productData.id,
            name: productData.name,
            url: productData.thumbnailUrl,
            type: 'thumbnail'
          });
        }

        const thumbCheck = checkImageExists(productData.thumbnailUrl);
        checks.thumbnailUrl = thumbCheck;
        
        if (!thumbCheck.exists) {
          missingImages.push({
            product: productData.id,
            name: productData.name,
            url: productData.thumbnailUrl,
            type: 'thumbnail',
            reason: thumbCheck.reason
          });
        } else {
          validImages.push({
            product: productData.id,
            url: productData.thumbnailUrl,
            type: 'thumbnail'
          });
        }
      }
    }

    // Relatório
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO DE VERIFICAÇÃO DE IMAGENS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`✅ Imagens válidas: ${validImages.length}`);
    console.log(`❌ Imagens faltantes: ${missingImages.length}`);
    console.log(`⚠️  URLs temporárias encontradas: ${tempImages.length}\n`);

    // Detalhes das imagens temporárias
    if (tempImages.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠️  IMAGENS TEMPORÁRIAS (temp_nightImage_ ou temp_)');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      for (const temp of tempImages) {
        console.log(`📦 Produto: ${temp.product} (${temp.name})`);
        console.log(`   Tipo: ${temp.type}`);
        console.log(`   URL: ${temp.url}`);
        console.log('');
      }
    }

    // Detalhes das imagens faltantes
    if (missingImages.length > 0) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ IMAGENS FALTANTES');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      for (const missing of missingImages) {
        console.log(`📦 Produto: ${missing.product} (${missing.name})`);
        console.log(`   Tipo: ${missing.type}`);
        console.log(`   URL: ${missing.url}`);
        console.log(`   Motivo: ${missing.reason}`);
        const checkResult = checkImageExists(missing.url);
        if (checkResult.path) {
          console.log(`   Caminho esperado: ${checkResult.path}`);
        }
        console.log('');
      }
    }

    // Verificar especificamente as imagens mencionadas no erro
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 VERIFICAÇÃO ESPECÍFICA DAS IMAGENS DO ERRO');
    console.log('═══════════════════════════════════════════════════════════\n');

    const specificImages = [
      '/uploads/products/temp_nightImage_1763740340217.webp',
      '/uploads/products/temp_nightImage_1763740378325.webp'
    ];

    for (const imageUrl of specificImages) {
      console.log(`🔍 Verificando: ${imageUrl}`);
      const check = checkImageExists(imageUrl);
      if (check.exists) {
        console.log(`   ✅ Existe! Tamanho: ${check.size} bytes, Modificado: ${check.modified}`);
      } else {
        console.log(`   ❌ Não existe! Caminho esperado: ${check.path}`);
      }
      console.log('');

      // Buscar produtos que referenciam esta imagem
      const productsWithThisImage = await Product.findAll({
        where: {
          [Op.or]: [
            { imagesNightUrl: imageUrl },
            { imagesDayUrl: imageUrl },
            { thumbnailUrl: imageUrl }
          ]
        },
        attributes: ['id', 'name', 'imagesNightUrl', 'imagesDayUrl', 'thumbnailUrl', 'isActive']
      });

      if (productsWithThisImage.length > 0) {
        console.log(`   📦 Produtos que referenciam esta imagem (${productsWithThisImage.length}):`);
        for (const prod of productsWithThisImage) {
          const p = prod.get({ plain: true });
          console.log(`      - ${p.id} (${p.name})`);
          if (p.imagesNightUrl === imageUrl) console.log(`        → imagesNightUrl`);
          if (p.imagesDayUrl === imageUrl) console.log(`        → imagesDayUrl`);
          if (p.thumbnailUrl === imageUrl) console.log(`        → thumbnailUrl`);
          console.log(`        → isActive: ${p.isActive}`);
        }
      } else {
        console.log(`   ℹ️  Nenhum produto encontrado referenciando esta imagem`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Verificação concluída!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Fechar conexão
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ [CHECK IMAGES] Erro:', error);
    console.error('❌ [CHECK IMAGES] Stack:', error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

// Executar
checkMissingImages();

