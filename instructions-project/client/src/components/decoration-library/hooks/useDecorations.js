import { useState, useEffect, useRef } from 'react';
import { decorationsAPI, productsAPI } from '../../../services/api';

export const useDecorations = (initialFilters) => {
  const [decorations, setDecorations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debounceTimer = useRef(null);

  useEffect(() => {
    async function loadInitial() {
      try {
        var serverCategories = [];
        // Mapa de exibição EN para mounts conhecidos
        var mountNameMap = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };
        
        // Buscar categorias diretamente da loja (produtos)
        try {
          serverCategories = await productsAPI.getCategories();
        } catch (eCat) {
          console.warn('[LIB] categories via products failed, trying decorations API as fallback');
          try {
            // Fallback: tentar decorations API
            var decorationsCategories = await decorationsAPI.getCategories();
            if (Array.isArray(decorationsCategories)) {
              // Converter formato de decorations para formato esperado
              var normalized = [];
              for (var i = 0; i < decorationsCategories.length; i++) {
                var id = decorationsCategories[i];
                var display = mountNameMap[id] || id;
                normalized.push({ id: id, name: display });
              }
              serverCategories = normalized;
            }
          } catch (eDec) {
            console.warn('[LIB] categories via decorations also failed:', eDec);
          }
        }

        if (serverCategories && serverCategories.length > 0) {
          // Se já vem no formato correto { id, name }, usar diretamente
          // Caso contrário, normalizar
          if (serverCategories[0] && typeof serverCategories[0] === 'object' && serverCategories[0].id) {
            setCategories(serverCategories);
          } else {
            // Normalizar formato antigo
            var normalized = [];
            for (var j = 0; j < serverCategories.length; j++) {
              var catId = typeof serverCategories[j] === 'object' ? serverCategories[j].id : serverCategories[j];
              var catName = typeof serverCategories[j] === 'object' ? serverCategories[j].name : (mountNameMap[catId] || catId);
              normalized.push({ id: catId, name: catName });
            }
            setCategories(normalized);
          }
        }
      } catch (e) {
        console.warn('[LIB] categories error', e && e.message);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDecorations() {
      try {
        setIsLoading(true);
        var list = [];
        
        // Buscar produtos diretamente da loja
        try {
          var products = await productsAPI.getAll({ isActive: true });
          list = Array.isArray(products) ? products : [];
        } catch (e1) {
          console.warn('[LIB] productsAPI.getAll failed, trying decorationsAPI as fallback');
          try {
            // Fallback: tentar decorations API
            var data = await decorationsAPI.getAll({ page: page, limit: 24 });
            list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
          } catch (e2) {
            console.error('[LIB] decorationsAPI.getAll also failed:', e2 && e2.message);
            list = [];
          }
        }

        // Se não encontrou produtos e categorias ainda não foram carregadas, derivar categorias
        if (list.length > 0 && categories.length === 0) {
          var mountNameMap = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };
          var catMap = {};
          for (var ci = 0; ci < list.length; ci++) {
            var p = list[ci];
            var catRaw = (p && p.mount) ? String(p.mount) : (p && p.type) ? String(p.type) : 'custom';
            if (catRaw && catRaw !== 'custom' && !catMap[catRaw]) {
              var display = mountNameMap[catRaw] || catRaw;
              catMap[catRaw] = { id: catRaw, name: display };
            }
          }
          var derived = [];
          for (var key in catMap) {
            if (catMap.hasOwnProperty(key)) derived.push(catMap[key]);
          }
          if (derived.length > 0) {
            setCategories(derived);
          }
        }

        // Mapear campos para o frontend
        var mapped = [];
        for (var i = 0; i < list.length; i++) {
          var it = list[i];
          // Usar SEMPRE o mount como categoria principal
          var catRaw = it.mount || it.category || it.type || 'custom';
          var cat = typeof catRaw === 'string' ? catRaw : 'custom';
          
          // Verificar se é produto de summer (season ou tag)
          var isSummer = false;
          if (it.season && String(it.season).toLowerCase() === 'summer') {
            isSummer = true;
          } else if (Array.isArray(it.tags)) {
            for (var t = 0; t < it.tags.length; t++) {
              if (String(it.tags[t]).toLowerCase() === 'summer') {
                isSummer = true;
                break;
              }
            }
          }
          
          // Placeholders para stock/cor/dimensões
          var stockVal = typeof it.stock === 'number' ? it.stock : (function(){
            try { var s=0; var sid=String(it.id||''); for (var ii=0; ii<sid.length; ii++) s+=sid.charCodeAt(ii); return 5 + (s % 60); } catch(_){ return 20; }
          })();
          var colorVal = it.color || (Array.isArray(it.tags) && it.tags.length ? it.tags[0] : '');
          var specsVal = it.specs || { dimensions: {} };
          mapped.push({
            id: it.id,
            name: it.name,
            ref: it.sku || it.id,
            category: cat,
            icon: '✨',
            // Backend usa imagesDayUrl/imagesNightUrl (thumbnailUrl é apenas para listagem, pode não ter versão noite)
            imageUrlDay: it.imagesDayUrl || it.thumbnailUrl || null,
            imageUrlNight: it.imagesNightUrl || it.imagesDayUrl || it.thumbnailUrl || null,
            thumbnailUrl: it.thumbnailUrl || it.imagesDayUrl || null,
            width: typeof it.width === 'number' ? it.width : null,
            height: typeof it.height === 'number' ? Number(it.height) : null, // Garantir que é número
            price: typeof it.price === 'number' ? it.price : null,
            stock: stockVal,
            color: colorVal,
            specs: specsVal,
            // Incluir availableColors para filtragem de cores funcionar corretamente
            availableColors: it.availableColors || null,
            tags: it.tags || [],
            isSummer: isSummer, // Marcar produtos de summer
          });
        }

        console.log('[LIB] results', mapped.length);
        
        // Debug: verificar produtos Transversal antes do processamento
        var transversalProducts = list.filter(function(p) {
          var mount = p.mount || p.category || p.type || '';
          return String(mount).toLowerCase() === 'transversal';
        });
        if (transversalProducts.length > 0) {
          console.log('[LIB] 🔍 [DEBUG TRANSVERSAL] Produtos encontrados antes do mapeamento:', transversalProducts.map(function(p) {
            return {
              id: p.id,
              name: p.name,
              mount: p.mount,
              thumbnailUrl: p.thumbnailUrl,
              imagesDayUrl: p.imagesDayUrl,
              imagesNightUrl: p.imagesNightUrl
            };
          }));
        }

        if (!cancelled) {
          // Construir estatísticas por categoria + escolher thumbnail
          var catStats = {};
          for (var j = 0; j < mapped.length; j++) {
            var item = mapped[j];
            var catId = item.category;
            if (!catStats[catId]) {
              catStats[catId] = { count: 0, thumbDay: null, thumbNight: null, hasSummerProducts: false };
            }
            catStats[catId].count += 1;
            
            // Marcar se categoria tem produtos de summer
            if (item.isSummer) {
              catStats[catId].hasSummerProducts = true;
            }
            
            // Escolher primeira thumbnail válida encontrada (garantir que sempre temos uma se disponível)
            var itemThumbDay = item.imageUrlDay || item.thumbnailUrl || null;
            var itemThumbNight = item.imageUrlNight || item.thumbnailUrl || item.imageUrlDay || null;
            
            // Se ainda não temos thumbnail day e este item tem uma, usar
            if (!catStats[catId].thumbDay && itemThumbDay) {
              catStats[catId].thumbDay = itemThumbDay;
            }
            
            // Se ainda não temos thumbnail night e este item tem uma, usar (preferir night, exceto para summer)
            // Para summer, sempre usar day, então não precisamos da night
            if (!catStats[catId].hasSummerProducts && !catStats[catId].thumbNight && itemThumbNight) {
              catStats[catId].thumbNight = itemThumbNight;
            }
          }

          // Gerar lista de categorias com thumbnail e count
          // Fazer merge com categorias existentes para preservar informações
          var mountNameMap2 = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };
          
          // Usar setCategories com função para acessar estado atual sem dependência
          setCategories(function(prevCategories) {
            var categoriesMap = {};
            
            // Primeiro, adicionar categorias existentes ao mapa
            for (var ex = 0; ex < prevCategories.length; ex++) {
              var existingCat = prevCategories[ex];
              categoriesMap[existingCat.id] = Object.assign({}, existingCat);
            }
            
            // Depois, atualizar ou adicionar categorias com stats e thumbnails
            for (var catKey in catStats) {
              if (!catStats.hasOwnProperty(catKey)) continue;
              var displayName = catKey;
              if (mountNameMap2[catKey]) displayName = mountNameMap2[catKey];
              
              var catStat = catStats[catKey];
              var isSummerCategory = catStat.hasSummerProducts;
              
              // Para categorias de summer: sempre usar versão dia
              // Para outras categorias: preferir versão noite, com fallback para dia
              var chosenThumbnail, chosenThumbnailNight;
              
              if (isSummerCategory) {
                // Summer: sempre usar versão dia (não usar noite)
                chosenThumbnail = catStat.thumbDay || null;
                chosenThumbnailNight = null; // Summer não usa versão noite
              } else {
                // Outras categorias: preferir versão noite por padrão (como default), fallback para dia
                // thumbnailNight será usado como padrão pelo CategoryMenu
                // thumbnail será usado como fallback se thumbnailNight não existir
                chosenThumbnailNight = catStat.thumbNight || catStat.thumbDay || null; // Versão noite (preferida), com fallback para dia
                chosenThumbnail = catStat.thumbDay || null; // Versão dia (fallback)
              }
              
              // Se categoria já existe, atualizar com thumbnails e count
              if (categoriesMap[catKey]) {
                categoriesMap[catKey].count = catStat.count;
                // Atualizar thumbnails sempre que encontrarmos uma válida (não apenas se não tiver)
                if (chosenThumbnail) {
                  categoriesMap[catKey].thumbnail = chosenThumbnail;
                }
                if (chosenThumbnailNight) {
                  categoriesMap[catKey].thumbnailNight = chosenThumbnailNight;
                }
                // Se for summer e tinha thumbnailNight, remover
                if (isSummerCategory && categoriesMap[catKey].thumbnailNight) {
                  categoriesMap[catKey].thumbnailNight = null;
                }
              } else {
                // Nova categoria - adicionar completa
                categoriesMap[catKey] = { 
                  id: catKey, 
                  name: displayName, 
                  count: catStat.count, 
                  thumbnail: chosenThumbnail, 
                  thumbnailNight: chosenThumbnailNight 
                };
              }
            }
            
            // Converter mapa de volta para array
            var finalCategories = [];
            for (var mapKey in categoriesMap) {
              if (categoriesMap.hasOwnProperty(mapKey)) {
                finalCategories.push(categoriesMap[mapKey]);
              }
            }
            
            // Ordenar por nome para consistência
            var finalCategories = Object.values(categoriesMap);
            finalCategories.sort(function(a, b) {
              return a.name.localeCompare(b.name);
            });
            
            return finalCategories;
          });

          setDecorations(mapped);
          setHasMore(Boolean(data && typeof data.total === 'number' ? (page * 24) < data.total : mapped.length === 24));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[LIB] fetch error', err && err.message);
          setDecorations([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    // Debounce somente para paginação
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(function(){ loadDecorations(); }, 100);
    return () => { cancelled = true; };
  }, [page]);

  const filterByCategory = (categoryId) => {
    if (!categoryId) return decorations;
    return decorations.filter(function(d){ return d.category === categoryId; });
  };

  const getCategoryById = (categoryId) => {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === categoryId) return categories[i];
    }
    return undefined;
  };

  const getDecorationById = (decorationId) => {
    for (var i = 0; i < decorations.length; i++) {
      if (decorations[i].id === decorationId) return decorations[i];
    }
    return undefined;
  };

  return {
    decorations,
    categories,
    isLoading,
    hasMore,
    setPage,
    filterByCategory,
    getCategoryById,
    getDecorationById
  };
};
