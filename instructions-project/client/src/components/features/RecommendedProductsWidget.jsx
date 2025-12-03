import React, { useEffect, useState, useCallback } from 'react';
import { Card, Button, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { productsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

// Helper function to build full image URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Ensure path starts with /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Get base URL for uploads (same logic as ProductModal and ProductMediaViewer)
  // Em desenvolvimento, usar caminhos relativos para passar pelo proxy do Vite
  // Em produção, usar /api/uploads diretamente
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
  const isProduction = !baseApi || baseApi === '';
  
  // Handle /uploads/ paths specially
  if (path.startsWith('/uploads/')) {
    // Se já começa com /api/uploads/, retornar como está
    if (path.startsWith('/api/uploads/')) return path;
    // Se começa com /uploads/, converter para /api/uploads/
    // Em desenvolvimento: usar caminho relativo para passar pelo proxy do Vite
    // Em produção: usar caminho relativo também (mesma origem)
    return '/api' + path;
  }
  
  // For other paths (like /SHOP/), use as is
  return path;
};

// Helper function to filter out temporary image URLs
// IMPORTANTE: Permitir arquivos WebP com prefixo temp_ porque são arquivos convertidos válidos
// O processImageToWebP converte para WebP mas mantém o prefixo temp_ no nome
// Exemplo: /uploads/products/temp_dayImage_1761908607230.webp é um arquivo válido
const filterTempImageUrl = (url) => {
  if (!url) return null;
  
  // Filtrar apenas arquivos temporários que NÃO são WebP
  // Estes são uploads em progresso que nunca foram convertidos
  const isWebP = url.toLowerCase().endsWith('.webp');
  const hasTemp = url.includes('temp_');
  
  if (hasTemp && !isWebP) {
    return null;
  }
  
  return url;
};

export const RecommendedProductsWidget = React.memo(() => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Use optimized trending endpoint instead of getAll
        const data = await productsAPI.getTrending();
        setProducts(data);
      } catch (error) {
        console.error("❌ Failed to fetch trending products:", error);
        // Fallback to getAll if trending endpoint fails
        try {
          // Try to fetch only trending products first
          const fallbackData = await productsAPI.getAll({ isTrending: true });
          // Filter products with night images
          const trending = fallbackData.filter(p => p.imagesNightUrl).slice(0, 5);
          setProducts(trending);
        } catch (fallbackError) {
          console.error("❌ Fallback also failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle image load - memoized to avoid recreating on each render
  const handleImageLoad = useCallback((productId) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(productId);
      return newSet;
    });
  }, []);

  // Preload all images when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      products.forEach((product) => {
        // Filtrar URLs temporárias antes de tentar preload
        const nightUrl = filterTempImageUrl(getImageUrl(product.imagesNightUrl));
        const dayUrl = filterTempImageUrl(getImageUrl(product.imagesDayUrl));
        const thumbnailUrl = filterTempImageUrl(getImageUrl(product.thumbnailUrl));
        
        const imageUrl = nightUrl || dayUrl || thumbnailUrl;
        if (imageUrl) {
          const img = new Image();
          img.onload = () => handleImageLoad(product.id);
          img.onerror = () => {
            // Se a imagem falhar ao carregar, ainda marcamos como "carregada" para não ficar no loading infinito
            handleImageLoad(product.id);
          };
          img.src = imageUrl;
        }
      });
    }
  }, [products, handleImageLoad]);

  // Preload next image for smoother transitions
  useEffect(() => {
    if (products.length > 0) {
      const nextIndex = (activeIndex + 1) % products.length;
      const nextProduct = products[nextIndex];
      if (nextProduct) {
        const nextImageUrl = getImageUrl(nextProduct.imagesNightUrl) || 
                            getImageUrl(nextProduct.imagesDayUrl) || 
                            getImageUrl(nextProduct.thumbnailUrl);
        if (nextImageUrl) {
          // Verificar se já está carregada antes de criar nova imagem
          setLoadedImages(prev => {
            if (prev.has(nextProduct.id)) return prev;
            // Criar imagem em background para preload
            const img = new Image();
            img.onload = () => handleImageLoad(nextProduct.id);
            img.src = nextImageUrl;
            return prev;
          });
        }
      }
    }
  }, [activeIndex, products, handleImageLoad]);

  // Memoize current product to avoid recalculation
  const currentProduct = React.useMemo(() => {
    return products[activeIndex];
  }, [products, activeIndex]);

  if (loading) {
    return (
      <Card className="h-full w-full bg-default-100 border-none shadow-none">
        <div className="relative h-full w-full overflow-hidden">
          <Skeleton className="rounded-lg w-full h-full" />
        </div>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-default-100 rounded-3xl text-default-400">
        No recommendations available
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden group isolate">
      {/* Swiper Slideshow */}
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        speed={800}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50 !opacity-100',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-white !w-6 transition-all duration-300'
        }}
        className="h-full w-full"
      >
        {products.map((product, index) => {
          // Filtrar URLs temporárias antes de usar
          const nightUrl = filterTempImageUrl(getImageUrl(product.imagesNightUrl));
          const dayUrl = filterTempImageUrl(getImageUrl(product.imagesDayUrl));
          const thumbnailUrl = filterTempImageUrl(getImageUrl(product.thumbnailUrl));
          
          const imageUrl = nightUrl || dayUrl || thumbnailUrl || '/demo-images/placeholder.png';
          const fallbackUrl = dayUrl || thumbnailUrl || '/demo-images/placeholder.png';
          const isImageLoaded = loadedImages.has(product.id);
          
          return (
            <SwiperSlide key={product.id} className="relative h-full w-full overflow-hidden">
              {/* Background with padding for full product visibility */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                {/* Placeholder skeleton que mantém a proporção durante o loading */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 p-8 flex items-center justify-center z-10">
                    <div className="w-full h-full bg-gradient-to-br from-default-200 to-default-300 dark:from-default-800 dark:to-default-900 rounded-lg animate-pulse" 
                         style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                {/* Imagem com transição suave */}
                <img 
                  key={`${product.id}-${index === activeIndex ? activeIndex : 'inactive'}`}
                  src={imageUrl}
                  alt={product.name}
                  onLoad={() => handleImageLoad(product.id)}
                  onError={(e) => {
                    // Prevenir loop infinito de erros
                    if (e.target.dataset.fallback === '1') {
                      e.target.src = '/demo-images/placeholder.png';
                      handleImageLoad(product.id);
                      return;
                    }
                    
                    // Tentar fallback se ainda não tentamos
                    if (e.target.src !== fallbackUrl && fallbackUrl !== imageUrl) {
                      e.target.dataset.fallback = '1';
                      e.target.src = fallbackUrl;
                    } else {
                      // Se fallback também falhou, usar placeholder
                      e.target.dataset.fallback = '1';
                      e.target.src = '/demo-images/placeholder.png';
                      handleImageLoad(product.id);
                    }
                  }}
                  className={`w-full h-full object-contain transition-opacity duration-500 ease-out ${
                    isImageLoaded ? 'opacity-100 animate-subtle-zoom' : 'opacity-0'
                  }`}
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '100%',
                    position: 'relative',
                    zIndex: isImageLoaded ? 1 : 0
                  }}
                />
              </div>
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-20" />
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Fixed Trending Badge - Top Left */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-blue-600 dark:bg-blue-500 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/30">
          Trending
        </span>
      </div>

      {/* Fixed Product Info - Bottom Left */}
      <div className="absolute bottom-6 left-6 right-6 z-20 text-white space-y-3">
        {/* Product Name - De-emphasized */}
        <p className="text-sm text-white/60 font-medium">{currentProduct.name}</p>
        
        {/* Pricing - Prominent */}
        <div className="space-y-2">
          {/* Sale Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              €{currentProduct.price?.toLocaleString() || 'N/A'}
            </span>
            {currentProduct.oldPrice && (
              <span className="text-lg text-white/50 line-through">
                €{currentProduct.oldPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Rental Prices */}
          <div className="flex gap-4 text-sm">
            {currentProduct.rentalPrice && (
              <div className="flex items-center gap-1.5">
                <Icon icon="lucide:calendar" className="w-4 h-4 text-primary-300" />
                <span className="text-white/80">Rent: €{currentProduct.rentalPrice}/day</span>
              </div>
            )}
          </div>

          {/* Stock Info */}
          {currentProduct.stock !== undefined && (
            <div className="flex items-center gap-1.5 text-sm">
              <Icon icon="lucide:package" className="w-4 h-4 text-primary-300" />
              <span className="text-white/80">
                {currentProduct.stock > 0 
                  ? `${currentProduct.stock} in stock` 
                  : 'Out of stock'}
              </span>
            </div>
          )}
        </div>

        {/* View Product Button - Fixed Position */}
        <Button
          size="sm"
          className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 group/btn mt-3"
          endContent={<Icon icon="lucide:arrow-right" className="group-hover/btn:translate-x-1 transition-transform" />}
          onPress={() => navigate(`/stock-catalogue?product=${currentProduct.id}`)}
        >
          View Product
        </Button>
      </div>
      
      {/* Custom Pagination Styles */}
      <style>{`
        .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 3px;
          background: white;
        }
        .swiper-horizontal > .swiper-pagination-bullets, .swiper-pagination-bullets.swiper-pagination-horizontal {
          bottom: 24px;
          left: auto;
          right: 24px;
          width: auto;
        }
      `}</style>
    </div>
  );
});
