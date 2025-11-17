import React, { useState, useRef, useEffect, useCallback } from "react";
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

  // Carrossel state and refs
  const carouselRef = useRef(null);
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const rafRef = useRef(null);
  const cardSizeRef = useRef(400);
  const [cardSize, setCardSize] = useState(400);
  const containerWidthRef = useRef(0);
  const hasMovedRef = useRef(false);
  const dragStartTimeRef = useRef(0);

  // Sync refs with state
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Start/stop autoplay
  useEffect(() => {
    if (cols !== 1 || products.length <= 1) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    if (isDragging || isPaused) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 0.5; // pixels per frame (slow scroll)
    
    const scroll = () => {
      if (!containerRef.current || isDraggingRef.current || isPausedRef.current) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return;
      }
      
      const cont = containerRef.current;
      cont.scrollLeft += scrollAmount;
      
      // Check if we've scrolled past the end
      if (cont.scrollLeft >= cont.scrollWidth - cont.offsetWidth - 1) {
        // Reset to start smoothly
        cont.scrollLeft = 0;
        setCurrentIndex(0);
      } else {
        // Update current index based on scroll position
        // Card width + gap (24px = gap-6)
        const cardWidthWithGap = cardSizeRef.current + 24;
        const newIndex = Math.round(cont.scrollLeft / cardWidthWithGap);
        if (newIndex < products.length) {
          setCurrentIndex(prev => {
            if (prev !== newIndex) return newIndex;
            return prev;
          });
        }
      }
      
      rafRef.current = requestAnimationFrame(scroll);
    };
    
    rafRef.current = requestAnimationFrame(scroll);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [cols, products.length, isDragging, isPaused]);

  // Handle mouse/touch drag
  const handleStart = useCallback((e) => {
    if (cols !== 1) return;
    setIsDragging(true);
    setIsPaused(true);
    hasMovedRef.current = false;
    dragStartTimeRef.current = Date.now();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [cols]);

  const handleMove = useCallback((e) => {
    if (!isDragging || cols !== 1) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - startX;
    
    // Check if there was significant movement (more than 5px)
    if (Math.abs(x) > 5) {
      hasMovedRef.current = true;
    }
    
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollLeft - x;
    }
  }, [isDragging, startX, scrollLeft, cols]);

  const handleEnd = useCallback(() => {
    if (cols !== 1) return;
    
    const hadMovement = hasMovedRef.current;
    setIsDragging(false);
    
    // Prevent click on cards if there was drag movement (desktop only)
    // Keep the flag for a bit longer to prevent click events
    if (hadMovement) {
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 200);
    } else {
      hasMovedRef.current = false;
    }
    
    // Resume autoplay after a short delay
    setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  }, [cols]);

  // Prevent click on cards when dragging (desktop only)
  const handleContainerClick = useCallback((e) => {
    if (hasMovedRef.current || isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isDragging]);

  // Prevent click on individual cards when dragging
  const handleCardClick = useCallback((e) => {
    if (hasMovedRef.current || isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isDragging]);

  // Attach event listeners
  useEffect(() => {
    if (cols !== 1) return;
    
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [cols, handleStart, handleMove, handleEnd]);

  // Pause on hover
  const handleMouseEnter = useCallback(() => {
    if (cols === 1) {
      setIsPaused(true);
    }
  }, [cols]);

  const handleMouseLeave = useCallback(() => {
    if (cols === 1) {
      setTimeout(() => {
        if (!isDragging) {
          setIsPaused(false);
        }
      }, 500);
    }
  }, [cols, isDragging]);

  // Calculate card size based on container width to show partial cards on sides
  useEffect(() => {
    if (cols !== 1) return;
    
    const updateCardSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth || containerRef.current.clientWidth;
        if (containerWidth > 0) {
          containerWidthRef.current = containerWidth;
          // Make cards about 70% of container width so we can see parts of adjacent cards
          const newSize = Math.min(containerWidth * 0.7, 500);
          setCardSize(newSize);
          cardSizeRef.current = newSize;
        }
      }
    };

    // Initial update with a small delay to ensure container is rendered
    const timeoutId = setTimeout(() => {
      updateCardSize();
    }, 100);
    
    // Use ResizeObserver for better performance
    let resizeObserver = null;
    const container = containerRef.current;
    if (container) {
      resizeObserver = new ResizeObserver(() => {
        updateCardSize();
      });
      resizeObserver.observe(container);
    }
    
    window.addEventListener('resize', updateCardSize);
    
    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateCardSize);
    };
  }, [cols]);

  // Render carousel when cols === 1
  if (cols === 1) {

    return (
      <div
        ref={carouselRef}
        className="relative w-full overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide"
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            cursor: isDragging ? 'grabbing' : 'grab',
            WebkitOverflowScrolling: 'touch',
            paddingLeft: '15%', // Add padding to center first card
            paddingRight: '15%', // Add padding to center last card
          }}
          onClick={handleContainerClick}
        >
          {products.map((p, index) => (
            <div
              key={p.id}
              className="flex-shrink-0"
              style={{ 
                width: `${cardSize}px`,
                aspectRatio: '1 / 1',
              }}
              onClick={handleCardClick}
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
          ))}
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


