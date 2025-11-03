import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProductFeed } from '../hooks/useProductFeed';
import ProductFeedCard from '../components/shop/ProductFeedCard';
import { Spinner } from '@heroui/react';

/**
 * Página de feed de produtos estilo TikTok
 * Mostra produtos em scroll vertical com vídeos priorizados
 */
export default function ProductFeed() {
  const { products, loading, error } = useProductFeed();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef({});

  // Callback para IntersectionObserver
  const handleIntersection = useCallback((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // Encontrar o índice do produto baseado no elemento
        const productId = entry.target.getAttribute('data-product-id');
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
          setActiveIndex(index);
        }
      }
    });
  }, [products]);

  // Configurar IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '0px',
      threshold: [0.5, 0.75, 1.0], // Ativar quando 50%+ visível
    });

    // Observar todos os cards
    Object.values(cardRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, products.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Erro ao carregar produtos</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <p className="text-xl">Nenhum produto encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-black">
      <div className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            ref={(el) => {
              if (el) cardRefs.current[product.id] = el;
            }}
            data-product-id={product.id}
            className="snap-start"
            initial={{ opacity: 0 }}
            whileInView={{ 
              opacity: 1,
              transition: {
                duration: 0.4,
                ease: "easeOut"
              }
            }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <ProductFeedCard
              product={product}
              isActive={index === activeIndex}
              onPlay={() => setActiveIndex(index)}
              onPause={() => setActiveIndex(-1)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

