/**
 * Componente de lista de thumbnails de imagens (sidebar lateral)
 */
import React from 'react';
import { Card, CardFooter, Tooltip, Spinner, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { NightThumb } from '../../ui/NightThumb';

/**
 * Função utilitária para mapear caminhos de upload para /api/uploads/
 */
const mapImagePath = (path) => {
  if (!path) return path;
  // Se já é URL completa (http/https), usar diretamente
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
  // Se tem baseApi configurado, usar ele
  if (baseApi && path.indexOf('/uploads/') === 0) return baseApi + path;
  // Sem baseApi: converter /uploads/ para /api/uploads/ para passar pelo proxy
  if (path.indexOf('/uploads/') === 0) return '/api' + path;
  return path;
};

/**
 * Lista de thumbnails de imagens
 * @param {Object} props
 * @param {Array} props.uploadedImages - Imagens uploadadas
 * @param {Object} props.selectedImage - Imagem selecionada
 * @param {Function} props.onImageSelect - Callback quando imagem é selecionada
 * @param {Object} props.conversionComplete - Mapeia quais imagens completaram conversão
 * @param {number} props.activeGifIndex - Índice da imagem com GIF ativo
 * @param {Function} props.onAddMore - Callback para adicionar mais imagens
 * @param {boolean} props.isMobile - Se é mobile
 */
export const ImageThumbnailList = ({
  uploadedImages,
  selectedImage,
  onImageSelect,
  conversionComplete = {},
  activeGifIndex = -1,
  onAddMore,
  isMobile = false
}) => {
  return (
    <aside className={(isMobile ? 'w-24' : 'w-32') + ' sm:w-32 md:w-40 lg:w-48 border-r border-divider bg-content1/30 flex flex-col flex-shrink-0'}>
      <div className="p-3 md:p-4 border-b border-divider text-center">
        <h3 className="text-base md:text-lg font-semibold">Source Images</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
        {uploadedImages.map((image, index) => {
          const isConverted = conversionComplete[image.id] === true;
          const isCurrentlyConverting = index === activeGifIndex && activeGifIndex >= 0;
          // Mostrar overlay apenas se não foi convertida E não está sendo convertida agora
          const showOverlay = !isConverted && !isCurrentlyConverting;
          const isDisabled = !isConverted;
          
          return (
            <div key={image.id} className="relative">
              <Tooltip
                content={isDisabled ? "Waiting for night conversion..." : ""}
                isDisabled={!isDisabled}
                placement="right"
              >
                <Card
                  isFooterBlurred
                  isPressable={!isDisabled}
                  isDisabled={isDisabled}
                  className={
                    isDisabled
                      ? 'border-none transition-all duration-200 cursor-not-allowed opacity-60'
                      : selectedImage?.id === image.id 
                        ? 'border-none transition-all duration-200 cursor-pointer ring-2 ring-primary shadow-lg'
                        : 'border-none transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-primary/50'
                  }
                  radius="lg"
                  onPress={() => {
                    if (!isDisabled) {
                      console.log('🖱️ CARD CLICADO - Imagem:', image.name);
                      onImageSelect(image);
                    }
                  }}
                  aria-label={'Select source image ' + image.name}
                >
                  {/* NightThumb com animação de dia para noite - só mostra se API disponível */}
                  {image.nightVersion && (
                    <NightThumb
                      dayImage={image.thumbnail}
                      nightImage={image.nightVersion}
                      filename={image.name}
                      isActive={index === activeGifIndex && 
                               image.conversionStatus !== 'failed' && 
                               image.conversionStatus !== 'unavailable'}
                      duration={4000}
                    />
                  )}
                  
                  {/* Overlay de loading/bloqueio durante conversão */}
                  {showOverlay && (
                    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                      <Spinner size="md" color="primary" />
                      <p className="text-white text-xs mt-2 font-medium">Converting...</p>
                    </div>
                  )}
                  
                  <Image
                    alt={image.name}
                    className="object-cover"
                    height={120}
                    src={mapImagePath(image.thumbnail)}
                    width="100%"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling && e.target.nextSibling.style) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center bg-default-100">
                    <Icon icon="lucide:image" className="text-4xl text-default-400" />
                  </div>
                  
                  <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
                    <div className="flex grow gap-2 items-center">
                      <p className="text-tiny text-white/80 truncate">{image.name}</p>
                    </div>
                    {selectedImage?.id === image.id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Icon icon="lucide:check" className="text-white text-xs" />
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </Tooltip>
            </div>
          );
        })}

        {/* Botão para adicionar mais imagens */}
        <Card
          isFooterBlurred
          isPressable={true}
          className="w-full cursor-pointer border-none transition-all duration-200 hover:ring-1 hover:ring-primary/50"
          radius="lg"
          onPress={onAddMore}
          aria-label="Add more images"
        >
          <div className="w-full h-[120px] flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200 rounded-lg relative overflow-hidden">
            <div className="flex flex-col items-center gap-2 text-default-500 relative z-10">
              <Icon icon="lucide:plus-circle" className="text-3xl opacity-80" />
              <span className="text-sm font-medium text-center leading-tight">Add more images</span>
            </div>
          </div>
          <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
            <div className="flex grow gap-2 items-center">
              <Icon icon="lucide:upload" className="text-tiny text-primary-400" />
              <p className="text-tiny text-white/80 truncate">Upload or camera</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </aside>
  );
};

