import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useProductFeed } from '../hooks/useProductFeed';
import ProductFeedCard from '../components/shop/ProductFeedCard';
import { Spinner, Button, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';

/**
 * Página de feed de produtos estilo TikTok
 * Mostra produtos em scroll vertical com vídeos priorizados
 */
const navigationItems = [
  { name: "Dashboard", icon: "lucide:layout-dashboard", href: "/" },
  { name: "Statistics", icon: "lucide:bar-chart", href: "/statistics" },
  { name: "Shop", icon: "lucide:shopping-bag", href: "/shop" },
  { name: "Feed", icon: "lucide:video", href: "/feed" },
  { name: "Projects", icon: "lucide:folder", href: "/projects" },
  { name: "Admin Products", icon: "lucide:package", href: "/admin/products" },
];

export default function ProductFeed() {
  const { products, loading, error } = useProductFeed();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    <div className="w-full h-screen overflow-hidden bg-black relative">
      {/* Botão Hambúrguer - Fixo no canto superior esquerdo */}
      <Button
        isIconOnly
        radius="full"
        className="fixed top-4 left-4 z-50 bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 shadow-lg"
        size="lg"
        onPress={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <Icon 
          icon={isMenuOpen ? "lucide:x" : "lucide:menu"} 
          className="text-2xl"
        />
      </Button>

      {/* Overlay escuro quando menu aberto */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar de navegação */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-20 bg-black/95 backdrop-blur-md border-r border-white/10 z-50 flex flex-col items-center py-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="mb-8">
              <img
                src="/light.svg"
                alt="Logo"
                className="block dark:hidden w-12 h-12"
              />
              <img
                src="/dark.svg"
                alt="Logo"
                className="hidden dark:block w-12 h-12"
              />
            </div>

            {/* Ícones de navegação */}
            <div className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-4">
                {navigationItems.map((item) => (
                  <Tooltip
                    key={item.name}
                    content={item.name}
                    placement="right"
                    showArrow
                    color="default"
                    delay={300}
                  >
                    <NavLink
                      to={item.href}
                      aria-label={item.name}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) =>
                        `w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-all ` +
                        (isActive
                          ? `bg-primary/50 hover:bg-primary/60`
                          : `bg-white/10 hover:bg-white/20`)
                      }
                    >
                      {({ isActive }) => (
                        <Icon
                          icon={item.icon}
                          className={`${isActive ? "text-white" : "text-gray-400"} text-xl`}
                        />
                      )}
                    </NavLink>
                  </Tooltip>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo do feed */}
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

