// Função para verificar se uma URL de imagem é válida
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  var trimmed = url.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
  return true;
}

// Lista de imagens disponíveis nas pastas locais
var availableDayImages = [
  '/SHOP/TRENDING/DAY/GX349L_DAY.webp',
  '/SHOP/TRENDING/DAY/GX350LW.webp',
  '/SHOP/TRENDING/DAY/IPL317R_DAY.webp',
  '/SHOP/TRENDING/DAY/IPL337.webp',
  '/SHOP/TRENDING/DAY/IPL337W.webp',
];

var availableNightImages = [
  '/SHOP/TRENDING/NIGHT/GX349L_NIGHT.webp',
  '/SHOP/TRENDING/NIGHT/GX350LW_NIGHT.webp',
  '/SHOP/TRENDING/NIGHT/IPL317R_NIGHT.webp',
  '/SHOP/TRENDING/NIGHT/IPL337.webp',
  '/SHOP/TRENDING/NIGHT/IPL337W.webp',
];

// Função para gerar uma imagem aleatória baseada no ID do produto
function getRandomImage(productId, isNight) {
  // Usar o ID do produto para gerar um número determinístico mas variado
  var hash = 0;
  var seedString = productId + (isNight ? '_night' : '_day');
  if (seedString) {
    for (var i = 0; i < seedString.length; i++) {
      hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
  }
  
  // Selecionar uma imagem da lista baseada no hash
  var imageList = isNight ? availableNightImages : availableDayImages;
  var index = Math.abs(hash) % imageList.length;
  return imageList[index];
}

// Função para transformar dados da API para formato esperado pelo contexto
export function transformApiProduct(apiProduct) {
  if (!apiProduct) return null;
  
  // Sempre atribuir imagens - verificar se as URLs existentes são válidas
  var dayImage = null;
  var nightImage = null;
  
  // Tentar usar imagens existentes se forem válidas
  if (isValidImageUrl(apiProduct.imagesDayUrl)) {
    dayImage = apiProduct.imagesDayUrl;
  } else if (isValidImageUrl(apiProduct.thumbnailUrl)) {
    dayImage = apiProduct.thumbnailUrl;
  }
  
  if (isValidImageUrl(apiProduct.imagesNightUrl)) {
    nightImage = apiProduct.imagesNightUrl;
  } else if (isValidImageUrl(apiProduct.imagesDayUrl)) {
    nightImage = apiProduct.imagesDayUrl;
  } else if (isValidImageUrl(apiProduct.thumbnailUrl)) {
    nightImage = apiProduct.thumbnailUrl;
  }
  
  // Se ainda não houver imagens válidas, usar imagens aleatórias das pastas locais
  if (!isValidImageUrl(dayImage)) {
    dayImage = getRandomImage(apiProduct.id, false);
    console.log('🖼️ [transformApiProduct] Atribuindo imagem aleatória (dia) para produto:', apiProduct.id, dayImage);
  }
  if (!isValidImageUrl(nightImage)) {
    nightImage = getRandomImage(apiProduct.id, true);
    console.log('🖼️ [transformApiProduct] Atribuindo imagem aleatória (noite) para produto:', apiProduct.id, nightImage);
  }
  
  var transformed = {
    id: apiProduct.id,
    name: apiProduct.name || '',
    price: typeof apiProduct.price === 'number' ? apiProduct.price : parseFloat(apiProduct.price) || 0,
    stock: typeof apiProduct.stock === 'number' ? apiProduct.stock : 0,
    videoFile: apiProduct.animationUrl || apiProduct.videoFile || null,
    animationUrl: apiProduct.animationUrl || null,
    animationSimulationUrl: apiProduct.animationSimulationUrl || null,
    images: {
      day: dayImage,
      night: nightImage,
      colors: apiProduct.availableColors || {},
    },
    tags: Array.isArray(apiProduct.tags) ? apiProduct.tags : [],
    type: apiProduct.type || null,
    usage: apiProduct.usage || null,
    location: apiProduct.location || null,
    mount: apiProduct.mount || null,
    specs: (function() {
      try {
        if (apiProduct.specs) {
          // Criar cópia profunda do specs para evitar referências
          var specsCopy = JSON.parse(JSON.stringify(apiProduct.specs));
          return specsCopy;
        }
        return {};
      } catch (e) {
        console.error('⚠️ [transformApiProduct] Erro ao processar specs:', e, apiProduct.id);
        return apiProduct.specs || {};
      }
    })(),
    variantProductByColor: apiProduct.variantProductByColor || null,
    isTrending: apiProduct.isTrending || false,
    isOnSale: apiProduct.isOnSale || false,
    season: apiProduct.season || null,
    releaseYear: apiProduct.releaseYear || null,
    oldPrice: apiProduct.oldPrice || null,
    height: apiProduct.height || null,
    width: apiProduct.width || null,
    depth: apiProduct.depth || null,
    diameter: apiProduct.diameter || null,
  };
  
  return transformed;
}

// Função para filtrar produtos por categoria
export function getProductsByCategory(products, categoryId) {
  if (!products || !Array.isArray(products)) return [];
  if (!categoryId) return products;
  
  var category = String(categoryId).toLowerCase();
  var filtered = [];
  
  // Encontrar ano mais recente para categoria "new"
  var latestYear = null;
  if (category === 'new') {
    for (var i = 0; i < products.length; i++) {
      var product = products[i];
      if (product.releaseYear && typeof product.releaseYear === 'number') {
        if (latestYear === null || product.releaseYear > latestYear) {
          latestYear = product.releaseYear;
        }
      }
    }
  }
  
  // Filtrar produtos conforme categoria
  for (var j = 0; j < products.length; j++) {
    var p = products[j];
    var matches = false;
    
    if (category === 'trending') {
      // Tag "trending" OU campo isTrending=true
      var hasTrendingTag = false;
      if (Array.isArray(p.tags)) {
        for (var k = 0; k < p.tags.length; k++) {
          if (String(p.tags[k]).toLowerCase() === 'trending') {
            hasTrendingTag = true;
            break;
          }
        }
      }
      matches = hasTrendingTag || Boolean(p.isTrending);
    } else if (category === 'new') {
      // Tag "new" OU releaseYear igual ao mais recente
      var hasNewTag = false;
      if (Array.isArray(p.tags)) {
        for (var l = 0; l < p.tags.length; l++) {
          if (String(p.tags[l]).toLowerCase() === 'new') {
            hasNewTag = true;
            break;
          }
        }
      }
      matches = hasNewTag || (p.releaseYear !== null && p.releaseYear !== undefined && p.releaseYear === latestYear);
    } else if (category === 'sale') {
      // Tag "sale" OU campo isOnSale=true
      var hasSaleTag = false;
      if (Array.isArray(p.tags)) {
        for (var m = 0; m < p.tags.length; m++) {
          if (String(p.tags[m]).toLowerCase() === 'sale') {
            hasSaleTag = true;
            break;
          }
        }
      }
      matches = hasSaleTag || Boolean(p.isOnSale);
    } else if (category === 'christmas') {
      // Tag "christmas" OU season="xmas"
      var hasChristmasTag = false;
      if (Array.isArray(p.tags)) {
        for (var n = 0; n < p.tags.length; n++) {
          var tagLower = String(p.tags[n]).toLowerCase();
          if (tagLower === 'christmas' || tagLower === 'xmas') {
            hasChristmasTag = true;
            break;
          }
        }
      }
      // Verificar season apenas se não for null/undefined/vazio
      var hasChristmasSeason = false;
      if (p.season && typeof p.season === 'string' && p.season.trim() !== '') {
        hasChristmasSeason = String(p.season).toLowerCase().trim() === 'xmas';
      }
      matches = hasChristmasTag || hasChristmasSeason;
    } else if (category === 'summer') {
      // Tag "summer" OU season="summer"
      // IMPORTANTE: Excluir produtos com season diferente de "summer" (ex: "xmas")
      var hasSummerTag = false;
      if (Array.isArray(p.tags)) {
        for (var o = 0; o < p.tags.length; o++) {
          if (String(p.tags[o]).toLowerCase() === 'summer') {
            hasSummerTag = true;
            break;
          }
        }
      }
      
      // Verificar season apenas se não for null/undefined/vazio
      var hasSummerSeason = false;
      var hasNonSummerSeason = false;
      var seasonDefined = false;
      
      if (p.season && typeof p.season === 'string' && p.season.trim() !== '') {
        seasonDefined = true;
        var seasonLower = String(p.season).toLowerCase().trim();
        if (seasonLower === 'summer') {
          hasSummerSeason = true;
        } else {
          // Se tem season mas não é "summer", marcar como não-summer
          hasNonSummerSeason = true;
        }
      }
      
      // Incluir se:
      // 1. Tem tag "summer" E não tem season definido (ou season está vazio/null)
      // 2. OU tem season="summer"
      // NÃO incluir se tem season diferente de "summer"
      if (hasNonSummerSeason) {
        // Produto tem season definido e não é "summer" → excluir
        matches = false;
      } else {
        // Produto não tem season definido ou tem season="summer" → verificar tag ou season
        matches = hasSummerTag || hasSummerSeason;
      }
      
      // Debug removido
    } else {
      // Fallback: verificar se tem a tag correspondente
      if (Array.isArray(p.tags)) {
        for (var p_idx = 0; p_idx < p.tags.length; p_idx++) {
          if (String(p.tags[p_idx]).toLowerCase() === category) {
            matches = true;
            break;
          }
        }
      }
    }
    
    if (matches) {
      filtered.push(p);
    }
  }
  
  return filtered;
}

