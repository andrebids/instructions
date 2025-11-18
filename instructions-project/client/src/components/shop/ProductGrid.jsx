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
  const [cardHeight, setCardHeight] = useState(600);
  const containerWidthRef = useRef(0);
  const hasMovedRef = useRef(false);
  const dragStartTimeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  // Sync refs with state
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Create infinite loop products array
  const infiniteProducts = React.useMemo(() => {
    if (cols !== 1 || products.length === 0) return products;
    // Duplicate products at the beginning and end for seamless loop
    return [...products, ...products, ...products];
  }, [cols, products]);

  // Initialize scroll position to middle set
  useEffect(() => {
    if (cols !== 1 || products.length === 0) return;
    if (containerRef.current && cardSizeRef.current > 0) {
      const cardWidthWithGap = cardSizeRef.current + 24;
      const loopOffset = products.length * cardWidthWithGap;
      // Set initial scroll to middle set (second copy) only if not already set
      if (containerRef.current.scrollLeft < loopOffset / 2) {
        containerRef.current.scrollLeft = loopOffset;
      }
    }
  }, [cols, products.length, cardSize]);

  // Start/stop autoplay with infinite loop
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

    // Smoother, slower scroll for better animation
    const scrollAmount = 0.8; // pixels per frame (smoother scroll)
    const cardWidthWithGap = cardSizeRef.current + 24;
    const singleSetWidth = products.length * cardWidthWithGap;
    
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
      
      // Seamless infinite loop: jump before reaching the end
      // When we're about to reach the end of the second set, jump back to equivalent position in middle set
      // This happens when we still have enough content ahead so the jump is imperceptible
      const threshold = singleSetWidth * 2 - (cardWidthWithGap * 4); // Jump when 4 cards before the end
      if (cont.scrollLeft >= threshold) {
        // Calculate how far we are into the second set
        const offset = cont.scrollLeft - singleSetWidth;
        // Jump to equivalent position in middle set (seamless - same visual position)
        cont.scrollLeft = singleSetWidth + (offset % singleSetWidth);
      } else if (cont.scrollLeft < singleSetWidth - (cardWidthWithGap * 4)) {
        // Jump forward if scrolled too far back
        const offset = cont.scrollLeft - singleSetWidth;
        cont.scrollLeft = singleSetWidth + (offset % singleSetWidth);
        if (cont.scrollLeft < singleSetWidth) {
          cont.scrollLeft += singleSetWidth;
        }
      }
      
      // Update current index based on scroll position within the middle set
      const relativeScroll = cont.scrollLeft - singleSetWidth;
      const newIndex = Math.round(relativeScroll / cardWidthWithGap) % products.length;
      const normalizedIndex = newIndex < 0 ? products.length + newIndex : newIndex;
      
      if (normalizedIndex >= 0 && normalizedIndex < products.length) {
        setCurrentIndex(prev => {
          if (prev !== normalizedIndex) return normalizedIndex;
          return prev;
        });
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

  // Check if device is touch-enabled
  const isTouchDevice = useRef(false);
  useEffect(() => {
    const isTouchDeviceValue = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    isTouchDevice.current = isTouchDeviceValue;
    setIsTouch(isTouchDeviceValue);
  }, []);

  // Handle mouse/touch drag (only for touch devices)
  const handleStart = useCallback((e) => {
    if (cols !== 1 || !isTouchDevice.current) return;
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


  // Navigate functions with infinite loop support
  const scrollToNext = useCallback(() => {
    if (!containerRef.current || cols !== 1 || products.length === 0) return;
    const container = containerRef.current;
    const cardWidthWithGap = cardSizeRef.current + 24;
    const scrollAmount = cardWidthWithGap * 2; // Scroll 2 cards at a time
    const singleSetWidth = products.length * cardWidthWithGap;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    
    // Check if we need to loop after scroll animation (seamless)
    setTimeout(() => {
      const threshold = singleSetWidth * 2 - (cardWidthWithGap * 4);
      if (container.scrollLeft >= threshold) {
        const offset = container.scrollLeft - singleSetWidth;
        container.scrollLeft = singleSetWidth + (offset % singleSetWidth);
      }
    }, 500);
    
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  }, [cols, products.length]);

  const scrollToPrev = useCallback(() => {
    if (!containerRef.current || cols !== 1 || products.length === 0) return;
    const container = containerRef.current;
    const cardWidthWithGap = cardSizeRef.current + 24;
    const scrollAmount = cardWidthWithGap * 2; // Scroll 2 cards at a time
    const singleSetWidth = products.length * cardWidthWithGap;
    
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    
    // Check if we need to loop after scroll animation (seamless)
    setTimeout(() => {
      if (container.scrollLeft < singleSetWidth - (cardWidthWithGap * 4)) {
        const offset = container.scrollLeft - singleSetWidth;
        let newPos = singleSetWidth + (offset % singleSetWidth);
        if (newPos < singleSetWidth) {
          newPos += singleSetWidth;
        }
        container.scrollLeft = newPos;
      }
    }, 500);
    
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000);
  }, [cols, products.length]);

  // Handle mouse wheel scroll with infinite loop
  const handleWheel = useCallback((e) => {
    if (cols !== 1 || products.length === 0) return;
    e.preventDefault();
    if (containerRef.current) {
      const container = containerRef.current;
      const cardWidthWithGap = cardSizeRef.current + 24;
      const singleSetWidth = products.length * cardWidthWithGap;
      
      container.scrollLeft += e.deltaY;
      
      // Seamless infinite loop: jump before reaching boundaries
      const threshold = singleSetWidth * 2 - (cardWidthWithGap * 4);
      if (container.scrollLeft >= threshold) {
        const offset = container.scrollLeft - singleSetWidth;
        container.scrollLeft = singleSetWidth + (offset % singleSetWidth);
      } else if (container.scrollLeft < singleSetWidth - (cardWidthWithGap * 4)) {
        const offset = container.scrollLeft - singleSetWidth;
        let newPos = singleSetWidth + (offset % singleSetWidth);
        if (newPos < singleSetWidth) {
          newPos += singleSetWidth;
        }
        container.scrollLeft = newPos;
      }
      
      // Update current index
      const relativeScroll = container.scrollLeft - singleSetWidth;
      const newIndex = Math.round(relativeScroll / cardWidthWithGap) % products.length;
      const normalizedIndex = newIndex < 0 ? products.length + newIndex : newIndex;
      if (normalizedIndex >= 0 && normalizedIndex < products.length) {
        setCurrentIndex(normalizedIndex);
      }
    }
  }, [cols, products.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (cols !== 1) return;
    
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cols, scrollToPrev, scrollToNext]);

  // Attach event listeners (only for touch devices)
  useEffect(() => {
    if (cols !== 1 || !isTouchDevice.current) return;
    
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [cols, handleStart, handleMove, handleEnd]);

  // Update scroll buttons and current index on scroll with infinite loop
  useEffect(() => {
    if (cols !== 1 || products.length === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidthWithGap = cardSizeRef.current + 24;
      const singleSetWidth = products.length * cardWidthWithGap;
      
      // Seamless infinite loop: jump before reaching visible boundaries
      // Jump when we're 4 cards before the end to make it imperceptible
      const threshold = singleSetWidth * 2 - (cardWidthWithGap * 4);
      if (container.scrollLeft >= threshold) {
        // Calculate offset from middle set start
        const offset = container.scrollLeft - singleSetWidth;
        // Jump to equivalent position in middle set (same visual position)
        container.scrollLeft = singleSetWidth + (offset % singleSetWidth);
      } else if (container.scrollLeft < singleSetWidth - (cardWidthWithGap * 4)) {
        // Jump forward if scrolled too far back
        const offset = container.scrollLeft - singleSetWidth;
        let newPos = singleSetWidth + (offset % singleSetWidth);
        if (newPos < singleSetWidth) {
          newPos += singleSetWidth;
        }
        container.scrollLeft = newPos;
      }
      
      // Update current index based on scroll position within the middle set
      const relativeScroll = container.scrollLeft - singleSetWidth;
      const newIndex = Math.round(relativeScroll / cardWidthWithGap) % products.length;
      const normalizedIndex = newIndex < 0 ? products.length + newIndex : newIndex;
      if (normalizedIndex >= 0 && normalizedIndex < products.length) {
        setCurrentIndex(normalizedIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial index update

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [cols, products.length]);

  // Pause on hover
  const handleMouseEnter = useCallback(() => {
    if (cols === 1) {
      setIsPaused(true);
      setIsHovered(true);
    }
  }, [cols]);

  const handleMouseLeave = useCallback(() => {
    if (cols === 1) {
      setIsHovered(false);
      setTimeout(() => {
        if (!isDragging) {
          setIsPaused(false);
        }
      }, 500);
    }
  }, [cols, isDragging]);

  // Calculate card size based on container width and height to show 2 cards at a time
  // and fit within viewport without vertical scroll
  useEffect(() => {
    if (cols !== 1) return;
    
    const updateCardSize = () => {
      if (containerRef.current && carouselRef.current) {
        const containerWidth = containerRef.current.offsetWidth || containerRef.current.clientWidth;
        if (containerWidth > 0) {
          containerWidthRef.current = containerWidth;
          
          // Calculate available height: viewport height minus header, controls, and padding
          // Get the carousel container's position relative to viewport
          const carouselRect = carouselRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          // Calculate available height: from carousel top to bottom of viewport
          // Subtract some padding for breathing room (e.g., 40px total)
          const availableHeight = Math.max(400, viewportHeight - carouselRect.top - 40);
          
          // Aspect ratio: 3/4 means width/height = 3/4, so height = width * 4/3
          // We want to show 2 cards, so: 2 * width + gap = containerWidth
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
          cardSizeRef.current = finalCardWidth;
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
    window.addEventListener('scroll', updateCardSize, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateCardSize);
      window.removeEventListener('scroll', updateCardSize);
    };
  }, [cols]);

  // Render carousel when cols === 1
  if (cols === 1) {
    const totalCards = products.length;
    const cardsPerView = 2;
    const totalPages = Math.ceil(totalCards / cardsPerView);
    const currentPage = Math.min(Math.floor(currentIndex / cardsPerView), totalPages - 1);

    return (
      <div
        ref={carouselRef}
        className="relative w-full overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <div
          ref={containerRef}
          className={`flex gap-6 overflow-x-auto scrollbar-hide ${
            isTouch ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
          onClick={handleContainerClick}
        >
          {infiniteProducts.map((p, index) => (
            <div
              key={`${p.id}-${index}`}
              className="flex-shrink-0"
              style={{ 
                width: `${cardSize}px`,
                height: `${cardHeight}px`,
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

        {/* Page Indicators */}
        {!isTouch && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }).map((_, index) => {
              const isActive = index === currentPage;
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (containerRef.current && products.length > 0) {
                      const cardWidthWithGap = cardSizeRef.current + 24;
                      const singleSetWidth = products.length * cardWidthWithGap;
                      const targetScroll = singleSetWidth + (index * cardsPerView * cardWidthWithGap);
                      containerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
                      setIsPaused(true);
                      setTimeout(() => setIsPaused(false), 3000);
                    }
                  }}
                  className={`transition-all duration-200 rounded-full ${
                    isActive 
                      ? 'w-8 h-2 bg-primary' 
                      : 'w-2 h-2 bg-default-300 hover:bg-default-400'
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              );
            })}
          </div>
        )}
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


