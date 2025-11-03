import React, { useRef, useState, useEffect } from 'react';
import { Button, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useShop } from '../../context/ShopContext';

/**
 * Card de produto para feed estilo TikTok
 * Mostra vídeo (se disponível) ou imagem com informações do produto ao lado
 */
export default function ProductFeedCard({ product, isActive = false, onPlay, onPause }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const { toggleFavorite, favorites, getAvailableStock } = useShop();

  const isFavorited = favorites?.includes(product?.id);
  const stock = getAvailableStock?.(product) ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  // Cores disponíveis
  const colorKeys = Object.keys(product?.images?.colors || {});
  const colorKeyToStyle = {
    brancoPuro: "#ffffff",
    brancoQuente: "#fbbf24",
    rgb: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
    vermelho: "#ef4444",
    verde: "#10b981",
    azul: "#3b82f6",
  };

  // Verificar se produto tem vídeo
  useEffect(() => {
    const videoUrl = product?.videoFile || product?.animationUrl;
    setHasVideo(Boolean(videoUrl));
  }, [product]);

  // Auto-play/pause baseado em isActive
  useEffect(() => {
    if (!videoRef.current || !hasVideo) return;

    if (isActive) {
      videoRef.current.play().catch(err => {
        console.warn('Erro ao reproduzir vídeo:', err);
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset para início
      setIsPlaying(false);
    }
  }, [isActive, hasVideo]);

  // Toggle play/pause manual
  const handleVideoClick = () => {
    if (!videoRef.current || !hasVideo) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      videoRef.current.play().catch(err => {
        console.warn('Erro ao reproduzir vídeo:', err);
      });
      setIsPlaying(true);
      onPlay?.();
    }
  };

  // Construir URL do vídeo
  const getVideoUrl = () => {
    const videoFile = product?.videoFile || product?.animationUrl;
    if (!videoFile) return null;
    
    // Se já é uma URL completa (http/https), usar diretamente
    if (videoFile.startsWith('http://') || videoFile.startsWith('https://')) {
      return videoFile;
    }
    
    // Se começa com /, é um caminho absoluto do servidor
    if (videoFile.startsWith('/')) {
      return videoFile;
    }
    
    // Caso contrário, assumir que é relativo a /SHOP/TRENDING/VIDEO/
    return `/SHOP/TRENDING/VIDEO/${videoFile}`;
  };

  const videoUrl = getVideoUrl();
  const imageUrl = product?.images?.day || product?.images?.night || product?.images?.thumbnailUrl;
  const discountPct = product?.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : null;

  if (!product) return null;

  return (
    <div className="relative w-full h-screen flex-shrink-0 flex items-center bg-black">
      {/* Container principal: Vídeo/Imagem à esquerda, Info à direita */}
      <div className="flex w-full h-full">
        {/* Área de vídeo/imagem - ocupa ~70% da largura */}
        <div 
          className="relative w-[70%] h-full bg-black flex items-center justify-center cursor-pointer"
          onClick={handleVideoClick}
        >
          {hasVideo && videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              preload="metadata"
              onError={(e) => {
                console.warn('Erro ao carregar vídeo:', videoUrl, e);
                // Se vídeo falhar, mostrar imagem de fallback
                setHasVideo(false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleVideoClick();
              }}
            />
          ) : (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}

          {/* Overlay de controles quando pausado */}
          {hasVideo && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button
                isIconOnly
                radius="full"
                className="bg-white/20 backdrop-blur-md text-white border border-white/20"
                size="lg"
              >
                <Icon icon="lucide:play" className="text-4xl ml-1" />
              </Button>
            </div>
          )}

          {/* Badge de desconto */}
          {discountPct && (
            <Chip 
              size="sm" 
              color="danger" 
              variant="solid" 
              className="absolute left-4 top-4 z-10"
            >
              {discountPct}% OFF
            </Chip>
          )}
        </div>

        {/* Painel de informações - ocupa ~30% da largura */}
        <div className="w-[30%] h-full bg-gradient-to-l from-black/95 via-black/90 to-transparent p-6 flex flex-col justify-between overflow-y-auto">
          {/* Informações principais */}
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-white text-2xl font-bold mb-2">{product.name}</h3>
            
            {/* Preço */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white text-3xl font-bold">
                €{product.price?.toFixed(2) || '0.00'}
              </span>
              {product.oldPrice && (
                <span className="text-gray-400 line-through text-lg">
                  €{product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-3 text-sm">
              {isOutOfStock ? (
                <span className="text-red-400">Out of stock</span>
              ) : (
                <span className={`${isLowStock ? 'text-yellow-400' : 'text-green-400'}`}>
                  Stock: <span className="font-semibold">{stock}</span>
                </span>
              )}
            </div>

            {/* Tags */}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.tags.slice(0, 4).map((tag, idx) => (
                  <Chip
                    key={idx}
                    size="sm"
                    variant="flat"
                    className="bg-white/10 text-white border-white/20"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            )}

            {/* Cores disponíveis */}
            {colorKeys.length > 0 && (
              <div className="mb-4">
                <div className="text-gray-400 text-xs mb-2">Available Colors</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorKeys.slice(0, 6).map((key) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-full border-2 border-white/30"
                      style={{ 
                        background: colorKeyToStyle[key] || '#e5e7eb',
                        boxShadow: key === 'brancoPuro' ? 'inset 0 0 0 1px rgba(0,0,0,0.2)' : undefined,
                      }}
                      title={key}
                    />
                  ))}
                  {colorKeys.length > 6 && (
                    <span className="text-gray-400 text-xs">+{colorKeys.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {/* Tipo, Localização, Mount */}
            {(product.type || product.location || product.mount) && (
              <div className="mb-4 space-y-1">
                {product.type && (
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Type: </span>
                    <span className="text-white">{product.type}</span>
                  </div>
                )}
                {product.location && (
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Location: </span>
                    <span className="text-white">{product.location}</span>
                  </div>
                )}
                {product.mount && (
                  <div className="text-xs text-gray-400">
                    <span className="text-gray-500">Mount: </span>
                    <span className="text-white">{product.mount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Dimensões */}
            {(product.height || product.width || product.depth || product.diameter) && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Dimensions</div>
                <div className="text-xs text-gray-300 space-y-0.5">
                  {product.height && <div>H: {product.height}m</div>}
                  {product.width && <div>W: {product.width}m</div>}
                  {product.depth && <div>D: {product.depth}m</div>}
                  {product.diameter && <div>Ø: {product.diameter}m</div>}
                </div>
              </div>
            )}

            {/* Descrição/Especificações resumidas */}
            {product.specs?.descricao && (
              <div className="mb-4">
                <p className="text-gray-300 text-sm line-clamp-4">
                  {product.specs.descricao}
                </p>
              </div>
            )}

            {/* Especificações técnicas resumidas */}
            {product.specs && (
              <div className="mb-4 space-y-2">
                {product.specs.weight && (
                  <div className="text-xs">
                    <span className="text-gray-500">Weight: </span>
                    <span className="text-white">{product.specs.weight}</span>
                  </div>
                )}
                {product.specs.materiais && (
                  <div className="text-xs">
                    <span className="text-gray-500">Materials: </span>
                    <span className="text-white">{product.specs.materiais}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Button
              radius="full"
              className={`${
                isFavorited 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/10 text-white border border-white/20'
              }`}
              startContent={
                <Icon 
                  icon={isFavorited ? "mdi:heart" : "mdi:heart-outline"} 
                  className={isFavorited ? "text-red-500" : ""}
                  style={isFavorited ? { fill: '#ef4444' } : {}}
                />
              }
              onPress={() => toggleFavorite?.(product.id)}
            >
              {isFavorited ? 'Favorited' : 'Favorite'}
            </Button>

            <Button
              radius="full"
              variant="bordered"
              className="bg-white/10 text-white border-white/20"
              startContent={<Icon icon="lucide:share-2" />}
            >
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

