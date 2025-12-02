/**
 * Script para verificar o produto GX349L (prd-005) no banco de dados
 * e garantir que está visível para todos os usuários
 */

import sequelize from '../config/database.js';
import { Product } from '../models/index.js';

async function verifyGX349L() {
  try {
    console.log('🔍 Conectando ao banco de dados...\n');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida\n');

    // Buscar o produto específico
    const product = await Product.findByPk('prd-005');
    
    if (!product) {
      console.log('❌ Produto prd-005 (GX349L) não encontrado no banco de dados');
      console.log('⚠️  Precisa ser criado/inserido');
      await sequelize.close();
      return;
    }

    const plainProduct = product.get({ plain: true });
    
    console.log('📦 Produto encontrado:');
    console.log('='.repeat(100));
    console.log(`ID: ${plainProduct.id}`);
    console.log(`Nome: ${plainProduct.name}`);
    console.log(`Preço: ${plainProduct.price}`);
    console.log(`Stock: ${plainProduct.stock}`);
    console.log(`Ativo: ${plainProduct.isActive ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`Trending: ${plainProduct.isTrending ? '✅ SIM' : '❌ NÃO'}`);
    
    console.log(`\n📸 URLs de Imagens:`);
    console.log(`   imagesDayUrl: ${plainProduct.imagesDayUrl || '(null/vazio)'}`);
    console.log(`   imagesNightUrl: ${plainProduct.imagesNightUrl || '(null/vazio)'}`);
    console.log(`   thumbnailUrl: ${plainProduct.thumbnailUrl || '(null/vazio)'}`);
    console.log(`   animationUrl: ${plainProduct.animationUrl || '(null/vazio)'}`);
    
    console.log(`\n📋 Outros campos:`);
    console.log(`   availableColors: ${JSON.stringify(plainProduct.availableColors || null, null, 2)}`);
    console.log(`   tags: ${JSON.stringify(plainProduct.tags || [], null, 2)}`);
    console.log(`   type: ${plainProduct.type || '(null)'}`);
    console.log(`   isOnSale: ${plainProduct.isOnSale ? '✅ SIM' : '❌ NÃO'}`);
    
    // Verificar se o produto está visível (isActive = true)
    if (!plainProduct.isActive) {
      console.log(`\n⚠️  PROBLEMA: Produto está INATIVO (isActive = false)`);
      console.log(`   Isso pode fazer com que não apareça para alguns usuários`);
    }
    
    // Verificar se tem imagens válidas
    const hasDayImage = !!plainProduct.imagesDayUrl;
    const hasNightImage = !!plainProduct.imagesNightUrl;
    const hasThumbnail = !!plainProduct.thumbnailUrl;
    const hasAnyImage = hasDayImage || hasNightImage || hasThumbnail;
    
    console.log(`\n🔍 Análise de Imagens:`);
    console.log(`   Tem imagem day: ${hasDayImage ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Tem imagem night: ${hasNightImage ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Tem thumbnail: ${hasThumbnail ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Tem alguma imagem: ${hasAnyImage ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasAnyImage) {
      console.log(`\n⚠️  PROBLEMA: Produto não tem nenhuma imagem definida`);
      console.log(`   Isso pode fazer com que não apareça corretamente no frontend`);
    }
    
    // Verificar se as URLs são válidas (começam com /)
    if (plainProduct.imagesDayUrl && !plainProduct.imagesDayUrl.startsWith('/')) {
      console.log(`\n⚠️  PROBLEMA: imagesDayUrl não começa com /: ${plainProduct.imagesDayUrl}`);
    }
    if (plainProduct.imagesNightUrl && !plainProduct.imagesNightUrl.startsWith('/')) {
      console.log(`\n⚠️  PROBLEMA: imagesNightUrl não começa com /: ${plainProduct.imagesNightUrl}`);
    }
    if (plainProduct.thumbnailUrl && !plainProduct.thumbnailUrl.startsWith('/')) {
      console.log(`\n⚠️  PROBLEMA: thumbnailUrl não começa com /: ${plainProduct.thumbnailUrl}`);
    }
    
    // Verificar se o produto aparece na query getAll (sem filtros)
    console.log(`\n🔍 Verificando visibilidade na API:`);
    const allProducts = await Product.findAll({
      where: {
        isActive: true
      },
      order: [['name', 'ASC']]
    });
    
    const foundInList = allProducts.find(p => p.id === 'prd-005');
    if (foundInList) {
      console.log(`   ✅ Produto aparece na lista de produtos ativos`);
      console.log(`   Total de produtos ativos: ${allProducts.length}`);
    } else {
      console.log(`   ❌ Produto NÃO aparece na lista de produtos ativos`);
      console.log(`   Isso significa que isActive = false ou há outro problema`);
    }
    
    // Verificar se há outros produtos com o mesmo nome
    const productsWithSameName = await Product.findAll({
      where: {
        name: 'GX349L'
      }
    });
    
    if (productsWithSameName.length > 1) {
      console.log(`\n⚠️  AVISO: Existem ${productsWithSameName.length} produtos com o nome "GX349L"`);
      productsWithSameName.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ID: ${p.id}, Ativo: ${p.isActive}`);
      });
    }
    
    console.log('\n' + '='.repeat(100));
    console.log('✅ Verificação concluída');
    
    // Resumo final
    console.log('\n📊 RESUMO:');
    const issues = [];
    if (!plainProduct.isActive) {
      issues.push('❌ Produto está INATIVO');
    }
    if (!hasAnyImage) {
      issues.push('❌ Produto não tem imagens');
    }
    if (!foundInList) {
      issues.push('❌ Produto não aparece na lista de ativos');
    }
    
    if (issues.length === 0) {
      console.log('✅ Produto está configurado corretamente e deve aparecer para todos os usuários');
    } else {
      console.log('⚠️  Problemas encontrados:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

verifyGX349L();

