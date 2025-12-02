/**
 * Script para verificar o produto prd-005 (GX349L) no banco de dados
 */

import sequelize from '../config/database.js';
import { Product } from '../models/index.js';

async function checkProduct() {
  try {
    console.log('🔍 Conectando ao banco de dados...\n');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida\n');

    // Buscar o produto específico
    const product = await Product.findByPk('prd-005');
    
    if (!product) {
      console.log('❌ Produto prd-005 não encontrado no banco de dados');
      await sequelize.close();
      return;
    }

    const plainProduct = product.get({ plain: true });
    
    console.log('📦 Produto encontrado:');
    console.log('='.repeat(100));
    console.log(`ID: ${plainProduct.id}`);
    console.log(`Nome: ${plainProduct.name}`);
    console.log(`\n📸 URLs de Imagens:`);
    console.log(`   imagesDayUrl: ${plainProduct.imagesDayUrl || '(null/vazio)'}`);
    console.log(`   imagesNightUrl: ${plainProduct.imagesNightUrl || '(null/vazio)'}`);
    console.log(`   thumbnailUrl: ${plainProduct.thumbnailUrl || '(null/vazio)'}`);
    console.log(`   animationUrl: ${plainProduct.animationUrl || '(null/vazio)'}`);
    console.log(`   animationSimulationUrl: ${plainProduct.animationSimulationUrl || '(null/vazio)'}`);
    
    console.log(`\n📋 Outros campos relacionados:`);
    console.log(`   availableColors: ${JSON.stringify(plainProduct.availableColors || null, null, 2)}`);
    
    // Verificar o que o frontend considera como "hasImages"
    const hasImages = !!plainProduct.imagesDayUrl || 
                      !!plainProduct.imagesNightUrl || 
                      !!plainProduct.thumbnailUrl ||
                      (plainProduct.availableColors && Object.keys(plainProduct.availableColors).length > 0);
    
    console.log(`\n🔍 Análise:`);
    console.log(`   hasImagesDayUrl: ${!!plainProduct.imagesDayUrl}`);
    console.log(`   hasImagesNightUrl: ${!!plainProduct.imagesNightUrl}`);
    console.log(`   hasThumbnailUrl: ${!!plainProduct.thumbnailUrl}`);
    console.log(`   hasAvailableColors: ${!!(plainProduct.availableColors && Object.keys(plainProduct.availableColors).length > 0)}`);
    console.log(`   hasImages (calculado): ${hasImages}`);
    
    // Verificar se há imagens na pasta que correspondem a este produto
    console.log(`\n🔍 Verificando arquivos na pasta de produtos...`);
    const fs = await import('fs');
    const path = await import('path');
    const { getProductsUploadDir } = await import('../utils/pathUtils.js');
    
    const productsDir = getProductsUploadDir();
    if (fs.existsSync(productsDir)) {
      const files = fs.readdirSync(productsDir);
      const productFiles = files.filter(f => 
        f.toLowerCase().includes('gx349l') || 
        f.toLowerCase().includes('prd-005') ||
        f.toLowerCase().includes('005')
      );
      
      console.log(`   Arquivos relacionados encontrados: ${productFiles.length}`);
      if (productFiles.length > 0) {
        productFiles.forEach(file => {
          console.log(`     - ${file}`);
        });
      } else {
        console.log(`   ⚠️  Nenhum arquivo encontrado com nome relacionado ao produto`);
      }
    } else {
      console.log(`   ❌ Pasta de produtos não existe: ${productsDir}`);
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

checkProduct();

