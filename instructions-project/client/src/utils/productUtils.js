// Função para transformar dados da API para formato esperado pelo contexto
export function transformApiProduct(apiProduct) {
  if (!apiProduct) return null;
  
  var transformed = {
    id: apiProduct.id,
    name: apiProduct.name || '',
    price: typeof apiProduct.price === 'number' ? apiProduct.price : parseFloat(apiProduct.price) || 0,
    stock: typeof apiProduct.stock === 'number' ? apiProduct.stock : 0,
    videoFile: apiProduct.animationUrl || apiProduct.videoFile || null,
    images: {
      day: apiProduct.imagesDayUrl || apiProduct.thumbnailUrl || null,
      night: apiProduct.imagesNightUrl || apiProduct.imagesDayUrl || apiProduct.thumbnailUrl || null,
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
          // Debug para produto específico
          if (apiProduct.id === 'IPL317R' || apiProduct.name === 'IPL317R') {
            console.log('🔍 [transformApiProduct] IPL317R specs do banco:', JSON.stringify(specsCopy, null, 2));
          }
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
      matches = hasChristmasTag || String(p.season).toLowerCase() === 'xmas';
    } else if (category === 'summer') {
      // Tag "summer" OU season="summer"
      var hasSummerTag = false;
      if (Array.isArray(p.tags)) {
        for (var o = 0; o < p.tags.length; o++) {
          if (String(p.tags[o]).toLowerCase() === 'summer') {
            hasSummerTag = true;
            break;
          }
        }
      }
      matches = hasSummerTag || String(p.season).toLowerCase() === 'summer';
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

