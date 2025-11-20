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
  const [isPaused, setIsPaused] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center', // Center alignment to ensure the active card is centered
      containScroll: false, // Allow scrolling past the edges for loop
      slidesToScroll: 1, // Scroll one by one for better control
      dragFree: true,
      watchDrag: true
    },
    cols === 1 && products.length > 1 && !isPaused
      ? [AutoScroll({
        speed: 1, // Slower speed for smoother auto-scroll
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

  // Update selected index
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const handleModalChange = useCallback((isOpen) => {
    console.log('🎠 [ProductGrid] Modal state changed:', isOpen);
    setIsPaused(isOpen);
  }, []);

  // IntersectionObserver for performance and precise "fully visible" detection
  useEffect(() => {
    if (!emblaApi || cols !== 1) return;

    const options = {
      root: emblaApi.rootNode(),
      threshold: 0.95, // 95% visible to be considered "fully visible"
    };

    const callback = (entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.classList.add('is-fully-visible');
        } else {
          target.classList.remove('is-fully-visible');
        }
      });
    };

    const observer = new IntersectionObserver(callback, options);
    const slides = emblaApi.slideNodes();

    slides.forEach((slide) => observer.observe(slide));

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      observer.disconnect();
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, cols, onSelect]);

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
        <style>{`
          .carousel-slide {
            opacity: 0.5;
            transform: scale(0.92);
            transition: opacity 0.3s ease, transform 0.3s ease;
            will-change: opacity, transform;
          }
          .carousel-slide.is-fully-visible {
            opacity: 1;
            transform: scale(1);
          }
        `}</style>
        <div ref={emblaRef} className="overflow-hidden" style={{ transform: 'translateZ(0)', contain: 'layout style paint' }}>
          <div className="flex" style={{ willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translateZ(0)', contain: 'layout style' }}>
            {products.map((p, index) => {
              return (
                <div
                  key={p.id}
                  className="carousel-slide flex-[0_0_auto] min-w-0"
                  style={{
                    width: `${cardSize}px`,
                    height: `${cardHeight}px`,
                    marginRight: '24px',
                    transform: 'translateZ(0)',
                  }}
                >
                  <div className="w-full h-full">
                    <ProductCard
                      product={p}
                      onOrder={onOrder}
                      glass={glass}
                      allowQty={allowQty}
                      isSquare={true}
                      onModalOpenChange={handleModalChange}
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


