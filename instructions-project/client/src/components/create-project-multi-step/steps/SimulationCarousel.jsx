import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Button, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import { SimulationPreview } from './SimulationPreview';

export function SimulationCarousel({ canvasImages = [], decorationsByImage = {} }) {
  const [viewMode, setViewMode] = useState('day'); // 'day', 'night', 'both'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const swiperRef = useRef(null);

  const handleSlideChange = (swiper) => {
    setSelectedIndex(swiper.activeIndex);
  };

  if (!canvasImages || canvasImages.length === 0) {
    return null;
  }

  const currentImage = canvasImages[selectedIndex];

  // Tentar encontrar decorações pela chave do canvasImage.id
  let currentDecorations = decorationsByImage[currentImage?.id] || [];
  if (currentDecorations.length === 0 && Object.keys(decorationsByImage).length > 0) {
    const firstKey = Object.keys(decorationsByImage)[0];
    currentDecorations = decorationsByImage[firstKey] || [];
  }

  return (
    <div className="space-y-4">
      {/* Controles de modo de visualização */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-500">View mode:</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={viewMode === 'day' ? 'solid' : 'flat'}
              color={viewMode === 'day' ? 'warning' : 'default'}
              onPress={() => setViewMode('day')}
              startContent={<Icon icon="lucide:sun" />}
            >
              Day
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'night' ? 'solid' : 'flat'}
              color={viewMode === 'night' ? 'primary' : 'default'}
              onPress={() => setViewMode('night')}
              startContent={<Icon icon="lucide:moon" />}
            >
              Night
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'both' ? 'solid' : 'flat'}
              color={viewMode === 'both' ? 'secondary' : 'default'}
              onPress={() => setViewMode('both')}
              startContent={<Icon icon="lucide:layers" />}
            >
              Both
            </Button>
          </div>
        </div>

        <div className="text-sm text-default-500">
          {selectedIndex + 1} / {canvasImages.length}
        </div>
      </div>

      {/* Preview principal */}
      <Card className="p-4">
        <div className="relative overflow-hidden">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            loop={true}
            centeredSlides={true}
            slidesPerView={1}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            navigation={{
              nextEl: '.swiper-button-next-custom',
              prevEl: '.swiper-button-prev-custom',
            }}
            speed={600}
            style={{ transform: 'translateZ(0)' }}
          >
            {canvasImages.map((image, index) => {
              const decorations = decorationsByImage[image?.id] || [];
              const imageDecorations = decorations.length === 0 && Object.keys(decorationsByImage).length > 0
                ? decorationsByImage[Object.keys(decorationsByImage)[0]] || []
                : decorations;

              return (
                <SwiperSlide
                  key={image.id || index}
                >
                  {viewMode === 'both' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-default-500 mb-2 flex items-center gap-1">
                          <Icon icon="lucide:sun" className="text-warning" />
                          Day Version
                        </div>
                        <div className="h-64">
                          <SimulationPreview
                            canvasImage={image}
                            decorations={imageDecorations}
                            mode="day"
                            width={600}
                            height={256}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-default-500 mb-2 flex items-center gap-1">
                          <Icon icon="lucide:moon" className="text-primary" />
                          Night Version
                        </div>
                        <div className="h-64">
                          <SimulationPreview
                            canvasImage={image}
                            decorations={imageDecorations}
                            mode="night"
                            width={600}
                            height={256}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-96">
                      <SimulationPreview
                        canvasImage={image}
                        decorations={imageDecorations}
                        mode={viewMode}
                        width={800}
                        height={384}
                      />
                    </div>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Navegação customizada */}
          {canvasImages.length > 1 && (
            <>
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 z-10"
                aria-label="Previous simulation"
              >
                <Icon icon="lucide:chevron-left" className="text-white" />
              </Button>
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 z-10"
                aria-label="Next simulation"
              >
                <Icon icon="lucide:chevron-right" className="text-white" />
              </Button>
            </>
          )}
        </div>

        {/* Nome da simulação */}
        {currentImage?.name && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium">{currentImage.name}</p>
            {currentDecorations.length > 0 && (
              <p className="text-xs text-default-500 mt-1">
                {currentDecorations.length} decoration{currentDecorations.length !== 1 ? 's' : ''} applied
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Miniaturas de navegação */}
      {canvasImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {canvasImages.map((img, index) => (
            <button
              key={img.id || index}
              onClick={() => swiperRef.current?.slideTo(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === selectedIndex
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-default-200 hover:border-default-400'
                }`}
            >
              <img
                src={img.src}
                alt={img.name || `Simulation ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
