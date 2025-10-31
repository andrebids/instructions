import sequelize from '../config/database.js';
import { Product } from '../models/index.js';

// Função helper para processar imagens mock
function processImages(images) {
  if (!images) return { day: null, night: null, colors: {} };
  
  var dayUrl = images.day || null;
  var nightUrl = images.night || null;
  var colors = images.colors || {};
  
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

// Dados mock de produtos (simulado do shop.mock.js)
var mockProducts = [
  {
    id: "prd-001",
    name: "IPL317R",
    price: 1299,
    stock: 32,
    videoFile: "IPL317R.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/IPL317R_DAY.png",
      night: "/SHOP/TRENDING/NIGHT/IPL317R_NIGHT.png",
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
    id: "prd-002",
    name: "Hanging Star 2D",
    price: 349,
    stock: 8,
    images: {
      day: "/demo-images/decorations/star_day.jpg",
      night: "/demo-images/decorations/star_night.jpg",
      colors: {
        brancoPuro: "/demo-images/decorations/star_white.jpg",
        brancoQuente: "/demo-images/decorations/star_warm.jpg",
      },
    },
    tags: ["new", "christmas"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
    specs: {
      descricao: "Lightweight star for indoor environments.",
      tecnicas: "IP20, 24V, 25W",
      dimensoes: "0.8m x 0.8m",
      materiais: "PVC, SMD LED",
    },
  },
  {
    id: "prd-003",
    name: "Pathway Light",
    price: 499,
    stock: 47,
    images: {
      day: "/demo-images/decorations/path_day.jpg",
      night: "/demo-images/decorations/path_night.jpg",
      colors: {
        brancoPuro: "/demo-images/decorations/star_white.jpg",
        brancoQuente: "/demo-images/decorations/star_warm.jpg",
      },
    },
    tags: ["sale", "summer"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
    specs: {
      descricao: "Modular bollards for outdoor pathways.",
      tecnicas: "IP67, 24V, 12W",
      dimensoes: "0.6m x 0.15m",
      materiais: "Anodized aluminium",
    },
  },
  {
    id: "prd-004",
    name: "IPL337",
    price: 129,
    stock: 150,
    images: {
      day: "/SHOP/TRENDING/DAY/IPL337.png",
      night: "/SHOP/TRENDING/NIGHT/IPL337.png",
      colors: {
        brancoPuro: "/demo-images/decorations/star_white.jpg",
        brancoQuente: "/demo-images/decorations/star_warm.jpg",
      },
    },
    tags: ["new", "summer"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Poste",
    specs: {
      descricao: "Flexible LED strip for a variety of applications.",
      tecnicas: "IP20, 12V, 14W/m",
      dimensoes: "5 m reel",
      materiais: "Flexible PCB, SMD LED",
    },
  },
  {
    id: "prd-005b",
    name: "GX350LW",
    price: 899,
    stock: 18,
    videoFile: "GX350LW.webm",
    images: {
      day: "/SHOP/TRENDING/DAY/GX350LW.png",
      night: "/SHOP/TRENDING/NIGHT/GX350LW_NIGHT.png",
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
      day: "/SHOP/TRENDING/DAY/GX349L_DAY.png",
      night: "/SHOP/TRENDING/NIGHT/GX349L_NIGHT.png",
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
      day: "/SHOP/TRENDING/DAY/IPL337W.png",
      night: "/SHOP/TRENDING/NIGHT/IPL337W.png",
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
      day: "/SHOP/TRENDING/DAY/IPL337.png",
      night: "/SHOP/TRENDING/NIGHT/IPL337.png",
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
  {
    id: "prd-007",
    name: "Star Burst 3D",
    price: 749,
    oldPrice: 899,
    stock: 5,
    images: { day: "#f97316", night: "#9a3412", colors: { brancoPuro: "#fde68a" } },
    tags: ["trending", "christmas"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
  },
  {
    id: "prd-008",
    name: "Aurora Panel",
    price: 560,
    stock: 73,
    images: { day: "#14b8a6", night: "#0f766e", colors: { verde: "#10b981", azul: "#3b82f6" } },
    tags: ["trending"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
  },
  {
    id: "prd-009",
    name: "Neon Arch",
    price: 420,
    stock: 0,
    images: { day: "#a78bfa", night: "#6d28d9", colors: { brancoQuente: "#fbbf24" } },
    tags: ["trending", "sale"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
  },
  {
    id: "prd-010",
    name: "Snowflake 2D",
    price: 299,
    stock: 95,
    images: { day: "#e5e7eb", night: "#9ca3af", colors: { brancoPuro: "#ffffff" } },
    tags: ["trending", "christmas"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
  },
  {
    id: "prd-011",
    name: "Path Light Mini",
    price: 189,
    stock: 33,
    images: { day: "#22c55e", night: "#166534", colors: { verde: "#16a34a" } },
    tags: ["trending", "summer"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
  },
  {
    id: "prd-012",
    name: "Glow Sphere",
    price: 379,
    stock: 18,
    images: { day: "#f43f5e", night: "#9f1239", colors: { vermelho: "#ef4444" } },
    tags: ["trending"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Chão",
  },
  {
    id: "prd-013",
    name: "Icicle String",
    price: 149,
    stock: 120,
    images: { day: "#93c5fd", night: "#1d4ed8", colors: { azul: "#60a5fa" } },
    tags: ["trending", "sale"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Transversal",
  },
  {
    id: "prd-014",
    name: "Candy Cane Duo",
    price: 259,
    stock: 9,
    images: { day: "#ef4444", night: "#991b1b", colors: { vermelho: "#f87171", brancoPuro: "#ffffff" } },
    tags: ["trending", "christmas"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
  },
  {
    id: "prd-015",
    name: "Meteor Shower",
    price: 329,
    stock: 44,
    images: { day: "#f59e0b", night: "#b45309", colors: { brancoQuente: "#fbbf24" } },
    tags: ["trending"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
  },
  {
    id: "prd-016",
    name: "Polar Star 3D",
    price: 999,
    oldPrice: 1199,
    stock: 6,
    images: { day: "#0ea5e9", night: "#1e3a8a", colors: { brancoPuro: "#e2e8f0" } },
    tags: ["trending", "sale"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
  },
  {
    id: "prd-017",
    name: "Twinkle Net",
    price: 210,
    stock: 88,
    images: { day: "#ffe4e6", night: "#fb7185", colors: { brancoPuro: "#fafafa" } },
    tags: ["trending"],
    type: "2D",
    usage: "Shopping",
    location: "Interior",
    mount: "Transversal",
  },
  {
    id: "prd-018",
    name: "Crystal Drop",
    price: 640,
    stock: 27,
    images: { day: "#d1fae5", night: "#34d399", colors: { verde: "#10b981" } },
    tags: ["trending"],
    type: "3D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Poste",
  },
  {
    id: "prd-019",
    name: "Comet Trail",
    price: 285,
    stock: 52,
    images: { day: "#ede9fe", night: "#a78bfa", colors: { azul: "#60a5fa", brancoQuente: "#facc15" } },
    tags: ["trending"],
    type: "2D",
    usage: "Shopping",
    location: "Exterior",
    mount: "Transversal",
  },
];

// Função para popular produtos na base de dados
export async function seedProducts() {
  try {
    console.log('🌱 Iniciando seed de produtos...');

    // Sincronizar modelos para aplicar mudanças no schema (se necessário)
    await sequelize.sync({ alter: true });
    console.log('✅ Schema sincronizado');

    // Verificar se já existem produtos
    var existingProducts = await Product.findAll();
    if (existingProducts.length > 0) {
      console.log('⚠️  Produtos já existem na base de dados (' + existingProducts.length + ' produtos).');
      console.log('💡 Para substituir, delete os produtos existentes primeiro ou use force: true.');
      return;
    }

    // Transformar produtos mock para formato do modelo
    var productsData = [];
    for (var i = 0; i < mockProducts.length; i++) {
      productsData.push(transformProduct(mockProducts[i]));
    }

    // Criar produtos na base de dados
    var products = await Product.bulkCreate(productsData);
    console.log('✅ ' + products.length + ' produtos criados');

    // Estatísticas
    var trendingCount = productsData.filter(function(p) {
      return p.isTrending === true;
    }).length;
    var xmasCount = productsData.filter(function(p) {
      return p.season === 'xmas';
    }).length;
    var summerCount = productsData.filter(function(p) {
      return p.season === 'summer';
    }).length;
    var onSaleCount = productsData.filter(function(p) {
      return p.isOnSale === true;
    }).length;
    
    console.log('📊 Resumo:');
    console.log('   - Total de produtos: ' + products.length);
    console.log('   - Trending: ' + trendingCount);
    console.log('   - XMAS: ' + xmasCount);
    console.log('   - Summer: ' + summerCount);
    console.log('   - On Sale: ' + onSaleCount);
    console.log('🎉 Seed de produtos concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao popular produtos:', error);
    throw error;
  }
}

// Executar seed se chamado diretamente
if (process.argv[1] && process.argv[1].indexOf('seedProducts.js') >= 0) {
  seedProducts()
    .then(function() {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch(function(error) {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    });
}

