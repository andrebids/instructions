import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Image, RadioGroup, Radio, Switch, Chip, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import DayNightToggle from "../DayNightToggle";
import RequestInfoModal from "./RequestInfoModal";
import { useShop } from "../../context/ShopContext";

export default function ProductModal({ isOpen, onOpenChange, product, onOrder, enableQuantity = false }) {
  const { getAvailableStock } = useShop();
  const [mode, setMode] = React.useState("night");
  const [color, setColor] = React.useState("brancoPuro");
  const [infoOpen, setInfoOpen] = React.useState(false);
  // Using custom toggle; no external player
  const [qty, setQty] = React.useState(1);
  const [mediaIndex, setMediaIndex] = React.useState(0); // 0=image, 1=video
  const [videoError, setVideoError] = React.useState(false);
  const [videoSrc, setVideoSrc] = React.useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = React.useState(false);
  const videoRef = React.useRef(null);
  

  React.useEffect(() => {
    if (isOpen) {
      setMode("night");
      setColor("brancoPuro");
      setQty(1);
      setMediaIndex(0);
      setVideoError(false);
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
        setVideoSrc(null);
      }
    }
  }, [isOpen]);

  // Custom toggle has internal animation

  const toggleMode = () => {
    setMode((prev) => (prev === "day" ? "night" : "day"));
  };

  // No external event handling needed
  // Load video as Blob to avoid servers that don't honor Range requests (416)
  React.useEffect(() => {
    if (mediaIndex !== 1 || !product?.videoFile) return;
    const apiBase = (import.meta?.env?.VITE_API_BASE) || 'http://localhost:5000';
    const srcUrl = `${apiBase}/api/media/${encodeURIComponent(product.videoFile)}`;
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
  }, [mediaIndex, product?.videoFile]);

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

  if (!product) return null;
  const imageSrc = mode === "day" ? product.images?.day : product.images?.night;
  const stock = getAvailableStock(product);
  const isOutOfStock = stock <= 0;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        wrapper: "items-center justify-center",
        base: "max-w-[1400px] w-[96vw] max-h-[90vh] my-4",
        body: "py-2",
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex gap-2 items-center justify-between">
              <div className="text-xl font-semibold flex items-center gap-3">
                {product.name}
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
                  <div className="relative w-full h-[40vh] md:h-[42vh] lg:h-[44vh] rounded-lg overflow-hidden bg-content2">
                    {mediaIndex === 0 && (
                      <Image removeWrapper src={imageSrc} alt={product.name} className="w-full h-full object-contain" />
                    )}
                    {mediaIndex === 1 && product.videoFile && (
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
                            poster={product.images?.day}
                            className="w-full h-full object-contain bg-black"
                            onError={() => setVideoError(true)}
                            src={videoSrc || `${((import.meta?.env?.VITE_API_BASE) || 'http://localhost:5000')}/api/media/${encodeURIComponent(product.videoFile)}`}
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
                    {(1 + (product.videoFile ? 1 : 0)) > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Anterior"
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/60"
                          onClick={() => setMediaIndex((i) => (i - 1 + 1 + (product.videoFile ? 1 : 0)) % (1 + (product.videoFile ? 1 : 0)))}
                        >
                          <Icon icon="lucide:chevron-left" className="text-xl" />
                        </button>
                        <button
                          type="button"
                          aria-label="Seguinte"
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/60"
                          onClick={() => setMediaIndex((i) => (i + 1) % (1 + (product.videoFile ? 1 : 0)))}
                        >
                          <Icon icon="lucide:chevron-right" className="text-xl" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails selector inside left panel (below media) */}
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      aria-label="Imagem"
                      onClick={() => setMediaIndex(0)}
                      className={`group relative w-28 h-16 rounded-md overflow-hidden border ${mediaIndex === 0 ? 'border-white ring-2 ring-white' : 'border-white/50'} bg-center bg-cover`}
                      style={{ backgroundImage: `url(${imageSrc})` }}
                    >
                      {/* caption removed */}
                    </button>
                    {product.videoFile && (
                      <button
                        type="button"
                        aria-label="Vídeo"
                        onClick={() => setMediaIndex(1)}
                        className={`group relative w-28 h-16 rounded-md overflow-hidden border ${mediaIndex === 1 ? 'border-white ring-2 ring-white' : 'border-white/50'} bg-center bg-cover`}
                        style={{ backgroundImage: `url(${product.images?.day || imageSrc})` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon icon="lucide:play-circle" className="text-white text-2xl drop-shadow" />
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
                        <div>{product.specs?.dimensoes}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:layers" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Materials</div>
                        <div>{product.specs?.materiais}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:cpu" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Technical</div>
                        <div>{product.specs?.tecnicas}</div>
                      </div>
                    </div>

                    {product.specs?.weight && (
                      <div className="flex items-start gap-2">
                        <Icon icon="lucide:scale" className="text-default-500 text-lg mt-0.5" />
                        <div>
                          <div className="text-default-500 text-sm">Weight</div>
                          <div>{product.specs?.weight}</div>
                        </div>
                      </div>
                    )}

                    {product.specs?.effects && (
                      <div className="flex items-start gap-2">
                        <Icon icon="lucide:sparkles" className="text-default-500 text-lg mt-0.5" />
                        <div>
                          <div className="text-default-500 text-sm">LED / Effects</div>
                          <div>{product.specs?.effects}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Icon icon="lucide:file-text" className="text-default-500 text-lg mt-0.5" />
                      <div>
                        <div className="text-default-500 text-sm">Description</div>
                        <div>{product.specs?.descricao}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price and stock stacked */}
                  <div className="mt-5">
                    <div className="text-2xl font-bold text-primary">€{product.price}</div>
                    <div className="mt-1.5 text-sm">
                      <span className="text-default-500 mr-1">Stock:</span>
                      {isOutOfStock ? (
                        <span className="text-danger-400">Out of stock</span>
                      ) : (
                        <span className={`${stock <= 10 ? 'text-warning' : 'text-default-600'}`}>{stock}</span>
                      )}
                    </div>
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
                <Button variant="flat" onPress={close}>Close</Button>
                <Button color="primary" isDisabled={isOutOfStock} onPress={() => { onOrder?.({ mode, color }, enableQuantity ? qty : undefined); close(); }}>Add</Button>
                {isOutOfStock && (
                  <Button variant="bordered" onPress={() => setInfoOpen(true)}>Request info</Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    <RequestInfoModal isOpen={infoOpen} onOpenChange={setInfoOpen} product={product} />
    </>
  );
}


