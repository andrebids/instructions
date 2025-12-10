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
 * Componente de texto com marquee infinito quando o texto é muito comprido
 */
const MarqueeText = ({ children, className = "" }) => {
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);
  const [needsMarquee, setNeedsMarquee] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const isOverflowing = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setNeedsMarquee(isOverflowing);
      }
    };

    // Verificar após renderização
    checkOverflow();
    
    // Verificar também após um pequeno delay para garantir que o layout está completo
    const timeout = setTimeout(checkOverflow, 100);

    // Verificar quando a janela é redimensionada
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [children]);

  return (
    <div 
      ref={containerRef} 
      className={`overflow-hidden ${className}`} 
      style={{ maxWidth: "100%", width: "100%" }}
    >
      {needsMarquee ? (
        <div 
          className="inline-flex whitespace-nowrap" 
          style={{
            animation: "marquee-infinite 15s linear infinite"
          }}
        >
          <span>{children}</span>
          <span style={{ paddingLeft: "2rem" }}>{children}</span>
        </div>
      ) : (
        <span ref={textRef} className="truncate inline-block whitespace-nowrap" style={{ maxWidth: "100%" }}>
          {children}
        </span>
      )}
    </div>
  );
};

/**
 * Lista de thumbnails de imagens
 * @param {Object} props
 * @param {Array} props.uploadedImages - Imagens uploadadas
 * @param {Object} props.selectedImage - Imagem selecionada
 * @param {Function} props.onImageSelect - Callback quando imagem é selecionada
 * @param {Function} props.onImageRemove - Callback quando imagem é removida
 * @param {Object} props.conversionComplete - Mapeia quais imagens completaram conversão
 * @param {number} props.activeGifIndex - Índice da imagem com GIF ativo
 * @param {Function} props.onAddMore - Callback para adicionar mais imagens
 * @param {boolean} props.isMobile - Se é mobile
 */
export const ImageThumbnailList = ({
  uploadedImages,
  selectedImage,
  onImageSelect,
  onImageRemove,
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
            <div key={image.id} className="relative group">
              <Tooltip
                content={isDisabled ? "Waiting for night conversion..." : ""}
                isDisabled={!isDisabled}
                placement="right"
              >
                <div
                  className={
                    isDisabled
                      ? 'border-none transition-all duration-200 cursor-not-allowed opacity-60'
                      : selectedImage?.id === image.id 
                        ? 'border-none transition-all duration-200 cursor-pointer ring-2 ring-primary shadow-lg rounded-lg'
                        : 'border-none transition-all duration-200 cursor-pointer hover:ring-1 hover:ring-primary/50 rounded-lg'
                  }
                  onClick={() => {
                    if (!isDisabled) {
                      onImageSelect(image);
                    }
                  }}
                >
                  <Card
                    isFooterBlurred
                    isPressable={false}
                    isDisabled={isDisabled}
                    className="border-none"
                    radius="lg"
                    aria-label={'Select source image ' + image.name}
                  >
                    {/* Botão de remoção - aparece no hover */}
                    {onImageRemove && isConverted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onImageRemove(image.id);
                        }}
                        className="absolute top-1 right-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full p-1.5 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger-300 shadow-md bg-danger-500 text-white"
                        aria-label={`Remove image ${image.name}`}
                        title="Remove image"
                      >
                        <Icon icon="lucide:trash-2" className="text-xs" />
                      </button>
                    )}
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
                    <div className="flex grow gap-2 items-center min-w-0">
                      <MarqueeText className="text-tiny text-white/80">
                        {image.name}
                      </MarqueeText>
                    </div>
                    {selectedImage?.id === image.id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon icon="lucide:check" className="text-white text-xs" />
                      </div>
                    )}
                  </CardFooter>
                  </Card>
                </div>
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

