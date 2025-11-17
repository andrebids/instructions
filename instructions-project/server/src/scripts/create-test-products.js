import sequelize from '../config/database.js';
import Product from '../models/Product.js';

// 15 produtos fictícios para teste
const testProducts = [
  {
    name: "IPL317R",
    stock: 25,
    price: 89.99,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["priority", "new"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa 3D em LED para exterior",
      tecnicas: "LED RGB com controle remoto",
      weight: "2.5",
      effects: "RGB",
      materiais: "Alumínio anodizado",
      stockPolicy: "Disponível",
      printType: "BIOPRINT",
      printColor: "WHITE",
      aluminium: "BLACK"
    },
    height: 0.80,
    width: 0.60,
    depth: 0.15,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL215B",
    stock: 18,
    price: 75.50,
    oldPrice: 95.00,
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale", "trending"],
    releaseYear: 2023,
    season: null,
    specs: {
      descricao: "Placa decorativa 2D para interior",
      tecnicas: "LED WARM WHITE",
      weight: "1.8",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "DARK BLUE"
    },
    height: 0.50,
    width: 0.40,
    depth: 0.10,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL420G",
    stock: 32,
    price: 120.00,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Transversal",
    tags: ["new", "priority"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa 3D grande formato",
      tecnicas: "LED PURE WHITE + PURE WHITE FLASH",
      weight: "3.2",
      effects: "LED PURE WHITE + PURE WHITE FLASH",
      materiais: "Alumínio e acrílico",
      stockPolicy: "Disponível",
      printType: "RECYPRINT",
      printColor: "DARK GREEN",
      aluminium: "GOLD",
      sparkles: "PURE WHITE"
    },
    height: 1.20,
    width: 0.80,
    depth: 0.20,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL128Y",
    stock: 15,
    price: 65.00,
    oldPrice: 80.00,
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale"],
    releaseYear: 2022,
    season: null,
    specs: {
      descricao: "Placa decorativa compacta",
      tecnicas: "LED WARM WHITE",
      weight: "1.2",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "YELLOW"
    },
    height: 0.30,
    width: 0.25,
    depth: 0.08,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL550X",
    stock: 8,
    price: 150.00,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["priority", "trending"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa premium 3D",
      tecnicas: "LED RGB + animações",
      weight: "4.5",
      effects: "RGB",
      materiais: "Alumínio premium",
      stockPolicy: "Limitado",
      printType: "BIOPRINT",
      printColor: "BLACK",
      aluminium: "GOLD",
      sparkles: "RGB"
    },
    height: 1.50,
    width: 1.00,
    depth: 0.25,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL312P",
    stock: 22,
    price: 95.00,
    oldPrice: null,
    type: "2D",
    location: "Exterior",
    mount: "Poste",
    tags: ["new"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa 2D exterior",
      tecnicas: "LED BLUE + PURE WHITE FLASH",
      weight: "2.0",
      effects: "LED BLUE + PURE WHITE FLASH",
      materiais: "Alumínio",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT IGNIFUGE",
      printColor: "PINK",
      aluminium: "WHITE"
    },
    height: 0.70,
    width: 0.50,
    depth: 0.12,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL201R",
    stock: 30,
    price: 55.00,
    oldPrice: 70.00,
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale", "summer"],
    releaseYear: 2023,
    season: "summer",
    specs: {
      descricao: "Placa decorativa verão",
      tecnicas: "LED WARM WHITE",
      weight: "1.0",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "RED"
    },
    height: 0.40,
    width: 0.35,
    depth: 0.10,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL888C",
    stock: 12,
    price: 180.00,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Transversal",
    tags: ["priority", "new", "trending"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa 3D circular premium",
      tecnicas: "LED RGB + múltiplos efeitos",
      weight: "5.0",
      effects: "RGB",
      materiais: "Alumínio e vidro",
      stockPolicy: "Limitado",
      printType: "BIOPRINT",
      printColor: "PURPLE",
      aluminium: "GOLD",
      sparkles: "RGB"
    },
    height: null,
    width: null,
    depth: null,
    diameter: 1.20,
    isActive: true
  },
  {
    name: "IPL145O",
    stock: 20,
    price: 70.00,
    oldPrice: null,
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["new"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa interior moderna",
      tecnicas: "LED PURE WHITE",
      weight: "1.5",
      effects: "LED PURE WHITE",
      materiais: "Acrílico premium",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "ORANGE",
      softXLED: "PURE WHITE"
    },
    height: 0.45,
    width: 0.38,
    depth: 0.10,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL299N",
    stock: 28,
    price: 85.00,
    oldPrice: 100.00,
    type: "2D",
    location: "Exterior",
    mount: "Poste",
    tags: ["sale", "christmas"],
    releaseYear: 2023,
    season: "xmas",
    specs: {
      descricao: "Placa decorativa natalícia",
      tecnicas: "LED RED + PURE WHITE FLASH",
      weight: "2.2",
      effects: "LED RED + PURE WHITE FLASH",
      materiais: "Alumínio",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "RED",
      aluminium: "GOLD"
    },
    height: 0.65,
    width: 0.48,
    depth: 0.12,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL666D",
    stock: 5,
    price: 200.00,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["priority", "trending"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa 3D edição limitada",
      tecnicas: "LED RGB + animações avançadas",
      weight: "6.0",
      effects: "RGB",
      materiais: "Alumínio premium e vidro temperado",
      stockPolicy: "Muito limitado",
      printType: "BIOPRINT",
      printColor: "DARK BLUE",
      aluminium: "BLACK",
      sparkles: "RGB"
    },
    height: 1.80,
    width: 1.20,
    depth: 0.30,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL077L",
    stock: 35,
    price: 60.00,
    oldPrice: null,
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["new", "summer"],
    releaseYear: 2024,
    season: "summer",
    specs: {
      descricao: "Placa decorativa verão compacta",
      tecnicas: "LED GREEN + PURE WHITE FLASH",
      weight: "1.1",
      effects: "LED GREEN + PURE WHITE FLASH",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "LIGHT GREEN"
    },
    height: 0.35,
    width: 0.30,
    depth: 0.08,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL444W",
    stock: 40,
    price: 50.00,
    oldPrice: 65.00,
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale"],
    releaseYear: 2022,
    season: null,
    specs: {
      descricao: "Placa decorativa básica",
      tecnicas: "LED WARM WHITE",
      weight: "0.9",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "WHITE"
    },
    height: 0.30,
    width: 0.25,
    depth: 0.08,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL999M",
    stock: 3,
    price: 250.00,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Transversal",
    tags: ["priority", "new", "trending"],
    releaseYear: 2024,
    season: null,
    specs: {
      descricao: "Placa decorativa 3D mega formato",
      tecnicas: "LED RGB + todos os efeitos",
      weight: "8.0",
      effects: "RGB",
      materiais: "Alumínio premium e vidro",
      stockPolicy: "Muito limitado",
      printType: "BIOPRINT",
      printColor: "GOLD",
      aluminium: "GOLD",
      sparkles: "RGB"
    },
    height: 2.00,
    width: 1.50,
    depth: 0.35,
    diameter: null,
    isActive: true
  },
  {
    name: "IPL111T",
    stock: 0,
    price: 110.00,
    oldPrice: null,
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["trending"],
    releaseYear: 2023,
    season: null,
    specs: {
      descricao: "Placa decorativa 3D esgotada",
      tecnicas: "LED PURE WHITE + PURE WHITE SLOW FLASH",
      weight: "3.5",
      effects: "LED PURE WHITE + PURE WHITE SLOW FLASH",
      materiais: "Alumínio",
      stockPolicy: "Esgotado",
      printType: "RECYPRINT",
      printColor: "ICE BLUE",
      aluminium: "WHITE",
      sparkles: "PURE WHITE"
    },
    height: 0.90,
    width: 0.70,
    depth: 0.18,
    diameter: null,
    isActive: false
  }
];

// Função para criar produtos de teste
async function createTestProducts() {
  try {
    console.log('🚀 Iniciando criação de 15 produtos de teste...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    let created = 0;
    let skipped = 0;
    
    for (let i = 0; i < testProducts.length; i++) {
      const productData = testProducts[i];
      
      // Verificar se já existe
      const existing = await Product.findOne({ where: { name: productData.name } });
      
      if (existing) {
        console.log(`⏭️  [${i + 1}/15] Produto já existe: ${productData.name}`);
        skipped++;
        continue;
      }
      
      // Calcular isOnSale
      const isOnSale = productData.oldPrice !== null && productData.oldPrice > productData.price;
      
      // Verificar se tem tag trending
      const isTrending = productData.tags && productData.tags.includes('trending');
      
      // Gerar ID único baseado no nome
      const productId = `test-${productData.name.toLowerCase()}-${Date.now()}-${i}`;
      
      // Criar produto
      await Product.create({
        id: productId,
        name: productData.name,
        price: productData.price,
        oldPrice: productData.oldPrice,
        stock: productData.stock,
        type: productData.type,
        location: productData.location,
        mount: productData.mount,
        tags: productData.tags || [],
        releaseYear: productData.releaseYear,
        season: productData.season,
        specs: productData.specs,
        height: productData.height,
        width: productData.width,
        depth: productData.depth,
        diameter: productData.diameter,
        isActive: productData.isActive,
        isOnSale: isOnSale,
        isTrending: isTrending,
        availableColors: {}
      });
      
      created++;
      console.log(`✅ [${i + 1}/15] Produto criado: ${productData.name}`);
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   - Produtos criados: ${created}`);
    console.log(`   - Produtos já existentes (ignorados): ${skipped}`);
    console.log(`   - Total processado: ${testProducts.length}`);
    console.log('✨ Criação de produtos de teste concluída!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar produtos de teste:', error);
    process.exit(1);
  }
}

// Executar
createTestProducts();

