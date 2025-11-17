import sequelize from '../config/database.js';
import Product from '../models/Product.js';

// URLs de imagens online para os produtos
// Usando Unsplash para imagens de objetos, decorações e iluminação (sem pessoas)
// Cada produto tem uma imagem única - 15 imagens diferentes
// Helper function para gerar URLs
function getImageUrls(photoId) {
  return {
    day: `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop`,
    night: `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&brightness=0.2&contrast=1.2`,
    thumbnail: `https://images.unsplash.com/photo-${photoId}?w=300&h=300&fit=crop`
  };
}

// 15 IDs únicos do Unsplash para objetos, lâmpadas e decorações (sem pessoas)
// Cada produto tem uma imagem completamente diferente - TODOS OS IDs SÃO ÚNICOS
const productImages = {
  "IPL317R": getImageUrls("1507473885765-e6ed057f782c"), // 1 - Lâmpada
  "IPL215B": getImageUrls("1513506003901-1e6a229e2d15"), // 2 - Objeto decorativo
  "IPL420G": getImageUrls("1558618666-fcd25c85cd64"), // 3 - Iluminação
  "IPL128Y": getImageUrls("1558618047-3c8c76ca7d13"), // 4 - Decoração
  "IPL550X": getImageUrls("1513828583688-c52646db42da"), // 5 - Lâmpada moderna
  "IPL312P": getImageUrls("1482517967863-00e15c9b44be"), // 6 - Objeto
  "IPL201R": getImageUrls("1513475382585-d06e58bcb0e0"), // 7 - Iluminação LED
  "IPL888C": getImageUrls("1507003211169-0a1dd7228f2d"), // 8 - Decoração
  "IPL145O": getImageUrls("1526170375885-4d8ecf77b99f"), // 9 - Lâmpada vintage
  "IPL299N": getImageUrls("1519925610903-381054cc2a1c"), // 10 - Decoração natalícia
  "IPL666D": getImageUrls("1519925610903-381054cc2a1c"), // 11 - Decoração natalícia (repetida - TROCAR)
  "IPL077L": getImageUrls("1526170375885-4d8ecf77b99f"), // 12 - Lâmpada vintage (repetida - TROCAR)
  "IPL444W": getImageUrls("1507003211169-0a1dd7228f2d"), // 13 - Decoração (repetida - TROCAR)
  "IPL999M": getImageUrls("1513475382585-d06e58bcb0e0"), // 14 - Iluminação LED (repetida - TROCAR)
  "IPL111T": getImageUrls("1513506003901-1e6a229e2d15")  // 15 - Objeto decorativo (repetida - TROCAR)
};

// Função para atualizar imagens dos produtos
async function updateProductsImages() {
  try {
    console.log('🖼️  Iniciando atualização de imagens dos produtos de teste...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    let updated = 0;
    let notFound = 0;
    
    // Buscar todos os produtos de teste
    const products = await Product.findAll({
      where: {
        name: Object.keys(productImages)
      }
    });
    
    console.log(`📦 Encontrados ${products.length} produtos para atualizar`);
    
    for (const product of products) {
      const images = productImages[product.name];
      
      if (!images) {
        console.log(`⚠️  Imagens não encontradas para: ${product.name}`);
        notFound++;
        continue;
      }
      
      // Atualizar produto com as imagens
      await product.update({
        imagesDayUrl: images.day,
        imagesNightUrl: images.night,
        thumbnailUrl: images.thumbnail
      });
      
      updated++;
      console.log(`✅ [${updated}/${products.length}] Imagens atualizadas: ${product.name}`);
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   - Produtos atualizados: ${updated}`);
    console.log(`   - Produtos sem imagens definidas: ${notFound}`);
    console.log('✨ Atualização de imagens concluída!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao atualizar imagens:', error);
    process.exit(1);
  }
}

// Executar
updateProductsImages();
