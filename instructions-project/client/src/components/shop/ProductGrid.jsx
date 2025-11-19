import React, { useState, useRef, useEffect, useCallback } from "react";
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, onOrder, cols = 4, glass = false, allowQty = false, cardProps = {}, filtersVisible = true }) {
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

  // Embla Carousel setup for cols === 1
  const carouselRef = useRef(null);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'start',
      containScroll: 'trimSnaps',
      slidesToScroll: 2,
      dragFree: true,
      watchDrag: true
    },
    cols === 1 && products.length > 1 
      ? [AutoScroll({ 
          speed: 1.8, 
          stopOnInteraction: false, 
          stopOnMouseEnter: true,
          stopOnFocusIn: false,
          startDelay: 0
        })]
      : []
  );
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cardSize, setCardSize] = useState(400);
  const [cardHeight, setCardHeight] = useState(600);
  const [slideOpacities, setSlideOpacities] = useState({});

  // Update selected index
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Calcular opacidade dos slides baseado nas margens da página (25px de cada lado)
  const updateSlideOpacities = useCallback(() => {
    if (!emblaApi || cols !== 1) return;
    
    const slides = emblaApi.slideNodes();
    if (!slides.length) return;
    
    const marginZone = 25; // 25px a partir de cada margem
    const viewportWidth = window.innerWidth;
    const opacities = {};
    
    // Batch getBoundingClientRect calls
    const rects = slides.map(slide => slide.getBoundingClientRect());
    
    slides.forEach((slide, index) => {
      const slideRect = rects[index];
      
      // Verificar se o slide está nas zonas de margem (25px da esquerda ou direita da viewport)
      const slideLeft = slideRect.left;
      const slideRight = slideRect.right;
      
      // Zona esquerda: 0 a 25px
      const inLeftZone = slideRight > 0 && slideLeft < marginZone;
      // Zona direita: viewportWidth - 25px a viewportWidth
      const inRightZone = slideLeft < viewportWidth && slideRight > (viewportWidth - marginZone);
      
      if (inLeftZone || inRightZone) {
        // Calcular opacidade baseada na proximidade da margem
        let minOpacity = 1;
        
        if (inLeftZone) {
          const distanceFromLeftMargin = Math.max(0, slideLeft);
          const normalizedDistance = Math.min(1, distanceFromLeftMargin / marginZone);
          // Curva extremamente suave usando ease-out quintic: opacity mínima 0.6, máxima 1.0
          const easedDistance = 1 - Math.pow(1 - normalizedDistance, 5); // Ease-out quintic
          const opacity = 0.6 + (easedDistance * 0.4);
          minOpacity = Math.min(minOpacity, opacity);
        }
        
        if (inRightZone) {
          const distanceFromRightMargin = Math.max(0, viewportWidth - slideRight);
          const normalizedDistance = Math.min(1, distanceFromRightMargin / marginZone);
          // Curva extremamente suave usando ease-out quintic: opacity mínima 0.6, máxima 1.0
          const easedDistance = 1 - Math.pow(1 - normalizedDistance, 5); // Ease-out quintic
          const opacity = 0.6 + (easedDistance * 0.4);
          minOpacity = Math.min(minOpacity, opacity);
        }
        
        opacities[index] = minOpacity;
      } else {
        opacities[index] = 1;
      }
    });
    
    setSlideOpacities(opacities);
  }, [emblaApi, cols]);

  useEffect(() => {
    if (!emblaApi || cols !== 1) return;
    
    let rafId = null;
    let isUpdating = false;
    
    const onScroll = () => {
      // Cancelar frame anterior se existir
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Agendar atualização no próximo frame apenas se não estiver atualizando
      if (!isUpdating) {
        rafId = requestAnimationFrame(() => {
          isUpdating = true;
          updateSlideOpacities();
          isUpdating = false;
          rafId = null;
        });
      }
    };
    
    const onSettle = () => {
      // Parar atualizações pendentes
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      updateSlideOpacities();
    };
    
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateSlideOpacities();
        rafId = null;
      });
    };
    
    onSelect();
    updateSlideOpacities();
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('scroll', onScroll);
    emblaApi.on('settle', onSettle);
    emblaApi.on('reInit', updateSlideOpacities);
    emblaApi.on('resize', onResize);
    
    window.addEventListener('resize', onResize);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('settle', onSettle);
      emblaApi.off('reInit', updateSlideOpacities);
      emblaApi.off('resize', onResize);
      window.removeEventListener('resize', onResize);
    };
  }, [emblaApi, onSelect, updateSlideOpacities, cols]);

  // Handle mouse wheel scroll
  const handleWheel = useCallback((e) => {
    if (cols !== 1 || !emblaApi || products.length === 0) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      emblaApi.scrollPrev();
    } else {
      emblaApi.scrollNext();
    }
  }, [cols, emblaApi, products.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (cols !== 1) return;
    
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!emblaApi) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        emblaApi.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        emblaApi.scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cols, emblaApi]);

  // Calculate card size based on container width and height to show 2 cards at a time
  // and fit within viewport without vertical scroll
  useEffect(() => {
    if (cols !== 1) return;
    
    const updateCardSize = () => {
      if (emblaApi && carouselRef.current) {
        const containerNode = emblaApi.containerNode();
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
    };

    const timeoutId = setTimeout(() => {
      updateCardSize();
    }, 100);
    
    let resizeObserver = null;
    if (emblaApi) {
      const container = emblaApi.containerNode();
      if (container) {
        resizeObserver = new ResizeObserver(() => {
          updateCardSize();
        });
        resizeObserver.observe(container);
      }
    }
    
    window.addEventListener('resize', updateCardSize);
    window.addEventListener('scroll', updateCardSize, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateCardSize);
      window.removeEventListener('scroll', updateCardSize);
    };
  }, [cols, emblaApi]);

  // Render carousel when cols === 1
  if (cols === 1) {
    return (
      <div
        ref={carouselRef}
        className="relative w-full overflow-hidden"
        onWheel={handleWheel}
      >
        <div ref={emblaRef} className="overflow-hidden" style={{ transform: 'translateZ(0)', contain: 'layout style paint' }}>
          <div className="flex" style={{ willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translateZ(0)', contain: 'layout style' }}>
            {products.map((p, index) => {
              const opacity = slideOpacities[index] !== undefined ? slideOpacities[index] : 1;
              
              return (
                <div
                  key={p.id}
                  className="flex-[0_0_auto] min-w-0"
                  style={{ 
                    width: `${cardSize}px`,
                    height: `${cardHeight}px`,
                    marginRight: '24px',
                    transform: 'translateZ(0)',
                    opacity: opacity,
                    transition: 'opacity 0.45s cubic-bezier(0.19, 1, 0.22, 1)',
                    willChange: 'opacity'
                  }}
                >
                  <div className="w-full h-full">
                    <ProductCard
                      product={p}
                      onOrder={onOrder}
                      glass={glass}
                      allowQty={allowQty}
                      isSquare={true}
                      {...cardProps}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render normal grid for other column counts
  return (
    <div className={`grid ${colClasses} gap-6`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onOrder={onOrder} glass={glass} allowQty={allowQty} {...cardProps} />
      ))}
    </div>
  );
}


