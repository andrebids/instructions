import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import { transformApiProduct } from '../utils/productUtils';
import { compareProductsByTagHierarchy } from '../utils/tagHierarchy';

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

        const sorted = transformed.sort((a, b) => {
          const hierarchyComparison = compareProductsByTagHierarchy(a, b);
          if (hierarchyComparison !== 0) return hierarchyComparison;

          const aHasVideo = Boolean(a.videoFile || a.images?.video);
          const bHasVideo = Boolean(b.videoFile || b.images?.video);
          if (aHasVideo !== bHasVideo) {
            return aHasVideo ? -1 : 1;
          }

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

