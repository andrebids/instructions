// Script para criar 15 produtos fictícios para teste
// Execute este script no console do navegador na página /admin/product

const productsAPI = {
  create: async (data) => {
    const formData = new FormData();
    
    // Adicionar campos de texto
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        if (key === 'dayImage' || key === 'nightImage' || key === 'animation' || key === 'animationSimulation') {
          continue;
        }
        if (data[key] === null || data[key] === undefined) {
          continue;
        }
        if (typeof data[key] === 'object' && data[key] !== null) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    }
    
    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }
};

const testProducts = [
  {
    name: "IPL317R",
    stock: 25,
    prices: { new: { price: 89.99, oldPrice: null, rentalPrice: 15.00 }, used: { price: 65.00, rentalPrice: 12.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["priority", "new"],
    releaseYear: "2024",
    season: "",
    specs: {
      descricao: "Placa decorativa 3D em LED para exterior",
      tecnicas: "LED RGB com controle remoto",
      weight: "2.5",
      effects: "RGB",
      materiais: "Alumínio anodizado",
      stockPolicy: "Disponível",
      printType: "BIOPRINT",
      printColor: "WHITE",
      aluminium: "BLACK",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.80",
    width: "0.60",
    depth: "0.15",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL215B",
    stock: 18,
    prices: { new: { price: 75.50, oldPrice: 95.00, rentalPrice: 12.00 }, used: { price: 55.00, rentalPrice: 10.00 } },
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale", "trending"],
    releaseYear: "2023",
    season: "",
    specs: {
      descricao: "Placa decorativa 2D para interior",
      tecnicas: "LED WARM WHITE",
      weight: "1.8",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "BLUE",
      aluminium: "",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.50",
    width: "0.40",
    depth: "0.10",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL420G",
    stock: 32,
    prices: { new: { price: 120.00, oldPrice: null, rentalPrice: 20.00 }, used: { price: 85.00, rentalPrice: 15.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Transversal",
    tags: ["new", "priority"],
    releaseYear: "2024",
    season: "",
    specs: {
      descricao: "Placa decorativa 3D grande formato",
      tecnicas: "LED PURE WHITE + PURE WHITE FLASH",
      weight: "3.2",
      effects: "LED PURE WHITE + PURE WHITE FLASH",
      materiais: "Alumínio e acrílico",
      stockPolicy: "Disponível",
      printType: "RECYPRINT",
      printColor: "GREEN",
      aluminium: "GOLD",
      softXLED: "",
      sparkle: "",
      sparkles: "PURE WHITE"
    },
    height: "1.20",
    width: "0.80",
    depth: "0.20",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL128Y",
    stock: 15,
    prices: { new: { price: 65.00, oldPrice: 80.00, rentalPrice: 10.00 }, used: { price: 45.00, rentalPrice: 8.00 } },
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale"],
    releaseYear: "2022",
    season: "",
    specs: {
      descricao: "Placa decorativa compacta",
      tecnicas: "LED WARM WHITE",
      weight: "1.2",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "YELLOW",
      aluminium: "",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.30",
    width: "0.25",
    depth: "0.08",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL550X",
    stock: 8,
    prices: { new: { price: 150.00, oldPrice: null, rentalPrice: 25.00 }, used: { price: 110.00, rentalPrice: 20.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["priority", "trending"],
    releaseYear: "2024",
    season: "",
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
      softXLED: "",
      sparkle: "",
      sparkles: "RGB"
    },
    height: "1.50",
    width: "1.00",
    depth: "0.25",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL312P",
    stock: 22,
    prices: { new: { price: 95.00, oldPrice: null, rentalPrice: 16.00 }, used: { price: 70.00, rentalPrice: 13.00 } },
    type: "2D",
    location: "Exterior",
    mount: "Poste",
    tags: ["new"],
    releaseYear: "2024",
    season: "",
    specs: {
      descricao: "Placa decorativa 2D exterior",
      tecnicas: "LED BLUE + PURE WHITE FLASH",
      weight: "2.0",
      effects: "LED BLUE + PURE WHITE FLASH",
      materiais: "Alumínio",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT IGNIFUGE",
      printColor: "PINK",
      aluminium: "WHITE",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.70",
    width: "0.50",
    depth: "0.12",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL201R",
    stock: 30,
    prices: { new: { price: 55.00, oldPrice: 70.00, rentalPrice: 9.00 }, used: { price: 40.00, rentalPrice: 7.00 } },
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale", "summer"],
    releaseYear: "2023",
    season: "summer",
    specs: {
      descricao: "Placa decorativa verão",
      tecnicas: "LED WARM WHITE",
      weight: "1.0",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "RED",
      aluminium: "",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.40",
    width: "0.35",
    depth: "0.10",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL888C",
    stock: 12,
    prices: { new: { price: 180.00, oldPrice: null, rentalPrice: 30.00 }, used: { price: 130.00, rentalPrice: 25.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Transversal",
    tags: ["priority", "new", "trending"],
    releaseYear: "2024",
    season: "",
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
      softXLED: "",
      sparkle: "",
      sparkles: "RGB"
    },
    height: null,
    width: null,
    depth: null,
    diameter: "1.20",
    isActive: true
  },
  {
    name: "IPL145O",
    stock: 20,
    prices: { new: { price: 70.00, oldPrice: null, rentalPrice: 11.00 }, used: { price: 50.00, rentalPrice: 9.00 } },
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["new"],
    releaseYear: "2024",
    season: "",
    specs: {
      descricao: "Placa decorativa interior moderna",
      tecnicas: "LED PURE WHITE",
      weight: "1.5",
      effects: "LED PURE WHITE",
      materiais: "Acrílico premium",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "ORANGE",
      aluminium: "",
      softXLED: "PURE WHITE",
      sparkle: "",
      sparkles: ""
    },
    height: "0.45",
    width: "0.38",
    depth: "0.10",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL299N",
    stock: 28,
    prices: { new: { price: 85.00, oldPrice: 100.00, rentalPrice: 14.00 }, used: { price: 60.00, rentalPrice: 11.00 } },
    type: "2D",
    location: "Exterior",
    mount: "Poste",
    tags: ["sale", "christmas"],
    releaseYear: "2023",
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
      aluminium: "GOLD",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.65",
    width: "0.48",
    depth: "0.12",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL666D",
    stock: 5,
    prices: { new: { price: 200.00, oldPrice: null, rentalPrice: 35.00 }, used: { price: 150.00, rentalPrice: 30.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["priority", "trending"],
    releaseYear: "2024",
    season: "",
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
      softXLED: "",
      sparkle: "",
      sparkles: "RGB"
    },
    height: "1.80",
    width: "1.20",
    depth: "0.30",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL077L",
    stock: 35,
    prices: { new: { price: 60.00, oldPrice: null, rentalPrice: 10.00 }, used: { price: 42.00, rentalPrice: 8.00 } },
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["new", "summer"],
    releaseYear: "2024",
    season: "summer",
    specs: {
      descricao: "Placa decorativa verão compacta",
      tecnicas: "LED GREEN + PURE WHITE FLASH",
      weight: "1.1",
      effects: "LED GREEN + PURE WHITE FLASH",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "LIGHT GREEN",
      aluminium: "",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.35",
    width: "0.30",
    depth: "0.08",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL444W",
    stock: 40,
    prices: { new: { price: 50.00, oldPrice: 65.00, rentalPrice: 8.00 }, used: { price: 35.00, rentalPrice: 6.00 } },
    type: "2D",
    location: "Interior",
    mount: "Chão",
    tags: ["sale"],
    releaseYear: "2022",
    season: "",
    specs: {
      descricao: "Placa decorativa básica",
      tecnicas: "LED WARM WHITE",
      weight: "0.9",
      effects: "LED WARM WHITE",
      materiais: "Acrílico",
      stockPolicy: "Disponível",
      printType: "FLEXIPRINT",
      printColor: "WHITE",
      aluminium: "",
      softXLED: "",
      sparkle: "",
      sparkles: ""
    },
    height: "0.30",
    width: "0.25",
    depth: "0.08",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL999M",
    stock: 3,
    prices: { new: { price: 250.00, oldPrice: null, rentalPrice: 40.00 }, used: { price: 180.00, rentalPrice: 35.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Transversal",
    tags: ["priority", "new", "trending"],
    releaseYear: "2024",
    season: "",
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
      softXLED: "",
      sparkle: "",
      sparkles: "RGB"
    },
    height: "2.00",
    width: "1.50",
    depth: "0.35",
    diameter: null,
    isActive: true
  },
  {
    name: "IPL111T",
    stock: 0,
    prices: { new: { price: 110.00, oldPrice: null, rentalPrice: 18.00 }, used: { price: 80.00, rentalPrice: 15.00 } },
    type: "3D",
    location: "Exterior",
    mount: "Poste",
    tags: ["trending"],
    releaseYear: "2023",
    season: "",
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
      softXLED: "",
      sparkle: "",
      sparkles: "PURE WHITE"
    },
    height: "0.90",
    width: "0.70",
    depth: "0.18",
    diameter: null,
    isActive: false
  }
];

// Função para criar produtos
async function createTestProducts() {
  console.log('🚀 Iniciando criação de produtos de teste...');
  
  for (let i = 0; i < testProducts.length; i++) {
    const product = testProducts[i];
    
    try {
      // Preparar dados para envio
      const productData = {
        name: product.name,
        stock: product.stock.toString(),
        usedStock: "0",
        price: product.prices.new.price.toString(),
        oldPrice: product.prices.new.oldPrice ? product.prices.new.oldPrice.toString() : "",
        rentalPrice: product.prices.new.rentalPrice.toString(),
        usedPrice: product.prices.used.price.toString(),
        usedRentalPrice: product.prices.used.rentalPrice.toString(),
        type: product.type,
        location: product.location,
        mount: product.mount,
        tags: product.tags,
        releaseYear: product.releaseYear || "",
        season: product.season || "",
        isActive: product.isActive.toString(),
        height: product.height || "",
        width: product.width || "",
        depth: product.depth || "",
        diameter: product.diameter || "",
        specs: JSON.stringify(product.specs),
        availableColors: JSON.stringify({})
      };
      
      const result = await productsAPI.create(productData);
      console.log(`✅ Produto ${i + 1}/15 criado: ${product.name}`, result);
      
      // Pequeno delay para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Erro ao criar produto ${i + 1}/15 (${product.name}):`, error);
    }
  }
  
  console.log('✨ Criação de produtos concluída!');
}

// Executar
createTestProducts();

