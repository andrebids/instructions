import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Chip, Modal, ModalContent, ModalHeader, ModalBody, ScrollShadow, Image } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useShop } from '../../context/ShopContext';

/**
 * Product card for TikTok-style feed
 * Displays video (if available) or image with product information on the side
 */
export default function ProductFeedCard({ product, isActive = false, onPlay, onPause, onProductSelect }) {
  const videoRef = useRef(null);
  const infoPanelRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toggleFavorite, favorites, getAvailableStock, products } = useShop();

  const isFavorited = favorites?.includes(product?.id);
  const stock = getAvailableStock?.(product) ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 10;

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

  // Check if product has video
  useEffect(() => {
    const videoUrl = product?.videoFile || product?.animationUrl;
    setHasVideo(Boolean(videoUrl));
  }, [product]);

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
        console.warn('Error playing video:', err);
      });
      setIsPlaying(true);
      onPlay?.();
    }
  };

  // Build video URL
  const getVideoUrl = () => {
    const videoFile = product?.videoFile || product?.animationUrl;
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
  const getSimilarProducts = useCallback(() => {
    if (!products || !Array.isArray(products) || !product) return [];
    
    const currentProduct = product;
    const similarities = products
      .filter(p => p.id !== currentProduct.id)
      .map(p => {
        let score = 0;
        
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
      <div className="flex w-full h-full relative">
        {/* Video/image area - full width */}
        <div 
          className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
          onClick={handleVideoClick}
        >
          {hasVideo && videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              loop
              muted
              playsInline
              preload="metadata"
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
            />
          )}

          {/* Control overlay when paused */}
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

        </div>

        {/* Main information overlay - compact, positioned at top-right corner to minimize overlap */}
        {!isInfoOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
                         className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 lg:top-6 lg:right-6 z-40 bg-black/90 backdrop-blur-md rounded-md sm:rounded-lg md:rounded-xl px-2 py-2 sm:px-2.5 sm:py-2.5 md:px-4 md:py-3 lg:px-5 lg:py-4 border border-white/20 shadow-2xl pointer-events-auto max-w-[160px] md:max-w-[240px] lg:max-w-[280px]"
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
                         className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80"
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
                                 className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={() => setIsInfoOpen(false)}
              />

              {/* Panel */}
              <motion.div
                ref={infoPanelRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                 className="absolute right-0 top-0 h-full w-[40%] md:w-[30%] bg-black/98 backdrop-blur-sm p-3 md:p-6 flex flex-col overflow-y-auto border-l border-white/5 z-50"
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
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {similarProducts.map((similarProduct) => {
                        const similarImageUrl = similarProduct?.images?.day || similarProduct?.images?.night || similarProduct?.images?.thumbnailUrl;
                        return (
                          <div
                            key={similarProduct.id}
                            className="bg-gray-800/50 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                            onClick={() => {
                              setShowSuggestions(false);
                              if (onProductSelect) {
                                onProductSelect(similarProduct.id);
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

