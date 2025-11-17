// Script para criar 15 produtos fictícios para teste
// Copie e cole este código no console do navegador na página /admin/product

(async function() {
  const baseURL = window.location.origin;
  
  const testProducts = [
    {
      name: "IPL317R",
      stock: 25,
      price: 89.99,
      oldPrice: "",
      rentalPrice: 15.00,
      usedPrice: 65.00,
      usedRentalPrice: 12.00,
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
        aluminium: "BLACK"
      },
      height: "0.80",
      width: "0.60",
      depth: "0.15",
      isActive: true
    },
    {
      name: "IPL215B",
      stock: 18,
      price: 75.50,
      oldPrice: 95.00,
      rentalPrice: 12.00,
      usedPrice: 55.00,
      usedRentalPrice: 10.00,
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
        printColor: "DARK BLUE"
      },
      height: "0.50",
      width: "0.40",
      depth: "0.10",
      isActive: true
    },
    {
      name: "IPL420G",
      stock: 32,
      price: 120.00,
      oldPrice: "",
      rentalPrice: 20.00,
      usedPrice: 85.00,
      usedRentalPrice: 15.00,
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
        printColor: "DARK GREEN",
        aluminium: "GOLD",
        sparkles: "PURE WHITE"
      },
      height: "1.20",
      width: "0.80",
      depth: "0.20",
      isActive: true
    },
    {
      name: "IPL128Y",
      stock: 15,
      price: 65.00,
      oldPrice: 80.00,
      rentalPrice: 10.00,
      usedPrice: 45.00,
      usedRentalPrice: 8.00,
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
        printColor: "YELLOW"
      },
      height: "0.30",
      width: "0.25",
      depth: "0.08",
      isActive: true
    },
    {
      name: "IPL550X",
      stock: 8,
      price: 150.00,
      oldPrice: "",
      rentalPrice: 25.00,
      usedPrice: 110.00,
      usedRentalPrice: 20.00,
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
        sparkles: "RGB"
      },
      height: "1.50",
      width: "1.00",
      depth: "0.25",
      isActive: true
    },
    {
      name: "IPL312P",
      stock: 22,
      price: 95.00,
      oldPrice: "",
      rentalPrice: 16.00,
      usedPrice: 70.00,
      usedRentalPrice: 13.00,
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
        aluminium: "WHITE"
      },
      height: "0.70",
      width: "0.50",
      depth: "0.12",
      isActive: true
    },
    {
      name: "IPL201R",
      stock: 30,
      price: 55.00,
      oldPrice: 70.00,
      rentalPrice: 9.00,
      usedPrice: 40.00,
      usedRentalPrice: 7.00,
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
        printColor: "RED"
      },
      height: "0.40",
      width: "0.35",
      depth: "0.10",
      isActive: true
    },
    {
      name: "IPL888C",
      stock: 12,
      price: 180.00,
      oldPrice: "",
      rentalPrice: 30.00,
      usedPrice: 130.00,
      usedRentalPrice: 25.00,
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
      price: 70.00,
      oldPrice: "",
      rentalPrice: 11.00,
      usedPrice: 50.00,
      usedRentalPrice: 9.00,
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
        softXLED: "PURE WHITE"
      },
      height: "0.45",
      width: "0.38",
      depth: "0.10",
      isActive: true
    },
    {
      name: "IPL299N",
      stock: 28,
      price: 85.00,
      oldPrice: 100.00,
      rentalPrice: 14.00,
      usedPrice: 60.00,
      usedRentalPrice: 11.00,
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
        aluminium: "GOLD"
      },
      height: "0.65",
      width: "0.48",
      depth: "0.12",
      isActive: true
    },
    {
      name: "IPL666D",
      stock: 5,
      price: 200.00,
      oldPrice: "",
      rentalPrice: 35.00,
      usedPrice: 150.00,
      usedRentalPrice: 30.00,
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
        sparkles: "RGB"
      },
      height: "1.80",
      width: "1.20",
      depth: "0.30",
      isActive: true
    },
    {
      name: "IPL077L",
      stock: 35,
      price: 60.00,
      oldPrice: "",
      rentalPrice: 10.00,
      usedPrice: 42.00,
      usedRentalPrice: 8.00,
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
        printColor: "LIGHT GREEN"
      },
      height: "0.35",
      width: "0.30",
      depth: "0.08",
      isActive: true
    },
    {
      name: "IPL444W",
      stock: 40,
      price: 50.00,
      oldPrice: 65.00,
      rentalPrice: 8.00,
      usedPrice: 35.00,
      usedRentalPrice: 6.00,
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
        printColor: "WHITE"
      },
      height: "0.30",
      width: "0.25",
      depth: "0.08",
      isActive: true
    },
    {
      name: "IPL999M",
      stock: 3,
      price: 250.00,
      oldPrice: "",
      rentalPrice: 40.00,
      usedPrice: 180.00,
      usedRentalPrice: 35.00,
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
        sparkles: "RGB"
      },
      height: "2.00",
      width: "1.50",
      depth: "0.35",
      isActive: true
    },
    {
      name: "IPL111T",
      stock: 0,
      price: 110.00,
      oldPrice: "",
      rentalPrice: 18.00,
      usedPrice: 80.00,
      usedRentalPrice: 15.00,
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
        sparkles: "PURE WHITE"
      },
      height: "0.90",
      width: "0.70",
      depth: "0.18",
      isActive: false
    }
  ];

  console.log('🚀 Iniciando criação de 15 produtos de teste...');
  
  for (let i = 0; i < testProducts.length; i++) {
    const product = testProducts[i];
    
    try {
      const formData = new FormData();
      
      // Campos básicos
      formData.append('name', product.name);
      formData.append('stock', product.stock.toString());
      formData.append('usedStock', '0');
      formData.append('price', product.price.toString());
      if (product.oldPrice) formData.append('oldPrice', product.oldPrice.toString());
      formData.append('rentalPrice', product.rentalPrice.toString());
      formData.append('usedPrice', product.usedPrice.toString());
      formData.append('usedRentalPrice', product.usedRentalPrice.toString());
      
      // Categorias
      if (product.type) formData.append('type', product.type);
      if (product.location) formData.append('location', product.location);
      if (product.mount) formData.append('mount', product.mount);
      
      // Tags
      if (product.tags && product.tags.length > 0) {
        product.tags.forEach(tag => formData.append('tags', tag));
      }
      
      // Ano e estação
      if (product.releaseYear) formData.append('releaseYear', product.releaseYear);
      if (product.season) formData.append('season', product.season);
      
      // Dimensões
      if (product.height) formData.append('height', product.height);
      if (product.width) formData.append('width', product.width);
      if (product.depth) formData.append('depth', product.depth);
      if (product.diameter) formData.append('diameter', product.diameter);
      
      // Specs
      formData.append('specs', JSON.stringify(product.specs));
      
      // Cores disponíveis (vazio)
      formData.append('availableColors', JSON.stringify({}));
      
      // Status
      formData.append('isActive', product.isActive.toString());
      
      const response = await fetch(`${baseURL}/api/products`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [${i + 1}/15] Produto criado: ${product.name}`, result);
      } else {
        const error = await response.json();
        console.error(`❌ [${i + 1}/15] Erro ao criar ${product.name}:`, error);
      }
      
      // Pequeno delay para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ [${i + 1}/15] Erro ao criar ${product.name}:`, error);
    }
  }
  
  console.log('✨ Criação de produtos concluída! Recarregue a página para ver os produtos.');
})();

