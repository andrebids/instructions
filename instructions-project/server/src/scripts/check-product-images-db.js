/**
 * Script para verificar as URLs de imagens dos produtos no banco de dados
 */

import sequelize from '../config/database.js';
import { Product } from '../models/index.js';

async function checkProductImages() {
  try {
    console.log('🔍 Conectando ao banco de dados...\n');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida\n');

    // Buscar todos os produtos
    const products = await Product.findAll({
      attributes: ['id', 'name', 'imagesDayUrl', 'imagesNightUrl', 'thumbnailUrl'],
      order: [['name', 'ASC']]
    });

    console.log(`📊 Total de produtos encontrados: ${products.length}\n`);
    console.log('='.repeat(100));

    // Agrupar por tipo de URL
    const productsWithImages = [];
    const productsWithoutImages = [];
    const productsWithTempImages = [];

    products.forEach(product => {
      const hasDay = !!product.imagesDayUrl;
      const hasNight = !!product.imagesNightUrl;
      const hasThumb = !!product.thumbnailUrl;
      const hasAny = hasDay || hasNight || hasThumb;

      const dayIsTemp = product.imagesDayUrl && (product.imagesDayUrl.includes('temp_') || product.imagesDayUrl.includes('thumb_temp_'));
      const nightIsTemp = product.imagesNightUrl && (product.imagesNightUrl.includes('temp_') || product.imagesNightUrl.includes('thumb_temp_'));
      const thumbIsTemp = product.thumbnailUrl && (product.thumbnailUrl.includes('temp_') || product.thumbnailUrl.includes('thumb_temp_'));
      const hasTemp = dayIsTemp || nightIsTemp || thumbIsTemp;

      const productInfo = {
        id: product.id,
        name: product.name,
        imagesDayUrl: product.imagesDayUrl,
        imagesNightUrl: product.imagesNightUrl,
        thumbnailUrl: product.thumbnailUrl,
        hasDay,
        hasNight,
        hasThumb,
        hasAny,
        hasTemp
      };

      if (!hasAny) {
        productsWithoutImages.push(productInfo);
      } else if (hasTemp) {
        productsWithTempImages.push(productInfo);
      } else {
        productsWithImages.push(productInfo);
      }
    });

    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Produtos com imagens reais: ${productsWithImages.length}`);
    console.log(`   - Produtos com imagens temporárias: ${productsWithTempImages.length}`);
    console.log(`   - Produtos sem imagens: ${productsWithoutImages.length}`);

    if (productsWithImages.length > 0) {
      console.log(`\n✅ Produtos com imagens reais (primeiros 10):`);
      productsWithImages.slice(0, 10).forEach((p, idx) => {
        console.log(`\n   ${idx + 1}. ${p.name} (${p.id})`);
        if (p.imagesDayUrl) console.log(`      Day: ${p.imagesDayUrl}`);
        if (p.imagesNightUrl) console.log(`      Night: ${p.imagesNightUrl}`);
        if (p.thumbnailUrl) console.log(`      Thumb: ${p.thumbnailUrl}`);
      });
    }

    if (productsWithTempImages.length > 0) {
      console.log(`\n⚠️  Produtos com imagens temporárias (primeiros 20):`);
      productsWithTempImages.slice(0, 20).forEach((p, idx) => {
        console.log(`\n   ${idx + 1}. ${p.name} (${p.id})`);
        if (p.imagesDayUrl) {
          const marker = p.imagesDayUrl.includes('temp_') ? '🔴' : '🟢';
          console.log(`      ${marker} Day: ${p.imagesDayUrl}`);
        }
        if (p.imagesNightUrl) {
          const marker = p.imagesNightUrl.includes('temp_') ? '🔴' : '🟢';
          console.log(`      ${marker} Night: ${p.imagesNightUrl}`);
        }
        if (p.thumbnailUrl) {
          const marker = p.thumbnailUrl.includes('temp_') ? '🔴' : '🟢';
          console.log(`      ${marker} Thumb: ${p.thumbnailUrl}`);
        }
      });
      if (productsWithTempImages.length > 20) {
        console.log(`\n   ... e mais ${productsWithTempImages.length - 20} produtos com imagens temporárias`);
      }
    }

    if (productsWithoutImages.length > 0) {
      console.log(`\n❌ Produtos sem imagens (primeiros 10):`);
      productsWithoutImages.slice(0, 10).forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.name} (${p.id})`);
      });
      if (productsWithoutImages.length > 10) {
        console.log(`   ... e mais ${productsWithoutImages.length - 10} produtos sem imagens`);
      }
    }

    // Verificar especificamente o produto mencionado pelo usuário
    const targetProduct = products.find(p => p.id === 'prd-8CXMAR13446625M33' || p.name === '8CXMAR13446625-M33');
    if (targetProduct) {
      console.log(`\n\n🎯 Produto específico mencionado:`);
      console.log(`   ID: ${targetProduct.id}`);
      console.log(`   Nome: ${targetProduct.name}`);
      console.log(`   Day URL: ${targetProduct.imagesDayUrl || '(não definida)'}`);
      console.log(`   Night URL: ${targetProduct.imagesNightUrl || '(não definida)'}`);
      console.log(`   Thumbnail URL: ${targetProduct.thumbnailUrl || '(não definida)'}`);
    } else {
      console.log(`\n\n⚠️  Produto prd-8CXMAR13446625M33 não encontrado no banco de dados`);
    }

    console.log('\n' + '='.repeat(100));
    console.log('✅ Verificação concluída');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

checkProductImages();

