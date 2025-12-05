import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';

// Lazy load ProductCard component for code splitting
const ProductCard = React.lazy(() => import("./ProductCard"));

// Loading fallback for ProductCard
const ProductCardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-default-100 animate-pulse">
    <div className="w-full h-64 bg-default-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-default-200 rounded w-3/4" />
      <div className="h-4 bg-default-200 rounded w-1/2" />
    </div>
  </div>
);

export default function ProductGrid({ 
  products, 
  onOrder, 
  cols = 4, 
  glass = false, 
  allowQty = false, 
  cardProps = {}, 
  filtersVisible = true,
  itemsPerPage = 24, // Número de produtos a mostrar por página
  enablePagination = true // Habilitar paginação client-side
}) {
  const colClasses = React.useMemo(() => {
    if (cols === 1) {
      return "grid-cols-1";
    }
    if (cols === 2) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2";
    }
    if (cols === 3) {
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3";
    }
    if (cols === 4) {
      // Quando os filtros estão escondidos, há mais espaço, então mostrar 4 colunas mais cedo
      if (!filtersVisible) {
        return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4";
      }
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
    }
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";
  }, [cols, filtersVisible]);

  // Paginação client-side
  const [visibleCount, setVisibleCount] = useState(enablePagination ? itemsPerPage : products.length);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);

  // Reset visible count quando produtos mudam (ex: filtros aplicados)
  useEffect(() => {
    if (enablePagination) {
      setVisibleCount(itemsPerPage);
    } else {
      setVisibleCount(products.length);
    }
  }, [products.length, enablePagination, itemsPerPage]);

  // Produtos visíveis (slice dos produtos totais)
  const visibleProducts = React.useMemo(() => {
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  // Verificar se há mais produtos para carregar
  const hasMore = visibleCount < products.length;

  // IntersectionObserver para infinite scroll
  useEffect(() => {
    // Não aplicar paginação no modo carousel ou se não há mais produtos
    if (cols === 1 || !enablePagination || !hasMore) {
      return;
    }

    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) {
      return;
    }

    // Criar IntersectionObserver para detectar quando o elemento de "load more" entra no viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore) {
            // Carregar mais produtos (aumentar visibleCount)
            setVisibleCount((prev) => {
              const next = prev + itemsPerPage;
              // Não exceder o total de produtos
              return Math.min(next, products.length);
            });
          }
        });
      },
      {
        rootMargin: '200px', // Começar a carregar quando estiver 200px antes de entrar no viewport
        threshold: 0.1
      }
    );

    observerRef.current.observe(loadMoreElement);

    return () => {
      if (observerRef.current && loadMoreElement) {
        observerRef.current.unobserve(loadMoreElement);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [cols, enablePagination, hasMore, itemsPerPage, products.length]);

  // Swiper setup for cols === 1
  const carouselRef = useRef(null);
  const swiperRef = useRef(null);
  const [cardSize, setCardSize] = useState(400);
  const [cardHeight, setCardHeight] = useState(600);
  const [swiperReady, setSwiperReady] = useState(false);



  // Calculate card size based on container width and height to show 2 cards at a time
  const updateCardSize = useCallback(() => {
    if (swiperRef.current && carouselRef.current) {
      const swiper = swiperRef.current;
      const containerNode = swiper.el;
      if (containerNode) {
        const containerWidth = containerNode.offsetWidth || containerNode.clientWidth;
        if (containerWidth > 0) {
          // Calculate available height: viewport height minus header, controls, and padding
          const carouselRect = carouselRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const availableHeight = Math.max(400, viewportHeight - carouselRect.top - 40);

          // Aspect ratio: 3/4 means width/height = 3/4, so height = width * 4/3
          const gap = 24;
          const aspectRatio = 3 / 4; // width / height

          // Calculate width based on available height
          const widthFromHeight = availableHeight * aspectRatio;

          // Calculate width to show exactly 2 cards
          const widthForTwoCards = Math.floor((containerWidth - gap) / 2);

          // Use the smaller width to ensure both constraints are met
          const finalCardWidth = Math.min(widthFromHeight, widthForTwoCards);
          const finalCardHeight = finalCardWidth / aspectRatio;

          setCardSize(finalCardWidth);
          setCardHeight(finalCardHeight);
        }
      }
    }
  }, []);

  // Setup ResizeObserver when Swiper instance is available
  useEffect(() => {
    if (cols !== 1 || !swiperReady || !swiperRef.current) return;

    const swiper = swiperRef.current;
    const container = swiper.el;
    if (!container) return;

    // Initial update
    const timeoutId = setTimeout(() => {
      updateCardSize();
    }, 100);

    // Setup ResizeObserver for the Swiper container
    const resizeObserver = new ResizeObserver(() => {
      updateCardSize();
    });
    resizeObserver.observe(container);

    // Setup window event listeners
    window.addEventListener('resize', updateCardSize);
    window.addEventListener('scroll', updateCardSize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCardSize);
      window.removeEventListener('scroll', updateCardSize);
    };
  }, [cols, swiperReady, updateCardSize]); // Re-run when cols changes or Swiper instance is ready

  // Reset swiperReady when cols changes away from 1
  useEffect(() => {
    if (cols !== 1) {
      // Usar setTimeout em vez de queueMicrotask para garantir que o estado seja atualizado
      // antes do próximo effect verificar swiperReady, evitando race conditions
      const timeoutId = setTimeout(() => {
        setSwiperReady(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [cols]);

  // Render carousel when cols === 1 (sem paginação no carousel)
  if (cols === 1) {
    return (
      <div
        ref={carouselRef}
        className="relative w-full overflow-hidden"
      >
        <Swiper
          modules={[Autoplay, Mousewheel, Keyboard]}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            // Só definir swiperReady como true se cols ainda for 1 (evitar race condition)
            if (cols === 1) {
              setSwiperReady(true);
            }
          }}
          loop={true}
          loopAdditionalSlides={3}
          centeredSlides={true}
          slidesPerView="auto"
          spaceBetween={24}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          speed={1600}
          allowTouchMove={true}
          mousewheel={{
            forceToAxis: true,
            sensitivity: 1,
          }}
          keyboard={{
            enabled: true,
            onlyInViewport: true,
          }}
          style={{
            transform: 'translateZ(0)',
            contain: 'layout style paint'
          }}
        >
          {products.map((p) => {
            return (
              <SwiperSlide
                key={p.id}
                onMouseEnter={() => {
                  if (swiperRef.current?.autoplay) {
                    swiperRef.current.autoplay.stop();
                  }
                }}
                onMouseLeave={() => {
                  if (swiperRef.current?.autoplay) {
                    swiperRef.current.autoplay.start();
                  }
                }}
                style={{
                  width: `${cardSize}px`,
                  height: `${cardHeight}px`,
                  transform: 'translateZ(0)',
                }}
              >
                <div className="w-full h-full">
                  <Suspense fallback={<ProductCardSkeleton />}>
                    <ProductCard
                      product={p}
                      onOrder={onOrder}
                      glass={glass}
                      allowQty={allowQty}
                      isSquare={true}
                      {...cardProps}
                    />
                  </Suspense>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    );
  }

  // Render normal grid for other column counts (com paginação)
  return (
    <>
      <div className={`grid ${colClasses} gap-6`}>
        {visibleProducts.map((p) => (
          <Suspense key={p.id} fallback={<ProductCardSkeleton />}>
            <ProductCard product={p} onOrder={onOrder} glass={glass} allowQty={allowQty} {...cardProps} />
          </Suspense>
        ))}
      </div>
      {/* Elemento para detectar quando carregar mais produtos */}
      {enablePagination && hasMore && (
        <div 
          ref={loadMoreRef} 
          className="w-full h-20 flex items-center justify-center"
          aria-label="Loading more products"
        >
          <div className="text-default-400 text-sm">Loading more products...</div>
        </div>
      )}
    </>
  );
}
