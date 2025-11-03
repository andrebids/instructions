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
        console.log('[LIB] fetch categories');
        var serverCategories = [];
        // Mapa de exibição EN para mounts conhecidos
        var mountNameMap = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };
        try {
          serverCategories = await decorationsAPI.getCategories();
        } catch (eCat) {
          console.warn('[LIB] categories via decorations failed, will derive from products');
        }

        if (serverCategories && serverCategories.length > 0) {
          // Manter o nome exatamente como na loja
          var normalized = [];
          for (var i = 0; i < serverCategories.length; i++) {
            var id = serverCategories[i];
            var display = mountNameMap[id] || id;
            normalized.push({ id: id, name: display });
          }
          setCategories(normalized);
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
        console.log('[LIB] fetch', { page });
        var data = null;
        try {
          data = await decorationsAPI.getAll({ page: page, limit: 24 });
        } catch (e1) {
          console.warn('[LIB] decorations fetch failed, trying productsAPI');
        }
        var list = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

        // Fallback: se não vier nada de /decorations, buscar /products
        if (list.length === 0) {
          console.log('[LIB] fallback to productsAPI.getAll');
          var products = [];
          try {
            products = await productsAPI.getAll({ isActive: true });
          } catch (e2) {
            console.error('[LIB] productsAPI.getAll error', e2 && e2.message);
          }
          list = products;

          // Derivar categorias a partir de mount/type
          var mountNameMap = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };
          var catMap = {};
          for (var ci = 0; ci < products.length; ci++) {
            var p = products[ci];
            var catRaw = (p && p.mount) ? String(p.mount) : (p && p.type) ? String(p.type) : 'custom';
            if (!catMap[catRaw]) {
              var display = mountNameMap[catRaw] || catRaw;
              catMap[catRaw] = { id: catRaw, name: display };
            }
          }
          var derived = [];
          for (var key in catMap) {
            if (catMap.hasOwnProperty(key)) derived.push(catMap[key]);
          }
          if (derived.length > 0) setCategories(derived);
        }

        // Mapear campos para o frontend
        var mapped = [];
        for (var i = 0; i < list.length; i++) {
          var it = list[i];
          // Usar SEMPRE o mount como categoria principal
          var catRaw = it.mount || it.category || it.type || 'custom';
          var cat = typeof catRaw === 'string' ? catRaw : 'custom';
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
            // Backend usa thumbnailUrl/thumbnailNightUrl
            imageUrlDay: it.thumbnailUrl || it.imagesDayUrl || null,
            imageUrlNight: it.thumbnailNightUrl || it.imagesNightUrl || null,
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
          });
        }

        console.log('[LIB] results', mapped.length);

        if (!cancelled) {
          // Construir estatísticas por categoria + escolher thumbnail aleatória (preferir versão Night) por categoria (reservoir sampling)
          var catStats = {};
          for (var j = 0; j < mapped.length; j++) {
            var item = mapped[j];
            var catId = item.category;
            if (!catStats[catId]) {
              catStats[catId] = { count: 0, thumbDay: null, thumbNight: null };
            }
            catStats[catId].count += 1;
            // Reservoir sampling para escolher item aleatório uniformemente
            var k = catStats[catId].count;
            if (Math.floor(Math.random() * k) === 0) {
              catStats[catId].thumbDay = item.imageUrlDay || item.thumbnailUrl || null;
              catStats[catId].thumbNight = item.imageUrlNight || item.thumbnailUrl || item.imageUrlDay || null;
            }
          }

          // Gerar lista de categorias com thumbnail e count
          var mountNameMap2 = { 'Poste': 'Pole', 'Chão': 'Floor', 'Transversal': 'Transversal' };
          var finalCategories = [];
          for (var catKey in catStats) {
            if (!catStats.hasOwnProperty(catKey)) continue;
            var displayName = catKey;
            if (mountNameMap2[catKey]) displayName = mountNameMap2[catKey];
            var chosenNight = catStats[catKey].thumbNight || catStats[catKey].thumbDay;
            var chosenDay = catStats[catKey].thumbDay || catStats[catKey].thumbNight;
            finalCategories.push({ id: catKey, name: displayName, count: catStats[catKey].count, thumbnail: chosenDay, thumbnailNight: chosenNight });
          }

          if (finalCategories.length > 0) {
            setCategories(finalCategories);
          }

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
