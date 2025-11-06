import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useProductFeed } from '../hooks/useProductFeed';
import ProductFeedCard from '../components/shop/ProductFeedCard';
import { Spinner, Button, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useShop } from '../context/ShopContext';

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
  const { products: allProducts, loading, error } = useProductFeed();
  const { getBaseStock, getAvailableStock } = useShop();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSnowEnabled, setIsSnowEnabled] = useState(true);
  const [productAnimationStates, setProductAnimationStates] = useState({}); // Estado para guardar se cada produto deve iniciar em modo simulação animada
  const [originalProductId, setOriginalProductId] = useState(null); // ID do produto original quando navega em modo simulação animada
  const cardRefs = useRef({});
  const scrollContainerRef = useRef(null);

  // Filtrar apenas produtos com stock disponível e ordenar por stock total (base) decrescente
  const products = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    
    return allProducts
      .filter(product => {
        const availableStock = getAvailableStock?.(product) ?? 0;
        return availableStock > 0; // Filtrar por stock disponível (para não mostrar produtos sem stock)
      })
      .sort((a, b) => {
        const stockA = getBaseStock?.(a) ?? 0; // Ordenar por stock total (base)
        const stockB = getBaseStock?.(b) ?? 0;
        return stockB - stockA; // Ordem decrescente
      });
  }, [allProducts, getBaseStock, getAvailableStock]);

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

  // Função para navegar para um produto específico - substitui no mesmo lugar sem scroll
  const navigateToProduct = useCallback((productId, startWithAnimation = false, fromProductId = null) => {
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      // Guardar o estado de simulação animada para este produto
      if (startWithAnimation !== undefined) {
        setProductAnimationStates(prev => ({
          ...prev,
          [productId]: startWithAnimation
        }));
      }
      
      // Se está navegando em modo simulação animada e veio de outro produto, guardar o produto original
      if (startWithAnimation && fromProductId && fromProductId !== productId) {
        setOriginalProductId(fromProductId);
      }
      
      // Atualizar o índice ativo
      setActiveIndex(index);
      
      // Fazer scroll instantâneo apenas se o produto não estiver visível
      // Remover temporariamente scroll-smooth para evitar animação
      setTimeout(() => {
        const cardElement = cardRefs.current[productId];
        const container = scrollContainerRef.current;
        
        if (cardElement && container) {
          // Verificar se o produto já está visível na viewport
          const rect = cardElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
          
          // Apenas fazer scroll se o produto não estiver visível
          if (!isVisible) {
            // Remover classe scroll-smooth temporariamente
            container.classList.remove('scroll-smooth');
            
            // Calcular a posição exata do elemento
            const elementTop = cardElement.offsetTop;
            
            // Usar scrollTop diretamente - é instantâneo, sem animação
            container.scrollTop = elementTop;
            
            // Restaurar scroll-smooth após um pequeno delay
            setTimeout(() => {
              container.classList.add('scroll-smooth');
            }, 10);
          }
        }
      }, 50); // Pequeno delay para garantir que o modal seja fechado
    }
  }, [products, activeIndex, originalProductId]);

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
        {/* Vídeo de fundo em loop */}
        {isSnowEnabled && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="fixed inset-0 w-full h-full object-cover z-30 opacity-20"
            style={{ pointerEvents: 'none' }}
          >
            <source src="/snooooow.webm" type="video/webm" />
          </video>
        )}

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

        {/* Container para botões do lado esquerdo - mantém posição relativa em qualquer resolução */}
        <div className="fixed left-4 top-20 z-50 flex flex-col gap-4">
          {/* Botão para desligar/ligar efeito da neve */}
          <Tooltip content={isSnowEnabled ? "Desligar neve" : "Ligar neve"} placement="right">
            <Button
              isIconOnly
              radius="full"
              className={`backdrop-blur-md text-white border border-white/20 shadow-lg ${
                  isSnowEnabled 
                    ? 'bg-blue-400/60 hover:bg-blue-400/80' 
                    : 'bg-black/60 hover:bg-black/80'
                }`}
                size="lg"
                onPress={() => setIsSnowEnabled(!isSnowEnabled)}
                aria-label={isSnowEnabled ? "Desligar neve" : "Ligar neve"}
              >
                <Icon 
                  icon="lucide:snowflake" 
                  className="text-2xl"
                />
              </Button>
            </Tooltip>

          {/* Botão de simulação animada - aparece se o produto tiver animationSimulationUrl */}
          {(() => {
            const activeProduct = products[activeIndex];
            // Verificar se o produto tem animationSimulationUrl
            const hasAnimationSimulation = Boolean(activeProduct?.animationSimulationUrl);
            const isAnimationMode = productAnimationStates[activeProduct?.id] || false;
            
            if (hasAnimationSimulation) {
              return (
                <Tooltip 
                  content={isAnimationMode ? "Ver vídeo normal" : "Ver simulação animada"} 
                  placement="right"
                >
                  <Button
                    isIconOnly
                    radius="full"
                    className={`backdrop-blur-md text-white border border-white/20 shadow-lg ${
                      isAnimationMode 
                        ? 'bg-blue-400/60 hover:bg-blue-400/80' 
                        : 'bg-black/60 hover:bg-black/80'
                    }`}
                    size="lg"
                    onPress={() => {
                      if (activeProduct?.id) {
                        setProductAnimationStates(prev => ({
                          ...prev,
                          [activeProduct.id]: !isAnimationMode
                        }));
                        // Limpar originalProductId se estiver voltando ao vídeo normal
                        if (isAnimationMode) {
                          setOriginalProductId(null);
                        }
                      }
                    }}
                    aria-label={isAnimationMode ? "Ver vídeo normal" : "Ver simulação animada"}
                  >
                    <Icon 
                      icon="lucide:film" 
                      className="text-2xl"
                    />
                  </Button>
                </Tooltip>
              );
            }
            return null;
          })()}
        </div>

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
      <div ref={scrollContainerRef} className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth relative z-20">
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
              onProductSelect={navigateToProduct}
              initialAnimationSimulation={productAnimationStates[product.id] || false}
              onAnimationSimulationChange={(newState) => {
                // Atualizar o estado quando o botão dentro do ProductFeedCard for clicado
                setProductAnimationStates(prev => ({
                  ...prev,
                  [product.id]: newState
                }));
              }}
              originalProductId={originalProductId}
              onResetOriginalProduct={() => {
                if (originalProductId) {
                  navigateToProduct(originalProductId, true);
                  // Limpar o originalProductId após navegar
                  setTimeout(() => {
                    setOriginalProductId(null);
                  }, 100);
                }
              }}
              onClearOriginalProduct={() => {
                const currentProductId = product.id;
                console.log('🧹 [ProductFeed] onClearOriginalProduct chamado para produto:', currentProductId);
                
                // Limpar o estado de simulação animada para este produto PRIMEIRO
                if (currentProductId) {
                  setProductAnimationStates(prev => {
                    const updated = { ...prev };
                    updated[currentProductId] = false;
                    console.log('🧹 [ProductFeed] Estado de simulação limpo para:', currentProductId, 'novo estado:', updated);
                    return updated;
                  });
                }
                
                // Limpar o originalProductId depois
                setOriginalProductId(null);
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

