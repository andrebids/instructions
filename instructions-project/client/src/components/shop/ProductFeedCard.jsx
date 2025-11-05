import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ScrollShadow, Image } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useShop } from '../../context/ShopContext';

/**
 * Product card for TikTok-style feed
 * Displays video (if available) or image with product information on the side
 */
export default function ProductFeedCard({ product, isActive = false, onPlay, onPause, onProductSelect, initialAnimationSimulation = false, originalProductId = null, onResetOriginalProduct, onClearOriginalProduct }) {
  const videoRef = useRef(null);
  const infoPanelRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Estado para controlar se está mostrando simulação animada (apenas para GX349L)
  const [showAnimationSimulation, setShowAnimationSimulation] = useState(false);
  // Estado para controlar vídeo selecionado de sugestões
  const [selectedSuggestionVideo, setSelectedSuggestionVideo] = useState(null);
  // Estado para guardar o estado de simulação animada antes de selecionar uma sugestão
  const [previousAnimationState, setPreviousAnimationState] = useState(false);
  // Flag para indicar se o estado foi alterado manualmente (não deve ser sobrescrito pelo useEffect)
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const previousProductIdRef = useRef(product?.id);
  const manuallyToggledRef = useRef(false); // Ref para garantir que não seja sobrescrito durante re-renders
  const lastToggleTimeRef = useRef(0); // Timestamp do último toggle para evitar sobrescrita imediata
  const { toggleFavorite, favorites, getBaseStock, getAvailableStock, products, getReservedQuantity } = useShop();

  const isFavorited = favorites?.includes(product?.id);
  const stock = getBaseStock?.(product) ?? 0; // Usar stock total (base) em vez de stock disponível
  const availableStock = getAvailableStock?.(product) ?? 0;
  const reservedStock = getReservedQuantity?.(product?.id) ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

  // Debug: Log informações de stock para GX349L
  React.useEffect(() => {
    if (product?.name === 'GX349L' || product?.id === 'prd-005') {
      console.log('📦 [ProductFeedCard] GX349L Stock Info:', {
        productId: product?.id,
        productName: product?.name,
        baseStock: stock,
        availableStock: availableStock,
        reservedStock: reservedStock,
        difference: stock - availableStock
      });
    }
  }, [product?.id, product?.name, stock, availableStock, reservedStock]);

  // Verificar se é o produto GX349L ou GX350LW
  const isGX349L = product?.name === 'GX349L' || product?.id === 'prd-005';
  const isGX350LW = product?.name === 'GX350LW' || product?.id?.includes('GX350LW');

  // Available colors
  const colorKeys = Object.keys(product?.images?.colors || {});
  const colorKeyToStyle = {
    brancoPuro: "#ffffff",
    brancoQuente: "#fbbf24",
    rgb: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)",
    vermelho: "#ef4444",
    verde: "#10b981",
    azul: "#3b82f6",
  };

  // Check if product has video (incluindo simulação animada para GX349L e GX350LW)
  useEffect(() => {
    const videoUrl = product?.videoFile || product?.animationUrl;
    const hasSimulationVideo = isGX349L || isGX350LW; // GX349L e GX350LW sempre têm vídeo de simulação disponível
    setHasVideo(Boolean(videoUrl) || hasSimulationVideo);
  }, [product, isGX349L, isGX350LW]);

  // Reset simulação animada e vídeo de sugestão quando o produto muda
  useEffect(() => {
    console.log('🔄 [useEffect] Executando', {
      manuallyToggled,
      manuallyToggledRef: manuallyToggledRef.current,
      productId: product?.id,
      initialAnimationSimulation,
      showAnimationSimulation,
      timeSinceLastToggle: Date.now() - lastToggleTimeRef.current
    });
    
    // Se foi alterado manualmente (verificar tanto state quanto ref), NUNCA sobrescrever o estado
    // Também verificar se foi alterado há menos de 2000ms (proteção adicional contra timing issues)
    const recentlyToggled = Date.now() - lastToggleTimeRef.current < 2000;
    
    if (manuallyToggled || manuallyToggledRef.current || recentlyToggled) {
      console.log('🔄 [useEffect] Bloqueado - foi alterado manualmente', {
        manuallyToggled,
        manuallyToggledRef: manuallyToggledRef.current,
        recentlyToggled
      });
      return;
    }
    
    // Verificar se o produto realmente mudou
    const productChanged = previousProductIdRef.current !== product?.id;
    
    if (productChanged) {
      console.log('🔄 [useEffect] Produto mudou, aplicando estado inicial');
      // Produto mudou: resetar flag e aplicar estado inicial
      setManuallyToggled(false); // Resetar flag quando produto muda
      manuallyToggledRef.current = false; // Resetar ref também
      lastToggleTimeRef.current = 0; // Resetar timestamp também
      previousProductIdRef.current = product?.id;
      
      // Se há um estado inicial de simulação animada passado como prop, usar esse estado
      // Caso contrário, resetar para vídeo normal
      if (initialAnimationSimulation && (isGX349L || isGX350LW)) {
        setShowAnimationSimulation(true);
      } else {
        setShowAnimationSimulation(false);
      }
      setSelectedSuggestionVideo(null);
      setPreviousAnimationState(false);
    } else {
      console.log('🔄 [useEffect] Produto não mudou, mas initialAnimationSimulation pode ter mudado');
      // Produto não mudou mas initialAnimationSimulation pode ter mudado
      // Aplicar apenas se não foi alterado manualmente (já verificado acima)
      // IMPORTANTE: Se manuallyToggledRef está true ou foi recentemente alterado, não fazer nada mesmo que initialAnimationSimulation mude
      if (manuallyToggledRef.current || recentlyToggled) {
        console.log('🔄 [useEffect] Bloqueado - manuallyToggledRef é true ou foi recentemente alterado', {
          manuallyToggledRef: manuallyToggledRef.current,
          recentlyToggled
        });
        return;
      }
      
      // Verificar se o estado atual já está correto antes de atualizar
      const shouldBeSimulation = initialAnimationSimulation && (isGX349L || isGX350LW);
      if (showAnimationSimulation !== shouldBeSimulation) {
        if (shouldBeSimulation) {
          console.log('🔄 [useEffect] Aplicando simulação animada');
          setShowAnimationSimulation(true);
        } else {
          console.log('🔄 [useEffect] Aplicando vídeo normal');
          setShowAnimationSimulation(false);
        }
      } else {
        console.log('🔄 [useEffect] Estado já está correto, não precisa atualizar');
      }
    }
  }, [product?.id, initialAnimationSimulation, isGX349L, isGX350LW]); // Removido manuallyToggled das dependências para evitar execuções desnecessárias

  // O vídeo será automaticamente recarregado quando videoUrl mudar devido à key={videoUrl}
  // O onLoadedData no elemento vídeo garante que seja reproduzido quando carregar

  // Auto-play/pause based on isActive
  useEffect(() => {
    if (!videoRef.current || !hasVideo) return;

    if (isActive) {
      videoRef.current.play().catch(err => {
        console.warn('Error playing video:', err);
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset to start
      setIsPlaying(false);
    }
  }, [isActive, hasVideo]); // Remover showAnimationSimulation e selectedSuggestionVideo daqui pois já são tratados no useEffect acima

  // Toggle play/pause manual
  const handleVideoClick = () => {
    if (!videoRef.current || !hasVideo) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      videoRef.current.play().catch(err => {
        console.warn('Error playing video:', err);
      });
      setIsPlaying(true);
      onPlay?.();
    }
  };

  // Handler para botão de simulação animada - usado tanto no botão do lado esquerdo quanto no painel de informações
  const handleAnimationSimulationToggle = () => {
    console.log('🎬 [handleAnimationSimulationToggle] Clicado', {
      selectedSuggestionVideo: !!selectedSuggestionVideo,
      showAnimationSimulation,
      originalProductId,
      productId: product?.id
    });
    
    // Se há um vídeo selecionado de sugestões, voltar ao vídeo original
    if (selectedSuggestionVideo) {
      setSelectedSuggestionVideo(null);
      // Restaurar o estado de simulação animada anterior
      setShowAnimationSimulation(previousAnimationState);
      manuallyToggledRef.current = false;
      setManuallyToggled(false);
    } else {
      // Caso contrário, alternar normalmente entre vídeo normal e simulação
      const newState = !showAnimationSimulation;
      
      console.log('🎬 [handleAnimationSimulationToggle] Alternando estado', {
        from: showAnimationSimulation,
        to: newState
      });
      
      // CRÍTICO: Marcar como alterado manualmente ANTES de qualquer outra ação
      // Isso garante que o useEffect não sobrescreva o estado
      manuallyToggledRef.current = true;
      setManuallyToggled(true);
      lastToggleTimeRef.current = Date.now(); // Marcar timestamp do toggle
      
      console.log('🎬 [handleAnimationSimulationToggle] Estado ANTES:', {
        showAnimationSimulation,
        newState,
        manuallyToggledRef: manuallyToggledRef.current,
        timestamp: lastToggleTimeRef.current
      });
      
      // Atualizar o estado local usando função de atualização para garantir que seja aplicado
      setShowAnimationSimulation(prevState => {
        console.log('🎬 [handleAnimationSimulationToggle] setShowAnimationSimulation chamado', {
          prevState,
          newState,
          willUpdate: prevState !== newState
        });
        return newState;
      });
      
      console.log('🎬 [handleAnimationSimulationToggle] Estado DEPOIS:', {
        showAnimationSimulation: newState,
        manuallyToggledRef: manuallyToggledRef.current
      });
      
      // Depois limpar o estado no ProductFeed se necessário
      // IMPORTANTE: Limpar após um pequeno delay para garantir que o estado local seja atualizado primeiro
      if (!newState && onClearOriginalProduct) {
        console.log('🎬 [handleAnimationSimulationToggle] Limpando estado no ProductFeed');
        // Usar setTimeout para garantir que o estado local seja atualizado antes de limpar no ProductFeed
        setTimeout(() => {
          onClearOriginalProduct();
        }, 50);
      }
    }
  };

  // Build video URL
  const getVideoUrl = () => {
    // Se houver vídeo selecionado de sugestões, usar esse
    if (selectedSuggestionVideo) {
      console.log('🎥 [getVideoUrl] Usando vídeo de sugestão:', selectedSuggestionVideo);
      return selectedSuggestionVideo;
    }
    
    // Se for GX349L e estiver mostrando simulação animada, usar o vídeo da simulação
    if (isGX349L && showAnimationSimulation) {
      console.log('🎥 [getVideoUrl] GX349L - Simulação animada');
      return '/SIMU_GX349L_ANIM.webm';
    }
    
    // Se for GX350LW e estiver mostrando simulação animada, usar o vídeo da simulação
    if (isGX350LW && showAnimationSimulation) {
      console.log('🎥 [getVideoUrl] GX350LW - Simulação animada');
      return '/SIMU_GX350LW_ANIM.webm';
    }
    
    // Por default, sempre retornar o vídeo normal do produto
    const videoFile = product?.videoFile || product?.animationUrl;
    console.log('🎥 [getVideoUrl] Vídeo normal:', videoFile, 'showAnimationSimulation:', showAnimationSimulation);
    if (!videoFile) return null;
    
    // If already a complete URL (http/https), use directly
    if (videoFile.startsWith('http://') || videoFile.startsWith('https://')) {
      return videoFile;
    }
    
    // If starts with /, it's an absolute server path
    if (videoFile.startsWith('/')) {
      return videoFile;
    }
    
    // Otherwise, assume it's relative to /SHOP/TRENDING/VIDEO/
    return `/SHOP/TRENDING/VIDEO/${videoFile}`;
  };

  // Helper function to format text to Title Case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to capitalize first letter, preserving special cases like "3D"
  const capitalize = (str) => {
    if (!str) return '';
    // Handle "3D" or "3d" case - keep D uppercase
    if (str.toLowerCase() === '3d' || str.toLowerCase() === '3 d') {
      return '3D';
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Helper function to translate mount from Portuguese to English
  const translateMount = (mount) => {
    if (!mount) return '';
    const mountMap = {
      'chão': 'Floor',
      'poste': 'Pole',
      'transversal': 'Transverse',
    };
    const lowerMount = mount.toLowerCase().trim();
    return mountMap[lowerMount] || capitalize(mount);
  };

  // Helper function to format materials string
  const formatMaterials = (materialsStr) => {
    if (!materialsStr) return '';
    // Split by comma, trim each part, apply title case, then join
    return materialsStr
      .split(',')
      .map(material => toTitleCase(material.trim()))
      .join(', ');
  };

  const videoUrl = getVideoUrl();
  console.log('🎬 [ProductFeedCard Render] videoUrl:', videoUrl, 'showAnimationSimulation:', showAnimationSimulation, 'manuallyToggledRef:', manuallyToggledRef.current);
  const imageUrl = product?.images?.day || product?.images?.night || product?.images?.thumbnailUrl;
  const discountPct = product?.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : null;

  // Helper function to format weight with unit
  const formatWeight = (weight) => {
    if (!weight) return '';
    const weightStr = String(weight).trim();
    // Check if already has a unit (kg, g, etc)
    if (/\d+\s*(kg|g|lb|oz)/i.test(weightStr)) {
      return weightStr;
    }
    // If it's just a number, add "kg"
    return `${weightStr} kg`;
  };

  // Format product values
  const formattedType = product?.type ? capitalize(product.type) : null;
  const formattedLocation = product?.location ? capitalize(product.location) : null;
  const formattedMount = product?.mount ? translateMount(product.mount) : null;
  const formattedDescription = product.specs?.descricao ? capitalize(product.specs.descricao) : null;
  const formattedMaterials = product.specs?.materiais ? formatMaterials(product.specs.materiais) : null;
  const formattedWeight = product.specs?.weight ? formatWeight(product.specs.weight) : null;

  // No need to measure panel width anymore - using Framer Motion for slide animation

  // Handle swipe from right edge to open panel
  const handleSwipeStart = useCallback((e) => {
    const touch = e.touches?.[0];
    const clientX = touch?.clientX || e.clientX;
    // Only trigger from right 15% of screen
    if (clientX >= window.innerWidth * 0.85) {
      setIsInfoOpen(true);
    }
  }, []);

  // Find similar products based on tags, type, location, mount
  // Inclui especificamente a GX350LW nas sugestões
  const getSimilarProducts = useCallback(() => {
    if (!products || !Array.isArray(products) || !product) return [];
    
    const currentProduct = product;
    
    // Sempre incluir GX350LW nas sugestões se existir
    const gx350LW = products.find(p => p.name === 'GX350LW' || p.id?.includes('GX350LW'));
    
    const similarities = products
      .filter(p => p.id !== currentProduct.id)
      .map(p => {
        let score = 0;
        
        // Boost para GX350LW
        if (p.name === 'GX350LW' || p.id?.includes('GX350LW')) {
          score += 100; // Prioridade máxima
        }
        
        // Match tags
        const currentTags = currentProduct.tags || [];
        const productTags = p.tags || [];
        const commonTags = currentTags.filter(tag => productTags.includes(tag));
        score += commonTags.length * 3; // Tags are important
        
        // Match type
        if (currentProduct.type && p.type && currentProduct.type === p.type) {
          score += 5;
        }
        
        // Match location
        if (currentProduct.location && p.location && currentProduct.location === p.location) {
          score += 4;
        }
        
        // Match mount
        if (currentProduct.mount && p.mount && currentProduct.mount === p.mount) {
          score += 3;
        }
        
        // Match category (if available)
        if (currentProduct.category && p.category && currentProduct.category === p.category) {
          score += 2;
        }
        
        return { product: p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6) // Top 6 similar products
      .map(item => item.product);
    
    // Se GX350LW não está nos resultados mas existe, adicionar no início
    if (gx350LW && !similarities.find(p => p.id === gx350LW.id)) {
      similarities.unshift(gx350LW);
    }
    
    return similarities;
  }, [products, product]);

  if (!product) return null;

  return (
    <div 
      className="relative w-full h-screen flex-shrink-0 flex bg-black overflow-hidden"
      onTouchStart={handleSwipeStart}
      onMouseDown={handleSwipeStart}
    >
      {/* Main container: Video full width, info panel overlay */}
      <div className="flex w-full h-full relative items-center justify-center p-2 sm:p-4 md:p-6">
        {/* Video/image area - container do vídeo - ocupar mais espaço na tela */}
        <div 
          className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer overflow-hidden"
          style={{
            minHeight: '80vh', // Garantir que ocupe pelo menos 80% da altura da tela
          }}
          onClick={handleVideoClick}
        >
          {hasVideo && videoUrl ? (
            <video
              key={videoUrl} // Key para forçar recarregar quando o vídeo mudar
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
              }}
              loop
              muted
              playsInline
              preload="metadata"
              onLoadedData={() => {
                // Quando o vídeo carregar, reproduzir se estiver ativo
                if (isActive && videoRef.current) {
                  videoRef.current.play().catch(err => {
                    console.warn('Error playing video:', err);
                  });
                  setIsPlaying(true);
                }
              }}
              onError={(e) => {
                console.warn('Error loading video:', videoUrl, e);
                // If video fails, show fallback image
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
              className="w-full h-full object-contain bg-black"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
              }}
            />
          )}

          {/* Control overlay when paused */}
          {hasVideo && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
              <Button
                isIconOnly
                radius="full"
                className="bg-white/20 text-white border border-white/20"
                size="lg"
              >
                <Icon icon="lucide:play" className="text-4xl ml-1" />
              </Button>
            </div>
          )}

          {/* Botão invisível para abrir sugestões - área clicável no local do risco verde (urso polar) - posição relativa ao container do vídeo - apenas quando está em simulação animada ou há vídeo de sugestão ativo */}
          {(showAnimationSimulation || selectedSuggestionVideo) && (
            <div
              className="absolute z-20 cursor-pointer"
              onClick={(e) => {
                // Não abrir sugestões se clicar em um botão ou elemento interativo
                const target = e.target;
                if (target.closest('button') || target.closest('[role="button"]')) {
                  return;
                }
                e.stopPropagation();
                setShowSuggestions(true);
              }}
              style={{ 
                pointerEvents: 'auto',
                // Posição relativa ao container do vídeo (retângulo vermelho) - sobre o urso polar (retângulo rosa)
                // O urso está no centro, encostado à parte inferior do container vermelho
                // Tamanhos proporcionais ao container do vídeo
                width: '25%', // 25% da largura do container
                height: '35%', // 35% da altura do container
                position: 'absolute',
                left: '50%', // Centro horizontal do container
                bottom: '0px', // Encostado à parte inferior do container
                transform: 'translateX(-50%) rotate(90deg)', // Centralizar e rodar
                transformOrigin: 'center center',
                // Garantir que não sai do container
                maxWidth: '100%',
                maxHeight: '100%',
              }}
              aria-label="Open suggestions"
            />
          )}


        </div>

        {/* Main information overlay - compact, positioned at top-right corner to minimize overlap */}
        {!isInfoOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
                         className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 lg:top-6 lg:right-6 z-40 bg-black/90 rounded-md sm:rounded-lg md:rounded-xl px-2 py-2 sm:px-2.5 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4 border border-white/20 shadow-2xl pointer-events-auto max-w-[160px] md:max-w-[240px] lg:max-w-[280px]"
            style={{
              marginTop: 'env(safe-area-inset-top, 0)',
              marginRight: 'env(safe-area-inset-right, 0)',
              transform: 'translateZ(0)', // Force hardware acceleration
            }}
          >
              <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 min-w-[120px] sm:min-w-[140px] md:min-w-[200px] lg:min-w-[240px] max-w-[160px] md:max-w-[240px] lg:max-w-[280px] overflow-hidden">
                {/* Name with discount badge */}
                <div className="flex items-start gap-1.5 md:gap-2 justify-between w-full">
                  <h3 className="text-white text-[11px] sm:text-xs md:text-sm lg:text-base font-bold leading-tight line-clamp-2 flex-1 min-w-0">
                    {product.name}
                  </h3>
                  {discountPct && (
                    <Chip 
                      size="sm" 
                      color="danger" 
                      variant="solid" 
                      className="flex-shrink-0 text-[9px] sm:text-[10px] md:text-xs h-4 sm:h-5 md:h-6 px-1.5 sm:px-2 md:px-2.5 whitespace-nowrap"
                    >
                      {discountPct}% OFF
                    </Chip>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-0.5 sm:gap-1 md:gap-1.5 flex-wrap">
                  <span className="text-white text-base sm:text-lg md:text-xl lg:text-2xl font-black leading-none tracking-tight">
                    €{product.price?.toFixed(2) || '0.00'}
                  </span>
                  {product.oldPrice && (
                    <span className="text-gray-400 line-through text-[9px] sm:text-[10px] md:text-xs font-medium">
                      €{product.oldPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div>
                  {isOutOfStock ? (
                    <span className="text-red-400 text-[9px] sm:text-[10px] md:text-xs font-semibold">Out of stock</span>
                  ) : (
                    <span className={`text-[9px] sm:text-[10px] md:text-xs font-semibold ${isLowStock ? 'text-yellow-400' : 'text-green-400'}`}>
                      Stock: <span className="font-bold">{stock}</span>
                    </span>
                  )}
                </div>

                {/* Dimensions - check product level, specs, and specs.dimensions */}
                {(() => {
                  const height = product.height || product.specs?.height || product.specs?.dimensions?.heightM;
                  const width = product.width || product.specs?.width || product.specs?.dimensions?.widthM;
                  const depth = product.depth || product.specs?.depth || product.specs?.dimensions?.depthM;
                  const diameter = product.diameter || product.specs?.diameter || product.specs?.dimensions?.diameterM;
                  
                  if (height || width || depth || diameter) {
                    return (
                      <div className="pt-0.5 md:pt-1 border-t border-white/10">
                        <div className="text-gray-300 text-[8px] sm:text-[9px] md:text-[10px] font-semibold mb-0.5 md:mb-1 uppercase tracking-wide">DIMENSIONS</div>
                        <div className="space-y-0.5 text-white">
                          {height && (
                            <div className="text-[9px] sm:text-[10px] md:text-xs">
                              <span className="text-gray-400 font-medium">H: </span>
                              <span className="font-semibold">{height}m</span>
                            </div>
                          )}
                          {width && (
                            <div className="text-[9px] sm:text-[10px] md:text-xs">
                              <span className="text-gray-400 font-medium">W: </span>
                              <span className="font-semibold">{width}m</span>
                            </div>
                          )}
                          {depth && (
                            <div className="text-[9px] sm:text-[10px] md:text-xs">
                              <span className="text-gray-400 font-medium">D: </span>
                              <span className="font-semibold">{depth}m</span>
                            </div>
                          )}
                          {diameter && (
                            <div className="text-[9px] sm:text-[10px] md:text-xs">
                              <span className="text-gray-400 font-medium">Ø: </span>
                              <span className="font-semibold">{diameter}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
          </motion.div>
        )}

        {/* Open button - visible when panel is closed, positioned in the middle vertically */}
        {!isInfoOpen && (
          <Button
            isIconOnly
            radius="full"
            size="lg"
                         className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/60 text-white border border-white/20 hover:bg-black/80"
            onPress={() => setIsInfoOpen(true)}
            aria-label="Open product info"
          >
            <Icon icon="lucide:chevron-left" className="text-2xl" />
          </Button>
        )}

        {/* Information panel - slides in from right, hidden by default */}
        <AnimatePresence>
          {isInfoOpen && (
            <>
              {/* Overlay - closes panel when clicked */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                                 className="absolute inset-0 bg-black/30 z-40"
                onClick={() => setIsInfoOpen(false)}
              />

              {/* Panel */}
              <motion.div
                ref={infoPanelRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                 className="absolute right-0 top-0 h-full w-[40%] md:w-[30%] bg-black/98 p-3 md:p-6 flex flex-col overflow-y-auto border-l border-white/5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
          {/* Close button - top left */}
                     <div className="absolute top-3 md:top-4 left-3 md:left-4 z-60">
            <Button
              isIconOnly
              size="sm"
              radius="full"
              variant="light"
              className="text-white hover:bg-white/10"
              onPress={() => setIsInfoOpen(false)}
              aria-label="Close panel"
            >
              <Icon icon="lucide:x" className="text-lg" />
            </Button>
          </div>

          {/* Main information - starts from top with padding for close button */}
          <div className="flex flex-col pt-12 md:pt-14 space-y-4 md:space-y-5 flex-1">
            {/* Product name - Maximum emphasis */}
            <div>
              <h3 className="text-white text-xl md:text-3xl font-extrabold leading-tight tracking-tight line-clamp-2">
                {product.name}
              </h3>
            </div>
            
            {/* Price - Second emphasis */}
            <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
              <span className="text-white text-2xl md:text-4xl font-black leading-none">
                €{product.price?.toFixed(2) || '0.00'}
              </span>
              {product.oldPrice && (
                <span className="text-gray-400 line-through text-base md:text-xl font-medium">
                  €{product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock and Tags - Grouped */}
            <div className="space-y-2">
              {/* Stock */}
              <div>
                {isOutOfStock ? (
                  <span className="text-red-400 text-sm md:text-base font-medium">Out of stock</span>
                ) : (
                  <span className={`text-sm md:text-base font-medium ${isLowStock ? 'text-yellow-400' : 'text-green-400'}`}>
                    Stock: <span className="font-bold">{stock}</span>
                  </span>
                )}
              </div>

              {/* Tags */}
              {Array.isArray(product.tags) && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.slice(0, 4).map((tag, idx) => (
                    <Chip
                      key={idx}
                      size="sm"
                      variant="flat"
                      className="bg-gray-800/80 text-white border border-white/10 px-3 py-1 font-medium text-xs"
                    >
                      {toTitleCase(tag)}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Available Colors */}
            {colorKeys.length > 0 && (
              <div className="space-y-2">
                <div className="text-gray-400 text-xs md:text-sm font-medium">Available Colors</div>
                <div className="flex items-center gap-3 flex-wrap">
                  {colorKeys.slice(0, 6).map((key) => (
                    <div
                      key={key}
                      className="w-7 h-7 rounded-full border-2 border-white/20 shadow-sm"
                      style={{ 
                        background: colorKeyToStyle[key] || '#e5e7eb',
                        boxShadow: key === 'brancoPuro' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : undefined,
                      }}
                      title={key}
                    />
                  ))}
                  {colorKeys.length > 6 && (
                    <span className="text-gray-500 text-sm font-medium">+{colorKeys.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {/* Type, Location, Mount - Grouped */}
            {(formattedType || formattedLocation || formattedMount) && (
              <div className="space-y-1">
                {formattedType && (
                  <div className="text-xs md:text-sm">
                    <span className="text-gray-500 font-medium">Type: </span>
                    <span className="text-white font-semibold">{formattedType}</span>
                  </div>
                )}
                {formattedLocation && (
                  <div className="text-xs md:text-sm">
                    <span className="text-gray-500 font-medium">Location: </span>
                    <span className="text-white font-semibold">{formattedLocation}</span>
                  </div>
                )}
                {formattedMount && (
                  <div className="text-xs md:text-sm">
                    <span className="text-gray-500 font-medium">Mount: </span>
                    <span className="text-white font-semibold">{formattedMount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Dimensions - check product level, specs, and specs.dimensions */}
            {(() => {
              const height = product.height || product.specs?.height || product.specs?.dimensions?.heightM;
              const width = product.width || product.specs?.width || product.specs?.dimensions?.widthM;
              const depth = product.depth || product.specs?.depth || product.specs?.dimensions?.depthM;
              const diameter = product.diameter || product.specs?.diameter || product.specs?.dimensions?.diameterM;
              
              if (height || width || depth || diameter) {
                return (
                  <div className="space-y-1">
                    <div className="text-gray-500 text-xs md:text-sm font-medium">Dimensions</div>
                    <div className="space-y-0.5">
                      {height && (
                        <div className="text-xs md:text-sm">
                          <span className="text-gray-400">H: </span>
                          <span className="text-white font-medium">{height}m</span>
                        </div>
                      )}
                      {width && (
                        <div className="text-xs md:text-sm">
                          <span className="text-gray-400">W: </span>
                          <span className="text-white font-medium">{width}m</span>
                        </div>
                      )}
                      {depth && (
                        <div className="text-xs md:text-sm">
                          <span className="text-gray-400">D: </span>
                          <span className="text-white font-medium">{depth}m</span>
                        </div>
                      )}
                      {diameter && (
                        <div className="text-xs md:text-sm">
                          <span className="text-gray-400">Ø: </span>
                          <span className="text-white font-medium">{diameter}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Description */}
            {formattedDescription && (
              <div>
                <p className="text-white text-sm md:text-base leading-relaxed">
                  {formattedDescription}
                </p>
              </div>
            )}

            {/* Technical specifications */}
            {product.specs && (
              <div className="space-y-2">
                {formattedWeight && (
                  <div className="text-xs md:text-sm">
                    <span className="text-gray-500 font-medium">Weight: </span>
                    <span className="text-white font-semibold">{formattedWeight}</span>
                  </div>
                )}
                {formattedMaterials && (
                  <div className="space-y-1">
                    <div className="text-gray-500 text-xs md:text-sm font-medium">Materials:</div>
                    <p className="text-white text-xs md:text-sm leading-relaxed">
                      {formattedMaterials}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons - at the bottom */}
            <div className="flex flex-col gap-2 md:gap-3 pt-4 md:pt-6 mt-auto border-t border-white/10">
            {/* Botão de simulação animada - apenas para GX349L e GX350LW, também no painel de informações */}
            {(isGX349L || isGX350LW) && (
              <Button
                radius="md"
                size="sm"
                variant="bordered"
                className="bg-gray-900/50 hover:bg-gray-800/50 text-white border-white/20 font-semibold text-xs md:text-base"
                startContent={
                  <Icon 
                    icon={selectedSuggestionVideo ? "lucide:rotate-ccw" : (showAnimationSimulation ? "lucide:video" : "lucide:play-circle")} 
                    className="text-base md:text-xl"
                  />
                }
                onPress={handleAnimationSimulationToggle}
              >
                {selectedSuggestionVideo ? "Ver Vídeo Original" : (showAnimationSimulation ? "Ver Vídeo Normal" : "Ver Simulação Animada")}
              </Button>
            )}

            <Button
              radius="md"
              size="sm"
              className={`font-semibold text-xs md:text-base ${
                isFavorited 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
              }`}
              startContent={
                <Icon 
                  icon={isFavorited ? "mdi:heart" : "mdi:heart-outline"} 
                  className="text-base md:text-xl"
                  style={isFavorited ? { fill: 'currentColor' } : {}}
                />
              }
              onPress={() => toggleFavorite?.(product.id)}
            >
              {isFavorited ? 'Favorited' : 'Favorite'}
            </Button>

            <Button
              radius="md"
              size="sm"
              variant="bordered"
              className="bg-gray-900/50 hover:bg-gray-800/50 text-white border-white/20 font-semibold text-xs md:text-base"
              startContent={<Icon icon="lucide:sparkles" className="text-base md:text-xl" />}
              onPress={() => setShowSuggestions(true)}
            >
              Suggestions
            </Button>
            </div>
          </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Suggestions Modal */}
        <Modal 
          isOpen={showSuggestions} 
          onClose={() => setShowSuggestions(false)}
          size="2xl"
          scrollBehavior="inside"
          classNames={{
            base: "bg-gray-900 border border-white/10",
            header: "border-b border-white/10",
            body: "py-4",
          }}
        >
          <ModalContent>
            <ModalHeader className="text-white text-xl font-bold">
              Similar Products
            </ModalHeader>
            <ModalBody>
              <ScrollShadow className="max-h-[60vh]">
                {(() => {
                  const similarProducts = getSimilarProducts();
                  if (similarProducts.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-400">
                        <Icon icon="lucide:info" className="text-4xl mb-2 mx-auto" />
                        <p>No similar products found.</p>
                      </div>
                    );
                  }
                  const originalImageUrl = product?.images?.day || product?.images?.night || product?.images?.thumbnailUrl;
                  
                  // Encontrar produto original se existir
                  const originalProduct = originalProductId && products?.find(p => p.id === originalProductId);
                  const showOriginalProductOption = showAnimationSimulation && originalProductId && originalProductId !== product?.id && onResetOriginalProduct && originalProduct;
                  const originalProductImageUrl = originalProduct?.images?.day || originalProduct?.images?.night || originalProduct?.images?.thumbnailUrl;
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Opção para voltar ao produto original quando está em modo simulação animada e navegou para outro produto */}
                      {showOriginalProductOption && (
                        <div
                          key="original-product"
                          className="bg-blue-900/30 rounded-lg overflow-hidden border-2 border-blue-500/50 hover:border-blue-500 transition-all cursor-pointer group"
                          onClick={() => {
                            setShowSuggestions(false);
                            onResetOriginalProduct();
                          }}
                        >
                          {originalProductImageUrl && (
                            <div className="relative w-full aspect-square bg-black overflow-hidden">
                              <Image
                                src={originalProductImageUrl}
                                alt={originalProduct.name}
                                className="w-full h-full object-contain"
                                classNames={{
                                  wrapper: "w-full h-full",
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute top-2 right-2 bg-blue-500/90 rounded-full p-1.5">
                                <Icon icon="lucide:rotate-ccw" className="text-white text-sm" />
                              </div>
                            </div>
                          )}
                          <div className="p-3">
                            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1 flex items-center gap-1">
                              <Icon icon="lucide:rotate-ccw" className="text-xs" />
                              {originalProduct.name} (Original)
                            </h4>
                            <p className="text-white font-bold text-base">
                              €{originalProduct.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Opção para voltar ao produto original quando um vídeo de sugestão está ativo */}
                      {selectedSuggestionVideo && (
                        <div
                          className="bg-blue-900/30 rounded-lg overflow-hidden border-2 border-blue-500/50 hover:border-blue-500 transition-all cursor-pointer group"
                            onClick={() => {
                              setShowSuggestions(false);
                              setSelectedSuggestionVideo(null);
                              // Restaurar o estado de simulação animada anterior
                              setShowAnimationSimulation(previousAnimationState);
                              // Reset video e recomeçar se estava tocando
                              setTimeout(() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = 0;
                                  if (isPlaying && isActive) {
                                    videoRef.current.play().catch(err => {
                                      console.warn('Error playing video:', err);
                                    });
                                  }
                                }
                              }, 100);
                            }}
                        >
                          {originalImageUrl && (
                            <div className="relative w-full aspect-square bg-black overflow-hidden">
                              <Image
                                src={originalImageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain"
                                classNames={{
                                  wrapper: "w-full h-full",
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute top-2 right-2 bg-blue-500/90 rounded-full p-1.5">
                                <Icon icon="lucide:rotate-ccw" className="text-white text-sm" />
                              </div>
                            </div>
                          )}
                          <div className="p-3">
                            <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1 flex items-center gap-1">
                              <Icon icon="lucide:rotate-ccw" className="text-xs" />
                              {product.name} (Original)
                            </h4>
                            <p className="text-white font-bold text-base">
                              €{product.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {similarProducts.map((similarProduct) => {
                        const similarImageUrl = similarProduct?.images?.day || similarProduct?.images?.night || similarProduct?.images?.thumbnailUrl;
                        const isSimilarGX349L = similarProduct?.name === 'GX349L' || similarProduct?.id === 'prd-005';
                        const isSimilarGX350LW = similarProduct?.name === 'GX350LW' || similarProduct?.id?.includes('GX350LW');
                        const similarSupportsAnimation = isSimilarGX349L || isSimilarGX350LW;
                        
                        // Determinar se deve preservar o estado de simulação animada
                        // Preservar apenas se:
                        // 1. Estamos em modo simulação animada (não vídeo de sugestão)
                        // 2. O novo produto também suporta simulação animada
                        const shouldPreserveAnimation = showAnimationSimulation && similarSupportsAnimation;
                        
                        return (
                          <div
                            key={similarProduct.id}
                            className="bg-gray-800/50 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                            onClick={() => {
                              // Fechar o modal primeiro
                              setShowSuggestions(false);
                              
                              if (onProductSelect) {
                                // Usar setTimeout para garantir que o modal seja fechado antes de navegar
                                setTimeout(() => {
                                  // Se estiver em modo simulação animada e o novo produto suportar, preservar o estado
                                  if (shouldPreserveAnimation) {
                                    // Passar o estado de simulação animada para o novo produto e guardar o produto atual como original
                                    onProductSelect(similarProduct.id, true, product?.id); // true = iniciar em modo simulação animada, product.id = produto atual (original)
                                  } else {
                                    // Caso contrário, navegar para vídeo normal
                                    onProductSelect(similarProduct.id, false);
                                  }
                                }, 50); // Pequeno delay para garantir que o modal seja fechado
                              }
                            }}
                          >
                            {similarImageUrl && (
                              <div className="relative w-full aspect-square bg-black overflow-hidden">
                                <Image
                                  src={similarImageUrl}
                                  alt={similarProduct.name}
                                  className="w-full h-full object-contain"
                                  classNames={{
                                    wrapper: "w-full h-full",
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                            <div className="p-3">
                              <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                                {similarProduct.name}
                              </h4>
                              <p className="text-white font-bold text-base">
                                €{similarProduct.price?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </ScrollShadow>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

