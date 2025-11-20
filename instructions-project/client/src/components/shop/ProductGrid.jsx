import React, { useState, useRef, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode, Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
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

  // Swiper setup for cols === 1
  const carouselRef = useRef(null);
  const swiperRef = useRef(null);
  const [cardSize, setCardSize] = useState(400);
  const [cardHeight, setCardHeight] = useState(600);



  // Calculate card size based on container width and height to show 2 cards at a time
  useEffect(() => {
    if (cols !== 1) return;

    const updateCardSize = () => {
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
    };

    const timeoutId = setTimeout(() => {
      updateCardSize();
    }, 100);

    let resizeObserver = null;
    if (swiperRef.current) {
      const container = swiperRef.current.el;
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
  }, [cols, swiperRef.current]);

  // Render carousel when cols === 1
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
                  <ProductCard
                    product={p}
                    onOrder={onOrder}
                    glass={glass}
                    allowQty={allowQty}
                    isSquare={true}
                    {...cardProps}
                  />
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
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
