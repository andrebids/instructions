import React, { useState } from 'react';
import { Button, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import { SimulationPreview } from './SimulationPreview';

export function SimulationCarousel({ canvasImages = [], decorationsByImage = {} }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('day'); // 'day', 'night', 'both'
  
  if (!canvasImages || canvasImages.length === 0) {
    return null;
  }
  
  const currentImage = canvasImages[currentIndex];
  
  // Tentar encontrar decorações pela chave do canvasImage.id
  // Se não encontrar, tentar pela primeira chave disponível (já que normalmente só há uma imagem por vez)
  let currentDecorations = decorationsByImage[currentImage?.id] || [];
  if (currentDecorations.length === 0 && Object.keys(decorationsByImage).length > 0) {
    // Se não encontrou pela chave exata, pegar a primeira disponível
    const firstKey = Object.keys(decorationsByImage)[0];
    currentDecorations = decorationsByImage[firstKey] || [];
  }
  
  const nextSimulation = () => {
    setCurrentIndex((prev) => (prev + 1) % canvasImages.length);
  };
  
  const prevSimulation = () => {
    setCurrentIndex((prev) => (prev - 1 + canvasImages.length) % canvasImages.length);
  };
  
  const goToSimulation = (index) => {
    setCurrentIndex(index);
  };
  
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
          {currentIndex + 1} / {canvasImages.length}
        </div>
      </div>
      
      {/* Preview principal */}
      <Card className="p-4">
        <div className="relative">
          {viewMode === 'both' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-default-500 mb-2 flex items-center gap-1">
                  <Icon icon="lucide:sun" className="text-warning" />
                  Day Version
                </div>
                <div className="h-64">
                  <SimulationPreview
                    canvasImage={currentImage}
                    decorations={currentDecorations}
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
                    canvasImage={currentImage}
                    decorations={currentDecorations}
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
                canvasImage={currentImage}
                decorations={currentDecorations}
                mode={viewMode}
                width={800}
                height={384}
              />
            </div>
          )}
          
          {/* Navegação */}
          {canvasImages.length > 1 && (
            <>
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm"
                onPress={prevSimulation}
                aria-label="Previous simulation"
              >
                <Icon icon="lucide:chevron-left" className="text-white" />
              </Button>
              <Button
                isIconOnly
                size="lg"
                variant="flat"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 backdrop-blur-sm"
                onPress={nextSimulation}
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
              onClick={() => goToSimulation(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
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

