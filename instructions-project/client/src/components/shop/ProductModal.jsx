import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, RadioGroup, Radio, Switch, Chip, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import DayNightToggle from "../DayNightToggle";
import RequestInfoModal from "./RequestInfoModal";
import CompareSuggestModal from "./CompareSuggestModal";
import FavoriteFolderModal from "./FavoriteFolderModal";
import { useShop } from "../../context/ShopContext";
import { ComponentsField } from "./Components/ComponentsField";
import { PrintFields } from "./Components/PrintFields";
import { WeightField } from "./Components/WeightField";
import { EffectsField } from "./Components/EffectsField";
import { AnimatedSparklesField } from "./Components/AnimatedSparklesField";
import { AluminiumField } from "./Components/AluminiumField";
import { SoftXLEDField } from "./Components/SoftXLEDField";

export default function ProductModal({ isOpen, onOpenChange, product, onOrder, enableQuantity = false }) {
  const { getAvailableStock, products, favorites, compare, toggleFavorite, toggleCompare } = useShop();
  const [mode, setMode] = React.useState("night");
  const [color, setColor] = React.useState("brancoPuro");
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [closedForCompare, setClosedForCompare] = React.useState(false);
  const handleCompareOpenChange = React.useCallback((open) => {
    setCompareOpen(open);
    if (open) {
      setClosedForCompare(true);
      if (typeof onOpenChange === 'function') onOpenChange(false);
    } else if (closedForCompare) {
      if (typeof onOpenChange === 'function') onOpenChange(true);
      setClosedForCompare(false);
    }
  }, [onOpenChange, closedForCompare]);
  const [favModalOpen, setFavModalOpen] = React.useState(false);
  // Using custom toggle; no external player
  const [qty, setQty] = React.useState(1);
  const [mediaIndex, setMediaIndex] = React.useState(0); // 0=image, 1=video
  const [videoError, setVideoError] = React.useState(false);
  const [videoSrc, setVideoSrc] = React.useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = React.useState(false);
  const videoRef = React.useRef(null);
  // Image zoom state
  const [zoom, setZoom] = React.useState(1);
  const [zoomOrigin, setZoomOrigin] = React.useState({ xPct: 50, yPct: 50 });
  

  // Active product can change when user selects a color
  const [activeProduct, setActiveProduct] = React.useState(product);
  React.useEffect(() => {
    if (isOpen) {
      setMode("night");
      setQty(1);
      setMediaIndex(0);
      setVideoError(false);
      setActiveProduct(product);
      // pick default color only when there are real variant mappings
      const defaultColor = (() => {
        const mapKeys = Object.keys(product?.variantProductByColor || {});
        if (mapKeys.length) {
          if (mapKeys.includes('brancoQuente') && String(product?.id) === 'prd-005a') return 'brancoQuente';
          if (mapKeys.includes('brancoPuro') && String(product?.id) === 'prd-006') return 'brancoPuro';
          return mapKeys[0];
        }
        return undefined;
      })();
      setColor(defaultColor);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
        setVideoSrc(null);
      }
    }
  }, [isOpen, product]);

  // Custom toggle has internal animation

  const toggleMode = () => {
    setMode((prev) => (prev === "day" ? "night" : "day"));
  };

  // No external event handling needed
  // Load video as Blob to avoid servers that don't honor Range requests (416)
  React.useEffect(() => {
    if (mediaIndex !== 1 || !activeProduct?.videoFile) return;
    // Prefer same-origin relative URL to leverage Vite proxy and avoid CORS
    const baseFromEnv = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '');
    // Use relative path by default (empty string) for same-origin requests
    const apiBase = baseFromEnv || '';
    
    // Map video path correctly (handles both /uploads/ and /api/media/)
    const mapPath = function(path) {
      if (!path) return path;
      if (apiBase) return path.indexOf('/uploads/') === 0 ? (apiBase + path) : path;
      // sem VITE_API_URL: usar /api/uploads para passar no proxy
      return path.indexOf('/uploads/') === 0 ? ('/api' + path) : path;
    };
    
    // Check if videoFile is already a full path or just a filename
    let srcUrl;
    if (activeProduct.videoFile.indexOf('/uploads/') === 0) {
      // It's a full path, use it directly with mapPath
      const mapped = mapPath(activeProduct.videoFile);
      srcUrl = mapped;
    } else {
      // It's just a filename, use /api/media
      srcUrl = `${apiBase}/api/media/${encodeURIComponent(activeProduct.videoFile)}`;
    }
    
    let revokedUrl = null;
    const controller = new AbortController();
    setIsLoadingVideo(true);
    setVideoError(false);
    fetch(srcUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        revokedUrl = objectUrl;
        setVideoSrc(objectUrl);
      })
      .catch(() => {
        // Fallback to direct URL if fetch fails (still works in most setups)
        setVideoSrc(srcUrl);
      })
      .finally(() => setIsLoadingVideo(false));

    return () => {
      controller.abort();
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [mediaIndex, activeProduct?.videoFile]);

  // Ensure autoplay/pause behavior when switching media
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (mediaIndex === 1) {
      const play = async () => { try { await v.play(); } catch {} };
      play();
    } else {
      try { v.pause(); } catch {}
    }
  }, [mediaIndex, videoSrc]);

  if (!activeProduct) return null;
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || (typeof window !== 'undefined' ? '' : '');
  const mapPath = function(path) {
    if (!path) return path;
    if (baseApi) return path.indexOf('/uploads/') === 0 ? (baseApi + path) : path;
    // sem VITE_API_URL: usar /api/uploads para passar no proxy
    return path.indexOf('/uploads/') === 0 ? ('/api' + path) : path;
  };
  const baseDay = mapPath(activeProduct.images?.day || activeProduct.imagesDayUrl || activeProduct.thumbnailUrl);
  const baseNight = mapPath(activeProduct.images?.night || activeProduct.imagesNightUrl || baseDay);
  const imageSrc = mode === "day" ? baseDay : baseNight;
  const imageSrcWithBuster = imageSrc 
    ? imageSrc + '?v=' + encodeURIComponent(String(activeProduct.updatedAt || activeProduct.id || '1')) 
    : imageSrc;
  const stock = getAvailableStock(activeProduct);
  const isOutOfStock = stock <= 0;

  const formatDimensions = (specs, product) => {
    // Prioridade: campos height/width/depth/diameter do produto (vindos do AdminProducts)
    const parts = [];
    if (product?.height != null) parts.push(`${Number(product.height).toFixed(2)} m (H)`);
    if (product?.width != null) parts.push(`${Number(product.width).toFixed(2)} m (W)`);
    if (product?.depth != null) parts.push(`${Number(product.depth).toFixed(2)} m (D)`);
    if (product?.diameter != null) parts.push(`${Number(product.diameter).toFixed(2)} m (Ø)`);
    if (parts.length > 0) return parts.join(' x ');
    
    // Fallback: specs.dimensions (formato antigo)
    const dim = specs?.dimensions;
    if (dim && (dim.widthM != null || dim.heightM != null || dim.depthM != null)) {
      const parts2 = [];
      if (dim.heightM != null) parts2.push(`${Number(dim.heightM).toFixed(2)} m (H)`);
      if (dim.widthM != null) parts2.push(`${Number(dim.widthM).toFixed(2)} m (W)`);
      if (dim.depthM != null) parts2.push(`${Number(dim.depthM).toFixed(2)} m (D)`);
      return parts2.join(' x ');
    }
    
    // Fallback: specs.dimensoes (texto)
    const s = specs?.dimensoes || specs?.dimensionsText;
    if (typeof s === 'string') {
      const regex = /([0-9]+(?:[\.,][0-9]+)?)\s*m/gi;
      const nums = [];
      let m;
      while ((m = regex.exec(s)) && nums.length < 3) {
        nums.push(parseFloat(String(m[1]).replace(',', '.')));
      }
      if (nums.length >= 2) {
        // Assume text order is W x H x D; convert to H x W x D
        const [w, h, d] = nums;
        const parts3 = [];
        if (!Number.isNaN(h)) parts3.push(`${h.toFixed(2)} m (H)`);
        if (!Number.isNaN(w)) parts3.push(`${w.toFixed(2)} m (W)`);
        if (!Number.isNaN(d)) parts3.push(`${d.toFixed(2)} m (D)`);
        return parts3.join(' x ');
      }
      return s;
    }
    return '-';
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      hideCloseButton
      classNames={{
        wrapper: "items-center justify-center",
        base: "max-w-[1400px] w-[96vw] max-h-[90vh] my-4 bg-[#e4e3e8] dark:bg-content1",
        body: "py-2",
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex gap-2 items-center justify-between">
              <div className="text-xl font-semibold flex items-center gap-3">
                {activeProduct.name}
                {isOutOfStock && (
                  <Chip size="sm" color="default" variant="solid">Out of stock</Chip>
                )}
              </div>
              {/* price moved to footer */}
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Left: Media viewer (image/video) with nav arrows */}
                <div className="relative md:col-span-3 flex flex-col">
                  {/* Media wrapper to correctly center arrows relative to image/video */}
                  <div
                    className="relative w-full h-[40vh] md:h-[42vh] lg:h-[44vh] rounded-lg overflow-hidden bg-[#1f2937] dark:bg-content2"
                    onMouseMove={(e) => {
                      if (mediaIndex !== 0) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const xPct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
                      const yPct = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
                      setZoomOrigin({ xPct, yPct });
                    }}
                    onWheel={(e) => {
                      if (mediaIndex !== 0) return;
                      e.preventDefault();
                      const next = Math.min(3, Math.max(1, zoom + (e.deltaY < 0 ? 0.2 : -0.2)));
                      setZoom(next);
                    }}
                    onDoubleClick={() => {
                      if (mediaIndex !== 0) return;
                      setZoom((z) => (z > 1 ? 1 : 2));
                    }}
                    onMouseLeave={() => setZoom(1)}
                  >
                    {mediaIndex === 0 && (
                      <img
                        src={imageSrcWithBuster || "/demo-images/placeholder.png"}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-contain select-none"
                        style={{ transform: `scale(${zoom})`, transformOrigin: `${zoomOrigin.xPct}% ${zoomOrigin.yPct}%` }}
                        draggable={false}
                        onError={(e) => {
                          if (e.target.dataset.fb === '1') return;
                          e.target.dataset.fb = '1';
                          const fallback = activeProduct?.images?.day || "/demo-images/placeholder.png";
                          e.target.src = fallback;
                        }}
                        onLoad={() => {
                          try { console.log('🖼️ [ProductModal] imagem mostrada:', imageSrcWithBuster); } catch(_) {}
                        }}
                      />
                    )}
                    {mediaIndex === 1 && activeProduct.videoFile && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        {isLoadingVideo ? (
                          <div className="text-sm text-default-500">A carregar vídeo…</div>
                        ) : (
                          <video
                            ref={videoRef}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            poster={activeProduct.images?.day}
                            className="w-full h-full object-contain bg-black"
                            onError={() => setVideoError(true)}
                            src={videoSrc || `/api/media/${encodeURIComponent(activeProduct.videoFile)}`}
                          />
                        )}
                      </div>
                    )}

                    {/* Day/Night toggle only on image */}
                    {mediaIndex === 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <DayNightToggle
                          isNight={mode === "night"}
                          onToggle={() => toggleMode()}
                          size={32}
                        />
                      </div>
                    )}

                    {/* Nav arrows inside media wrapper */}
                    {(1 + (activeProduct.videoFile ? 1 : 0)) > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Anterior"
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/60"
                          onClick={() => setMediaIndex((i) => (i - 1 + 1 + (activeProduct.videoFile ? 1 : 0)) % (1 + (activeProduct.videoFile ? 1 : 0)))}
                        >
                          <Icon icon="lucide:chevron-left" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          aria-label="Seguinte"
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/60"
                          onClick={() => setMediaIndex((i) => (i + 1) % (1 + (activeProduct.videoFile ? 1 : 0)))}
                        >
                          <Icon icon="lucide:chevron-right" className="text-xl" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails selector inside left panel (below media) */}
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label="Imagem"
                      onClick={() => setMediaIndex(0)}
                      className={`group relative w-28 h-16 rounded-md overflow-hidden border ${mediaIndex === 0 ? 'border-white ring-2 ring-white' : 'border-white/40'} bg-[#1f2937] bg-center bg-cover`}
                      style={{ backgroundImage: `url(${imageSrc})` }}
                    >
                      {/* caption removed */}
                    </button>
                    {activeProduct.videoFile && (
                      <button
                        type="button"
                        aria-label="Vídeo"
                        onClick={() => setMediaIndex(1)}
                        className={`group relative w-28 h-16 rounded-md overflow-hidden border ${mediaIndex === 1 ? 'border-white ring-2 ring-white' : 'border-white/40'} bg-[#1f2937] bg-center bg-cover`}
                        style={{ backgroundImage: `url(${activeProduct.images?.day || imageSrc})` }}
                      >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-7 h-7 drop-shadow-md transition-transform duration-200 group-hover:scale-105"
                          viewBox="0 0 100 100"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <defs>
                            <linearGradient id="playGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0" stopColor="#ffffff" />
                              <stop offset="1" stopColor="#e6f0ff" />
                            </linearGradient>
                            <filter id="playShadow" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#74a7ff" floodOpacity="0.55" />
                            </filter>
                          </defs>
                          {/* Rounded triangular play shape */}
                          <path
                            d="M32 20 C28 20 26 22 26 26 L26 74 C26 78 28 80 32 80 L78 52 C82 50 82 46 78 44 Z"
                            fill="url(#playGrad)"
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth="2"
                            filter="url(#playShadow)"
                          />
                        </svg>
                      </div>
                        {/* caption removed */}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Details */}
                <div className="md:col-span-2 overflow-auto">
                  <div className="grid grid-cols-1 gap-y-3 text-base text-default-600">
                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:ruler" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Dimensions</div>
                        <div>{formatDimensions(activeProduct.specs, activeProduct)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:layers" className="text-default-500 text-lg mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <div className="text-default-500 text-sm mb-3">Materials</div>
                          <div className="space-y-3">
                            {(() => {
                              // Debug: log specs for troubleshooting
                              if (activeProduct.id === 'IPL317R') {
                                console.log('🔍 [ProductModal] IPL317R specs:', {
                                  printType: activeProduct.specs?.printType,
                                  printColor: activeProduct.specs?.printColor,
                                  effects: activeProduct.specs?.effects,
                                  sparkles: activeProduct.specs?.sparkles,
                                  materiais: activeProduct.specs?.materiais
                                });
                              }
                              return null;
                            })()}
                            <ComponentsField materials={activeProduct.specs?.materiais} />
                            <PrintFields printType={activeProduct.specs?.printType} printColor={activeProduct.specs?.printColor} />
                            <SoftXLEDField softXLED={activeProduct.specs?.softXLED} />
                            <EffectsField effects={activeProduct.specs?.effects} />
                            <AnimatedSparklesField sparkles={activeProduct.specs?.sparkles} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {activeProduct.specs?.weight && (
                      <div className="flex items-start gap-2">
                        <Icon icon="lucide:scale" className="text-default-500 text-lg mt-0.5" />
                        <div>
                          <div className="text-default-500 text-sm">Weight</div>
                          <div>{activeProduct.specs.weight} kg</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:file-text" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Description</div>
                        <div>{activeProduct.specs?.descricao}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:cpu" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Technical</div>
                        <div>{activeProduct.specs?.tecnicas}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price and stock stacked */}
                  <div className="mt-5">
                    <div className="text-2xl font-bold text-primary">€{activeProduct.price}</div>
                    <div className="mt-1.5 text-sm">
                      <span className="text-default-500 mr-1">Stock:</span>
                      {isOutOfStock ? (
                        <span className="text-danger-400">Out of stock</span>
                      ) : (
                        <span className={`${stock <= 10 ? 'text-warning' : 'text-default-600'}`}>{stock}</span>
                      )}
                    </div>
                    {(() => {
                      const colorKeys = Object.keys(activeProduct?.variantProductByColor || {});
                      return colorKeys.length > 0 ? (
                      <div className="mt-3">
                        <div className="text-sm text-default-500 mb-1">Color</div>
                        <div className="flex items-center gap-2">
                          {colorKeys.map((key) => (
                            <button
                              key={key}
                              type="button"
                              className={`w-6 h-6 rounded-full border ${color === key ? 'ring-2 ring-primary' : 'border-default-200'}`}
                              style={{ background: key === 'brancoPuro' ? '#ffffff' : key === 'brancoQuente' ? '#fbbf24' : '#e5e7eb', boxShadow: key === 'brancoPuro' ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined }}
                              onClick={() => {
                                setColor(key);
                                const map = activeProduct?.variantProductByColor;
                                const targetId = map ? map[key] : null;
                                if (targetId && targetId !== activeProduct.id) {
                                  const next = products.find((p) => p.id === targetId);
                                  if (next) setActiveProduct(next);
                                }
                              }}
                              aria-label={key}
                            />
                          ))}
                        </div>
                      </div>
                      ) : null;
                    })()}
                    {/* removed auxiliary video action buttons */}
                    {enableQuantity && (
                      <div className="mt-3">
                        <div className="text-sm text-default-500 mb-1">Quantity</div>
                        <Input
                          type="number"
                          size="sm"
                          min={1}
                          value={String(qty)}
                          onChange={(e)=> {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setQty(val);
                          }}
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>
                </div>

                
              </div>
            {/* Inline video handled in media viewer above */}
            </ModalBody>
            <ModalFooter>
              <div className="flex items-center gap-2">
                <Button 
                  variant="flat" 
                  onPress={close}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                >
                  Close
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => setFavModalOpen(true)}
                  startContent={
                    <Icon 
                      icon={favorites?.includes(activeProduct.id) ? "mdi:heart" : "mdi:heart-outline"} 
                      className={`text-lg ${favorites?.includes(activeProduct.id) ? 'text-danger' : ''}`}
                      style={favorites?.includes(activeProduct.id) ? { fill: '#f31260' } : {}}
                    />
                  }
                >
                  Favorite
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => { if (!compare?.includes(activeProduct.id)) toggleCompare(activeProduct.id); handleCompareOpenChange(true); }}
                  startContent={<Icon icon="lucide:shuffle" />}
                >
                  Compare
                </Button>
                <Button color="primary" isDisabled={isOutOfStock} onPress={() => { onOrder?.(activeProduct, { mode, color }, enableQuantity ? qty : undefined); close(); }}>Add</Button>
                {isOutOfStock && (
                  <Button variant="bordered" onPress={() => setInfoOpen(true)}>Request info</Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    <RequestInfoModal isOpen={infoOpen} onOpenChange={setInfoOpen} product={activeProduct} />
    <CompareSuggestModal
      isOpen={compareOpen}
      onOpenChange={handleCompareOpenChange}
      baseProduct={activeProduct}
      onAdd={(p)=>{ toggleCompare(p.id); }}
    />
    <FavoriteFolderModal isOpen={favModalOpen} onOpenChange={setFavModalOpen} productId={activeProduct?.id} />
    </>
  );
}


