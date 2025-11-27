import React, { useEffect, useState } from 'react';
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

export const RecommendedProductsWidget = React.memo(() => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
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
          const img = new Image();
          img.src = nextImageUrl;
        }
      }
    }
  }, [activeIndex, products]);

  // Memoize current product to avoid recalculation
  const currentProduct = React.useMemo(() => {
    return products[activeIndex];
  }, [products, activeIndex]);

  if (loading) {
    return (
      <Card className="h-full w-full bg-default-100 border-none shadow-none">
        <Skeleton className="rounded-lg w-full h-full" />
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
        {products.map((product, index) => (
          <SwiperSlide key={product.id} className="relative h-full w-full overflow-hidden">
            {/* Background with padding for full product visibility */}
            <div className="absolute inset-0 p-8 flex items-center justify-center">
              <img 
                key={`${product.id}-${index === activeIndex ? activeIndex : 'inactive'}`}
                src={
                  getImageUrl(product.imagesNightUrl) || 
                  getImageUrl(product.imagesDayUrl) || 
                  getImageUrl(product.thumbnailUrl) || 
                  'https://placehold.co/600x400?text=Product'
                } 
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-500 ease-out animate-subtle-zoom"
              />
            </div>
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Fixed Trending Badge - Top Left */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/30">
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
