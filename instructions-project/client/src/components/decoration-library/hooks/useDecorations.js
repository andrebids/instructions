import { useState, useEffect } from 'react';
import { decorationsAPI, productsAPI } from '../../../services/api';

export const useDecorations = () => {
  const [decorations, setDecorations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function loadInitial() {
      try {
        console.log('[LIB] fetch categories');
        var serverCategories = [];
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
            normalized.push({ id: id, name: id });
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
          data = await decorationsAPI.getAll({ page, limit: 24 });
        } catch (e1) {
          console.warn('[LIB] decorationsAPI.getAll failed, trying productsAPI');
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
          var catMap = {};
          for (var ci = 0; ci < products.length; ci++) {
            var p = products[ci];
            var catRaw = (p && p.mount) ? String(p.mount) : (p && p.type) ? String(p.type) : 'custom';
            if (!catMap[catRaw]) catMap[catRaw] = { id: catRaw, name: catRaw };
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
          var catRaw = it.category || it.mount || it.type || 'custom';
          var cat = typeof catRaw === 'string' ? catRaw : 'custom';
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
            width: it.width,
            height: it.height,
          });
        }

        console.log('[LIB] results', mapped.length);

        if (!cancelled) {
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

    loadDecorations();
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
