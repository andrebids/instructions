import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { transformApiProduct } from '../utils/productUtils';

/**
 * Hook para buscar e ordenar produtos para o feed estilo TikTok
 * Prioriza produtos com vídeos (animationUrl/videoFile)
 */
export function useProductFeed() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Buscar produtos ativos da API
        const apiProducts = await productsAPI.getAll({ isActive: true });

        if (!Array.isArray(apiProducts)) {
          throw new Error('API retornou dados inválidos');
        }

        // Transformar produtos para formato esperado
        const transformed = apiProducts
          .map(transformApiProduct)
          .filter(Boolean); // Remove nulls

        // Ordenar: produtos com vídeo primeiro, depois os outros
        // Dentro de cada grupo, ordenar por relevância (trending, new, etc.)
        const sorted = transformed.sort((a, b) => {
          // Verificar se tem vídeo (videoFile ou animationUrl)
          const aHasVideo = Boolean(a.videoFile || a.images?.video);
          const bHasVideo = Boolean(b.videoFile || b.images?.video);

          // Prioridade 1: Produtos com vídeo primeiro
          if (aHasVideo && !bHasVideo) return -1;
          if (!aHasVideo && bHasVideo) return 1;

          // Prioridade 2: Dentro do mesmo grupo, ordenar por relevância
          // Trending > New > Sale > outros
          const aIsTrending = a.isTrending || (Array.isArray(a.tags) && a.tags.some(tag => String(tag).toLowerCase() === 'trending'));
          const bIsTrending = b.isTrending || (Array.isArray(b.tags) && b.tags.some(tag => String(tag).toLowerCase() === 'trending'));

          if (aIsTrending && !bIsTrending) return -1;
          if (!aIsTrending && bIsTrending) return 1;

          const aIsNew = Array.isArray(a.tags) && a.tags.some(tag => String(tag).toLowerCase() === 'new');
          const bIsNew = Array.isArray(b.tags) && b.tags.some(tag => String(tag).toLowerCase() === 'new');

          if (aIsNew && !bIsNew) return -1;
          if (!aIsNew && bIsNew) return 1;

          const aIsSale = a.isOnSale || (Array.isArray(a.tags) && a.tags.some(tag => String(tag).toLowerCase() === 'sale'));
          const bIsSale = b.isOnSale || (Array.isArray(b.tags) && b.tags.some(tag => String(tag).toLowerCase() === 'sale'));

          if (aIsSale && !bIsSale) return -1;
          if (!aIsSale && bIsSale) return 1;

          // Por último, ordenar por nome
          return (a.name || '').localeCompare(b.name || '');
        });

        setProducts(sorted);
        console.log('✅ [useProductFeed] Produtos carregados:', {
          total: sorted.length,
          withVideo: sorted.filter(p => p.videoFile || p.images?.video).length,
          withoutVideo: sorted.filter(p => !p.videoFile && !p.images?.video).length,
        });
      } catch (err) {
        console.error('❌ [useProductFeed] Erro ao buscar produtos:', err);
        setError(err.message || 'Erro ao carregar produtos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading, error };
}

