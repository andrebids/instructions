import React, { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { Button, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import { SimulationPreview } from './SimulationPreview';

export function SimulationCarousel({ canvasImages = [], decorationsByImage = {} }) {
  const [viewMode, setViewMode] = useState('day'); // 'day', 'night', 'both'
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: 'center',
      dragFree: true,
      watchDrag: true
    },
    [AutoScroll({ speed: 2.5, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [slideOpacities, setSlideOpacities] = useState({});
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Calcular opacidade dos slides baseado nas margens da página (50px de cada lado)
  const updateSlideOpacities = useCallback(() => {
    if (!emblaApi) return;
    
    const container = emblaApi.containerNode();
    if (!container) return;
    
    const slides = emblaApi.slideNodes();
    const marginZone = 50; // 50px a partir de cada margem
    const viewportWidth = window.innerWidth;
    const opacities = {};
    
    slides.forEach((slide, index) => {
      const slideRect = slide.getBoundingClientRect();
      
      // Verificar se o slide está nas zonas de margem (50px da esquerda ou direita da viewport)
      const slideLeft = slideRect.left;
      const slideRight = slideRect.right;
      
      // Zona esquerda: 0 a 50px
      const inLeftZone = slideRight > 0 && slideLeft < marginZone;
      // Zona direita: viewportWidth - 50px a viewportWidth
      const inRightZone = slideLeft < viewportWidth && slideRight > (viewportWidth - marginZone);
      
      if (inLeftZone || inRightZone) {
        // Calcular opacidade baseada na proximidade da margem
        let minOpacity = 1;
        
        if (inLeftZone) {
          // Slide está na zona esquerda - calcular distância do ponto mais próximo da margem esquerda
          // O ponto mais próximo do slide à margem esquerda (x=0) é slideLeft
          const distanceFromLeftMargin = Math.max(0, slideLeft);
          // Normalizar: 0 na margem (0px), 1 a 50px da margem
          const normalizedDistance = Math.min(1, distanceFromLeftMargin / marginZone);
          // Opacidade: 0.3 na margem (0px), 1.0 a 50px da margem
          const opacity = 0.3 + (normalizedDistance * 0.7);
          minOpacity = Math.min(minOpacity, opacity);
        }
        
        if (inRightZone) {
          // Slide está na zona direita - calcular distância do ponto mais próximo da margem direita
          // O ponto mais próximo do slide à margem direita (x=viewportWidth) é viewportWidth - slideRight
          const distanceFromRightMargin = Math.max(0, viewportWidth - slideRight);
          // Normalizar: 0 na margem (0px), 1 a 50px da margem
          const normalizedDistance = Math.min(1, distanceFromRightMargin / marginZone);
          // Opacidade: 0.3 na margem (0px), 1.0 a 50px da margem
          const opacity = 0.3 + (normalizedDistance * 0.7);
          minOpacity = Math.min(minOpacity, opacity);
        }
        
        opacities[index] = minOpacity;
      } else {
        // Slide fora das zonas de margem, opacidade máxima
        opacities[index] = 1;
      }
    });
    
    setSlideOpacities(opacities);
  }, [emblaApi]);
  
  useEffect(() => {
    if (!emblaApi) return;
    
    let rafId = null;
    let scrollRafId = null;
    
    const onScroll = () => {
      // Cancelar frame anterior se existir
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Agendar atualização no próximo frame
      rafId = requestAnimationFrame(() => {
        setScrollProgress(emblaApi.scrollProgress());
        updateSlideOpacities();
        rafId = null;
      });
      
      // Se não há loop contínuo, iniciar um durante o scroll
      if (!scrollRafId) {
        const continuousUpdate = () => {
          updateSlideOpacities();
          scrollRafId = requestAnimationFrame(continuousUpdate);
        };
        scrollRafId = requestAnimationFrame(continuousUpdate);
      }
    };
    
    const onSettle = () => {
      // Parar loop contínuo
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
        scrollRafId = null;
      }
      // Última atualização
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
      if (scrollRafId) cancelAnimationFrame(scrollRafId);
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('settle', onSettle);
      emblaApi.off('reInit', updateSlideOpacities);
      emblaApi.off('resize', onResize);
      window.removeEventListener('resize', onResize);
    };
  }, [emblaApi, onSelect, updateSlideOpacities]);
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);
  
  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  
  const scrollTo = useCallback((index) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);
  
  if (!canvasImages || canvasImages.length === 0) {
    return null;
  }
  
  const currentImage = canvasImages[selectedIndex];
  
  // Tentar encontrar decorações pela chave do canvasImage.id
  // Se não encontrar, tentar pela primeira chave disponível (já que normalmente só há uma imagem por vez)
  let currentDecorations = decorationsByImage[currentImage?.id] || [];
  if (currentDecorations.length === 0 && Object.keys(decorationsByImage).length > 0) {
    // Se não encontrou pela chave exata, pegar a primeira disponível
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
        <div className="relative overflow-hidden" ref={emblaRef} style={{ transform: 'translateZ(0)' }}>
          <div className="flex" style={{ willChange: 'transform', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            {canvasImages.map((image, index) => {
              const decorations = decorationsByImage[image?.id] || [];
              const imageDecorations = decorations.length === 0 && Object.keys(decorationsByImage).length > 0
                ? decorationsByImage[Object.keys(decorationsByImage)[0]] || []
                : decorations;
              
              const opacity = slideOpacities[index] !== undefined ? slideOpacities[index] : 1;
              
              return (
                <div 
                  key={image.id || index} 
                  className="flex-[0_0_100%] min-w-0"
                  style={{
                    opacity: opacity,
                    transition: 'opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'opacity'
                  }}
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
                </div>
              );
            })}
          </div>
          
          {/* Navegação */}
          {canvasImages.length > 1 && (
            <>
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm z-10"
                onPress={scrollPrev}
                aria-label="Previous simulation"
              >
                <Icon icon="lucide:chevron-left" className="text-white" />
              </Button>
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm z-10"
                onPress={scrollNext}
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
              onClick={() => scrollTo(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
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

