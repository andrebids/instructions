import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useShop } from '../../context/ShopContext';

/**
 * Product card for TikTok-style feed
 * Displays video (if available) or image with product information on the side
 */
export default function ProductFeedCard({ product, isActive = false, onPlay, onPause }) {
  const videoRef = useRef(null);
  const infoPanelRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { toggleFavorite, favorites, getAvailableStock } = useShop();

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

          {/* Discount badge */}
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

          {/* Open button - visible when panel is closed */}
          {!isInfoOpen && (
            <Button
              isIconOnly
              radius="full"
              size="lg"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80"
              onPress={() => setIsInfoOpen(true)}
              aria-label="Open product info"
            >
              <Icon icon="lucide:chevron-left" className="text-2xl" />
            </Button>
          )}
        </div>

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
                className="absolute inset-0 bg-black/30 backdrop-blur-sm z-30"
                onClick={() => setIsInfoOpen(false)}
              />

              {/* Panel */}
              <motion.div
                ref={infoPanelRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 h-full w-[40%] md:w-[30%] bg-black/98 backdrop-blur-sm p-3 md:p-8 flex flex-col justify-between overflow-y-auto border-l border-white/5 z-40"
                onClick={(e) => e.stopPropagation()}
              >
          {/* Main information */}
          <div className="flex-1 flex flex-col justify-end space-y-3 md:space-y-6">
            {/* Product name - Maximum emphasis */}
            <div>
              <h3 className="text-white text-lg md:text-3xl font-extrabold mb-1 md:mb-3 leading-tight tracking-tight line-clamp-2">
                {product.name}
              </h3>
            </div>
            
            {/* Price - Second emphasis */}
            <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
              <span className="text-white text-xl md:text-4xl font-black leading-none">
                €{product.price?.toFixed(2) || '0.00'}
              </span>
              {product.oldPrice && (
                <span className="text-gray-400 line-through text-sm md:text-xl font-medium">
                  €{product.oldPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock and Tags - Grouped */}
            <div className="space-y-2 md:space-y-3">
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
              <div className="space-y-1.5 md:space-y-2">
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

            {/* Dimensions */}
            {(product.height || product.width || product.depth || product.diameter) && (
              <div className="space-y-1.5 md:space-y-2">
                <div className="text-gray-500 text-xs md:text-sm font-medium">Dimensions</div>
                <div className="space-y-0.5 md:space-y-1">
                  {product.height && (
                    <div className="text-xs md:text-sm">
                      <span className="text-gray-400">H: </span>
                      <span className="text-white font-medium">{product.height}m</span>
                    </div>
                  )}
                  {product.width && (
                    <div className="text-xs md:text-sm">
                      <span className="text-gray-400">W: </span>
                      <span className="text-white font-medium">{product.width}m</span>
                    </div>
                  )}
                  {product.depth && (
                    <div className="text-xs md:text-sm">
                      <span className="text-gray-400">D: </span>
                      <span className="text-white font-medium">{product.depth}m</span>
                    </div>
                  )}
                  {product.diameter && (
                    <div className="text-xs md:text-sm">
                      <span className="text-gray-400">Ø: </span>
                      <span className="text-white font-medium">{product.diameter}m</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {formattedDescription && (
              <div className="space-y-1.5 md:space-y-2">
                <p className="text-white text-sm md:text-base leading-relaxed">
                  {formattedDescription}
                </p>
              </div>
            )}

            {/* Technical specifications */}
            {product.specs && (
              <div className="space-y-2 md:space-y-3">
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
          </div>

          {/* Close button */}
          <div className="flex justify-between items-center mb-2">
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

          {/* Action buttons */}
          <div className="flex flex-col gap-2 md:gap-3 pt-3 md:pt-6 mt-3 md:mt-6 border-t border-white/10">
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
              startContent={<Icon icon="lucide:share-2" className="text-base md:text-xl" />}
            >
              Share
            </Button>
          </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

