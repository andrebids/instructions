import sequelize from '../config/database.js';
import { Product } from '../models/index.js';
import { resolveImagePath } from '../utils/imagePathResolver.js';

// Função helper para processar imagens mock
function processImages(images) {
  if (!images) return { day: null, night: null, colors: {} };
  
  var dayUrl = images.day || null;
  var nightUrl = images.night || null;
  var colors = images.colors || {};
  
  // Validar e corrigir caminhos de imagens usando utilitário profissional
  if (dayUrl) {
    const validatedDay = resolveImagePath(dayUrl);
    if (!validatedDay) {
      console.warn(`⚠️ [INSERT] Imagem diurna não encontrada: ${dayUrl}`);
      dayUrl = null; // Definir como null se validação falhar
    } else {
      dayUrl = validatedDay;
    }
  }
  
  if (nightUrl) {
    const validatedNight = resolveImagePath(nightUrl);
    if (!validatedNight) {
      console.warn(`⚠️ [INSERT] Imagem noturna não encontrada: ${nightUrl}`);
      nightUrl = null; // Definir como null se validação falhar
    } else {
      nightUrl = validatedNight;
    }
  }
  
  // Converter cores para objeto simples com URLs
  var availableColors = {};
  for (var colorKey in colors) {
    if (colors.hasOwnProperty(colorKey)) {
      availableColors[colorKey] = colors[colorKey];
    }
  }
  
  return {
    dayUrl: dayUrl,
    nightUrl: nightUrl,
    colors: availableColors,
  };
}

// Transformar produtos mock para formato do modelo Product
function transformProduct(mockProduct) {
  var imagesProcessed = processImages(mockProduct.images);
  var tags = mockProduct.tags || [];
  var hasTrendingTag = tags.indexOf('trending') >= 0;
  var hasXmasTag = tags.indexOf('christmas') >= 0 || tags.indexOf('xmas') >= 0;
  var hasSummerTag = tags.indexOf('summer') >= 0;
  
  // Determinar season baseado nas tags
  var season = null;
  if (hasXmasTag) {
    season = 'xmas';
  } else if (hasSummerTag) {
    season = 'summer';
  }
  
  // Calcular isOnSale baseado em oldPrice
  var isOnSale = false;
  if (mockProduct.oldPrice && mockProduct.oldPrice > (mockProduct.price || 0)) {
    isOnSale = true;
  }
  
  return {
    id: mockProduct.id,
    name: mockProduct.name,
    price: mockProduct.price || 0,
    stock: mockProduct.stock || 0,
    oldPrice: mockProduct.oldPrice || null,
    imagesDayUrl: imagesProcessed.dayUrl,
    imagesNightUrl: imagesProcessed.nightUrl,
    animationUrl: mockProduct.videoFile ? '/SHOP/TRENDING/VIDEO/' + mockProduct.videoFile : null,
    thumbnailUrl: imagesProcessed.dayUrl, // Usar imagem de dia como thumbnail por padrão
    tags: tags,
    type: mockProduct.type || null,
    usage: mockProduct.usage || null,
    location: mockProduct.location || null,
    mount: mockProduct.mount || null,
    specs: mockProduct.specs || null,
    availableColors: Object.keys(imagesProcessed.colors).length > 0 ? imagesProcessed.colors : null,
    variantProductByColor: mockProduct.variantProductByColor || null,
    videoFile: mockProduct.videoFile || null,
    isActive: true,
    season: season, // 'xmas' ou 'summer' ou null
    isTrending: hasTrendingTag,
    releaseYear: mockProduct.releaseYear || null, // Ano de lançamento para produtos NEW (preencher manualmente)
    isOnSale: isOnSale, // Calculado baseado em oldPrice > price
  };
}

// Produtos trending da página TRENDING
var trendingProducts = [
  {
    id: "prd-001",
    name: "IPL317R",
    price: 1299,
    stock: 32,
    videoFile: "IPL317R.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/IPL317R_DAY.webp",
      night: "/SHOP/TRENDING/NIGHT/IPL317R_NIGHT.webp",
      colors: {
        brancoPuro: "/demo-images/decorations/star_white.jpg",
        vermelho: "#ef4444",
      },
    },
    tags: ["trending", "christmas"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    specs: {
      descricao: "Decorative banner-style light for pole mounting. Fictitious data for demo.",
      tecnicas: "230V AC, IP65, 48W",
      dimensoes: "2.80 m x 0.80 m",
      dimensions: { widthM: 0.80, heightM: 2.80 },
      weight: "11 kg",
      effects: "SLOWFLASH & SOFT XLED (Pure White and Red)",
      materiais: "LED modules, aluminum, white and red bioprint",
      stockPolicy: "Made to order (lead time 2–4 weeks)",
    },
  },
  {
    id: "prd-005b",
    name: "GX350LW",
    price: 899,
    stock: 18,
    videoFile: "GX350LW.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/GX350LW.webp",
      night: "/SHOP/TRENDING/NIGHT/GX350LW_NIGHT.webp",
      colors: {
        brancoPuro: "/demo-images/decorations/star_white.jpg",
        brancoQuente: "/demo-images/decorations/star_warm.jpg",
      },
    },
    tags: ["trending"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
    specs: {
      descricao: "SCENETTE JOSÉ",
      tecnicas: "IP65, 230V AC, 85W",
      dimensoes: "2.4 m (H) x 2.0 m (W) x 0.5 m (D)",
      dimensions: { widthM: 2.0, heightM: 2.4, depthM: 0.5 },
      weight: "36 kg",
      effects: "Warm white & Pure white XLED (257)",
      materiais: "Warm‑white and pure‑white LEDs, aluminum",
    },
  },
  {
    id: "prd-005",
    name: "GX349L",
    price: 899,
    stock: 21,
    videoFile: "GX349L.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/GX349L_DAY.webp",
      night: "/SHOP/TRENDING/NIGHT/GX349L_NIGHT.webp",
      colors: {
        brancoPuro: "/demo-images/decorations/star_white.jpg",
        brancoQuente: "/demo-images/decorations/star_warm.jpg",
      },
    },
    tags: ["trending", "sale"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
    specs: {
      descricao: "Luminous 3D bear-shaped sculpture with illuminated decorative swirl.",
      tecnicas: "IP65, 230V AC, 60W, high‑efficiency LEDs",
      dimensoes: "2.60 m (W) x 1.50 m (H) x 1.10 m (D)",
      dimensions: { widthM: 2.60, heightM: 1.50, depthM: 1.10 },
      materiais: "White bioprint, gold bioprint, Fil Lumière, pure white LEDs with flash",
      weight: "65 kg",
      effects: "Pure white with warm‑white accent (day/night modes)",
    },
  },
  {
    id: "prd-005a",
    name: "IPL337W",
    price: 1299,
    stock: 28,
    videoFile: "IPL337W.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/IPL337W.webp",
      night: "/SHOP/TRENDING/NIGHT/IPL337W.webp", // Ficheiro real no servidor: IPL337W.webp
      colors: { brancoQuente: "/demo-images/decorations/star_warm.jpg" },
    },
    tags: ["trending"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    variantProductByColor: { brancoPuro: "prd-006", brancoQuente: "prd-005a" },
    specs: {
      descricao: "GATSBY BANNER",
      tecnicas: "230V AC, IP65, 50W",
      dimensoes: "2.80 m x 0.80 m",
      dimensions: { widthM: 0.80, heightM: 2.80 },
      weight: "8 kg",
      effects: "SLOWFLASH & SOFT XLED",
      materiais: "Warm‑white LEDs with flash, gold bioprint, aluminum, Comet wire",
      stockPolicy: "Made to order (lead time 2–4 weeks)",
    },
  },
  {
    id: "prd-006",
    name: "IPL337",
    price: 1299,
    stock: 31,
    videoFile: "IPL337.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/IPL337.webp",
      night: "/SHOP/TRENDING/NIGHT/IPL337.webp", // Ficheiro real no servidor: IPL337.webp
      colors: { brancoPuro: "/demo-images/decorations/star_white.jpg" },
    },
    tags: ["trending", "summer"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
    variantProductByColor: { brancoPuro: "prd-006", brancoQuente: "prd-005a" },
    specs: {
      descricao: "GATSBY BANNER",
      tecnicas: "230V AC, IP65, 50W",
      dimensoes: "2.80 m x 0.80 m",
      dimensions: { widthM: 0.80, heightM: 2.80 },
      weight: "8 kg",
      effects: "SLOWFLASH & SOFT XLED",
      materiais: "Pure‑white LEDs with flash, white bioprint, aluminum, Comet wire",
      stockPolicy: "Made to order (lead time 2–4 weeks)",
    },
  },
];

// Função para inserir produtos trending na base de dados
async function insertTrendingProducts() {
  try {
    console.log('🌱 Iniciando inserção de produtos trending...');

    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');

    // Transformar produtos mock para formato do modelo
    var productsData = [];
    for (var i = 0; i < trendingProducts.length; i++) {
      productsData.push(transformProduct(trendingProducts[i]));
    }

    // Verificar e inserir cada produto
    var inserted = 0;
    var updated = 0;
    var skipped = 0;

    for (var j = 0; j < productsData.length; j++) {
      var productData = productsData[j];
      
      // Validar que a imagem night existe antes de inserir
      const validatedNightUrl = productData.imagesNightUrl ? resolveImagePath(productData.imagesNightUrl) : null;
      
      if (!validatedNightUrl) {
        console.warn('⚠️ [INSERT] Produto ignorado - sem imagem night válida: ' + productData.name + ' (ID: ' + productData.id + ')');
        console.warn('   Caminho esperado: ' + productData.imagesNightUrl);
        skipped++;
        continue;
      }
      
      // Atualizar com o caminho validado
      productData.imagesNightUrl = validatedNightUrl;
      
      // Validar e atualizar day e thumbnail também
      if (productData.imagesDayUrl) {
        const validatedDayUrl = resolveImagePath(productData.imagesDayUrl);
        if (validatedDayUrl) {
          productData.imagesDayUrl = validatedDayUrl;
        } else {
          // Se validação falhar, definir como null em vez de manter caminho não validado
          productData.imagesDayUrl = null;
        }
      }
      
      if (productData.thumbnailUrl) {
        const validatedThumbUrl = resolveImagePath(productData.thumbnailUrl);
        if (validatedThumbUrl) {
          productData.thumbnailUrl = validatedThumbUrl;
        } else {
          // Se validação falhar, definir como null em vez de manter caminho não validado
          productData.thumbnailUrl = null;
        }
      }
      
      // Definir thumbnail apenas se não existe e há uma imagem válida disponível
      if (!productData.thumbnailUrl) {
        if (productData.imagesDayUrl) {
          // Se não há thumbnail mas há day image válida, usar day como thumbnail
          productData.thumbnailUrl = productData.imagesDayUrl;
        } else {
          // Se não há day, usar night como thumbnail (já validado acima)
          productData.thumbnailUrl = validatedNightUrl;
        }
      }
      
      // Verificar se o produto já existe
      var existingProduct = await Product.findByPk(productData.id);
      
      if (existingProduct) {
        // Atualizar produto existente
        await existingProduct.update(productData);
        updated++;
        console.log('🔄 Produto atualizado: ' + productData.name + ' (ID: ' + productData.id + ')');
        console.log('   ✅ Imagem night: ' + validatedNightUrl);
      } else {
        // Criar novo produto
        await Product.create(productData);
        inserted++;
        console.log('✅ Produto criado: ' + productData.name + ' (ID: ' + productData.id + ')');
        console.log('   ✅ Imagem night: ' + validatedNightUrl);
      }
    }

    console.log('\n📊 Resumo da inserção:');
    console.log('   - Produtos criados: ' + inserted);
    console.log('   - Produtos atualizados: ' + updated);
    console.log('   - Produtos ignorados (sem imagem night): ' + skipped);
    console.log('   - Total processado: ' + (inserted + updated));
    console.log('🎉 Inserção de produtos trending concluída com sucesso!');
    
    // Verificar produtos trending na base de dados
    var allTrending = await Product.findAll({ 
      where: { isTrending: true } 
    });
    console.log('\n📋 Total de produtos trending na BD: ' + allTrending.length);
    
  } catch (error) {
    console.error('❌ Erro ao inserir produtos trending:', error);
    throw error;
  }
}

// Executar script se chamado diretamente
if (process.argv[1] && process.argv[1].indexOf('insert-trending-products.js') >= 0) {
  insertTrendingProducts()
    .then(function() {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch(function(error) {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

export default insertTrendingProducts;

