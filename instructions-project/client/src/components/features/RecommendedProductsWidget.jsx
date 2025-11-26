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

export const RecommendedProductsWidget = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productsAPI.getAll();
        console.log('🔍 [RecommendedProducts] Total products:', data.length);
        console.log('🔍 [RecommendedProducts] Sample product:', data[0]);
        
        // Prefer products with Night Images (using correct field name: imagesNightUrl)
        let trending = data.filter(p => p.imagesNightUrl).slice(0, 5);
        console.log('🔍 [RecommendedProducts] Products with imagesNightUrl:', trending.length);
        
        // Fallback: if no night images, use products with day images or thumbnails
        if (trending.length === 0) {
          trending = data.filter(p => p.imagesDayUrl || p.thumbnailUrl).slice(0, 5);
          console.log('🔍 [RecommendedProducts] Fallback products:', trending.length);
        }
        
        console.log('🔍 [RecommendedProducts] Final products to display:', trending);
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

  return (
    <div className="relative h-full w-full overflow-hidden group isolate">
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        speed={800}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50 !opacity-100',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-white !w-6 transition-all duration-300'
        }}
        className="h-full w-full"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id} className="relative h-full w-full overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src={product.imagesNightUrl || product.imagesDayUrl || product.thumbnailUrl || 'https://placehold.co/600x400?text=Product'} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-[10000ms] ease-linear scale-100 group-hover:scale-110 transform-gpu"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
              <div>
                {/* Badge */}
                <div className="mb-3">
                  <span className="px-3 py-1 rounded-full bg-primary/80 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20">
                    Trending
                  </span>
                </div>

                {/* Title & Price */}
                <h3 className="text-2xl font-bold mb-1 leading-tight">{product.name}</h3>
                <p className="text-lg font-medium text-primary-300 mb-4">
                  {product.price ? `€ ${product.price.toLocaleString()}` : 'Contact for price'}
                </p>

                {/* Action Button */}
                <Button
                  size="sm"
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium hover:bg-white/20 transition-all duration-300 group/btn"
                  endContent={<Icon icon="lucide:arrow-right" className="group-hover/btn:translate-x-1 transition-transform" />}
                  onPress={() => navigate(`/shop/product/${product.id}`)}
                >
                  View Product
                </Button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* Custom Pagination Styles Override */}
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
