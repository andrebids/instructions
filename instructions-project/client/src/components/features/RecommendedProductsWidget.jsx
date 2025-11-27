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
  
  // In development, use relative path (goes through Vite proxy to avoid CORS)
  // In production, prepend the current origin
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // Relative path - Vite will proxy to backend
    return path;
  } else {
    // Production - use full URL with current origin
    return `${window.location.origin}${path}`;
  }
};

export const RecommendedProductsWidget = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsAPI.getAll();
        
        // Prefer products with Night Images (using correct field name: imagesNightUrl)
        let trending = data.filter(p => p.imagesNightUrl).slice(0, 5);
        
        // Fallback: if no night images, use products with day images or thumbnails
        if (trending.length === 0) {
          trending = data.filter(p => p.imagesDayUrl || p.thumbnailUrl).slice(0, 5);
        }
        
        setProducts(trending);
      } catch (error) {
        console.error("❌ Failed to fetch recommended products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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

  const currentProduct = products[activeIndex];

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
        {products.map((product) => (
          <SwiperSlide key={product.id} className="relative h-full w-full overflow-hidden">
            {/* Background with padding for full product visibility */}
            <div className="absolute inset-0 p-8 flex items-center justify-center">
              <img 
                src={
                  getImageUrl(product.imagesNightUrl) || 
                  getImageUrl(product.imagesDayUrl) || 
                  getImageUrl(product.thumbnailUrl) || 
                  'https://placehold.co/600x400?text=Product'
                } 
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-500 ease-out scale-100 group-hover:scale-105"
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
          onPress={() => navigate(`/shop/product/${currentProduct.id}`)}
        >
          View Product
        </Button>
      </div>
      
      {/* Custom Pagination Styles */}
      <style jsx global>{`
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
};
