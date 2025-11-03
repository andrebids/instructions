// Filtragem client-side no estilo /shop/trending
// Evita métodos modernos; usa loops/ifs

export function computeStockFromId(id) {
  try {
    var s = 0;
    var str = String(id || '');
    for (var i = 0; i < str.length; i++) s += str.charCodeAt(i);
    return 5 + (s % 60);
  } catch (_) {
    return 20;
  }
}

export function filterDecorations(items, filters, categoryId, searchTerm) {
  if (!Array.isArray(items)) return [];
  var list = [];
  var q = String(searchTerm || '').toLowerCase();

  for (var i = 0; i < items.length; i++) {
    var d = items[i];
    var include = true;

    if (categoryId && d && d.category && d.category !== categoryId) include = false;

    if (include && q) {
      var nm = String(d && d.name ? d.name : '').toLowerCase();
      var rf = String(d && d.ref ? d.ref : '').toLowerCase();
      if (nm.indexOf(q) === -1 && rf.indexOf(q) === -1) include = false;
    }

    var priceMin = (filters && Array.isArray(filters.priceRange)) ? Number(filters.priceRange[0] || 0) : null;
    var priceMax = (filters && Array.isArray(filters.priceRange)) ? Number(filters.priceRange[1] || 0) : null;
    if (include && priceMin !== null && Number.isFinite(priceMin) && typeof d.price === 'number') {
      if (d.price < priceMin) include = false;
    }
    if (include && priceMax !== null && Number.isFinite(priceMax) && typeof d.price === 'number' && priceMax > 0) {
      if (d.price > priceMax) include = false;
    }

    var minStock = (filters && typeof filters.minStock === 'number') ? filters.minStock : 0;
    if (include && minStock > 0) {
      var st = typeof d.stock === 'number' ? d.stock : computeStockFromId(d && d.id);
      if (st < minStock) include = false;
    }

    if (include && filters && filters.color && Array.isArray(filters.color) && filters.color.length > 0) {
      var colorMatch = false;
      
      // Verificar availableColors (objeto com chaves de cores) - formato principal dos produtos
      var availableColors = d && d.availableColors ? d.availableColors : null;
      if (availableColors && typeof availableColors === 'object') {
        // Se for string, tentar fazer parse
        if (typeof availableColors === 'string') {
          try {
            availableColors = JSON.parse(availableColors);
          } catch (e) {
            console.warn('[FILTER] Erro ao fazer parse de availableColors:', e);
            availableColors = null;
          }
        }
        
        // Verificar se alguma das cores do filtro existe no availableColors
        if (availableColors && typeof availableColors === 'object') {
          for (var ci = 0; ci < filters.color.length; ci++) {
            var filterColorKey = String(filters.color[ci]);
            if (availableColors.hasOwnProperty(filterColorKey) && availableColors[filterColorKey]) {
              colorMatch = true;
              break;
            }
          }
        }
      }
      
      // Fallback: verificar d.color (string) e tags para compatibilidade
      if (!colorMatch) {
        var dc = String(d && d.color ? d.color : '');
        // Verificar tags para compatibilidade
        var tagsMatch = false;
        if (Array.isArray(d && d.tags)) {
          for (var ti = 0; ti < d.tags.length; ti++) {
            for (var cti = 0; cti < filters.color.length; cti++) {
              if (String(d.tags[ti]).toLowerCase() === String(filters.color[cti]).toLowerCase()) {
                tagsMatch = true;
                break;
              }
            }
            if (tagsMatch) break;
          }
        }
        // Verificar se d.color corresponde a alguma cor do filtro
        for (var c = 0; c < filters.color.length; c++) {
          if (dc.toLowerCase() === String(filters.color[c]).toLowerCase() || tagsMatch) {
            colorMatch = true;
            break;
          }
        }
      }
      
      if (!colorMatch) include = false;
    }

    if (include && filters && filters.mount) {
      var m = String(filters.mount);
      if (String(d && d.mount) !== m) include = false;
    }

    // Função helper para extrair altura da decoração (mesma lógica do filtro)
    var getDecorationHeight = function(decoration) {
      // Prioridade 1: Campo height direto do produto
      if (decoration && typeof decoration.height === 'number' && Number.isFinite(decoration.height)) {
        return Number(decoration.height);
      }
      
      // Prioridade 2: specs.dimensions.heightM
      try {
        var dims = decoration && decoration.specs && decoration.specs.dimensions ? decoration.specs.dimensions : null;
        if (dims && typeof dims.heightM === 'number' && Number.isFinite(dims.heightM)) {
          return Number(dims.heightM);
        }
      } catch(_) {}
      
      // Prioridade 3: Tentar extrair de specs.dimensoes (texto)
      try {
        var dimensoesText = decoration && decoration.specs && decoration.specs.dimensoes ? String(decoration.specs.dimensoes) : null;
        if (dimensoesText) {
          var regex = /([0-9]+(?:[\.,][0-9]+)?)\s*m/gi;
          var matches = [];
          var match;
          while ((match = regex.exec(dimensoesText)) !== null && matches.length < 3) {
            var num = parseFloat(String(match[1]).replace(',', '.'));
            if (!isNaN(num) && num > 0) matches.push(num);
          }
          // Assumir que a altura é o segundo valor (formato W x H x D)
          if (matches.length >= 2) {
            return matches[1];
          } else if (matches.length === 1) {
            return matches[0];
          }
        }
      } catch(_) {}
      
      return null;
    };
    
    if (include && filters && filters.heightMin) {
      var hValMin = getDecorationHeight(d);
      if (hValMin !== null && hValMin < filters.heightMin) include = false;
    }
    if (include && filters && filters.heightMax) {
      var hValMax = getDecorationHeight(d);
      if (hValMax !== null && hValMax > filters.heightMax) include = false;
    }

    // Dimensões em metros (quando existirem em d.specs.dimensions)
    if (include && filters && filters.dimKey) {
      var dims = d && d.specs && d.specs.dimensions ? d.specs.dimensions : null;
      if (dims) {
        var key = String(filters.dimKey);
        var val = dims[key];
        if (typeof val === 'number' && Array.isArray(filters.dimRange)) {
          var dmin = Number(filters.dimRange[0] || 0);
          var dmax = Number(filters.dimRange[1] || 0);
          if (val < dmin || (dmax > 0 && val > dmax)) include = false;
        }
      }
    }

    if (include) list.push(d);
  }

  return list;
}

export default filterDecorations;


