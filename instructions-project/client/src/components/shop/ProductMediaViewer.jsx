import React from "react";
import { Icon } from "@iconify/react";
import DayNightToggle from "../ui/DayNightToggle";

export default function ProductMediaViewer({ product, initialMode = "night", className = "" }) {
  const [mode, setMode] = React.useState(initialMode);
  const [mediaIndex, setMediaIndex] = React.useState(0); // 0=image, 1=video
  const [videoError, setVideoError] = React.useState(false);
  const [videoSrc, setVideoSrc] = React.useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = React.useState(false);
  const videoRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(1);
  const [zoomOrigin, setZoomOrigin] = React.useState({ xPct: 50, yPct: 50 });

  React.useEffect(() => {
    setMode(initialMode);
    setMediaIndex(0);
    setVideoError(false);
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
      setVideoSrc(null);
    }
    setZoom(1);
  }, [product, initialMode]);

  React.useEffect(() => {
    if (mediaIndex !== 1 || !product?.videoFile) return;
    // Use relative path by default for same-origin requests
    const baseFromEnv = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '');
    const apiBase = baseFromEnv || '';
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
        setVideoSrc(srcUrl);
      })
      .finally(() => setIsLoadingVideo(false));

    return () => {
      controller.abort();
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [mediaIndex, product?.videoFile]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (mediaIndex === 1) {
      const play = async () => { try { await v.play(); } catch { } };
      play();
    } else {
      try { v.pause(); } catch { }
    }
  }, [mediaIndex, videoSrc]);

  if (!product) return null;
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
  const mapPath = function (path) {
    if (!path) return path;
    if (baseApi) return path.indexOf('/uploads/') === 0 ? (baseApi + path) : path;
    return path.indexOf('/uploads/') === 0 ? ('/api' + path) : path;
  };
  let baseDay = mapPath(product.images?.day || product.imagesDayUrl || product.thumbnailUrl);
  let baseNight = mapPath(product.images?.night || product.imagesNightUrl || baseDay);
  // Filtrar URLs temporárias
  if (baseNight && (baseNight.includes('temp_') || baseNight.includes('temp_nightImage_'))) {
    baseNight = baseDay; // Fallback para day image se night for temporária
  }
  if (baseDay && (baseDay.includes('temp_') || baseDay.includes('temp_nightImage_'))) {
    baseDay = null; // Se day também for temporária, usar placeholder
  }
  const imageSrc = mode === "day" ? baseDay : baseNight;
  const imageSrcWithBuster = imageSrc;

  const totalMedia = 1 + (product?.videoFile ? 1 : 0);

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div
        className="relative w-full h-[32vh] md:h-[36vh] lg:h-[38vh] rounded-lg overflow-hidden bg-[#1f2937] dark:bg-content2"
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
              // Filtrar URLs temporárias no fallback também
              let fallback = product?.images?.day || "/demo-images/placeholder.png";
              if (fallback && (fallback.includes('temp_') || fallback.includes('temp_nightImage_'))) {
                fallback = "/demo-images/placeholder.png";
              }
              e.target.src = fallback;
            }}
            onLoad={() => {
              try { console.log('🖼️ [ProductMediaViewer] imagem mostrada:', imageSrcWithBuster); } catch (_) { }
            }}
          />
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
                src={videoSrc || `/api/media/${encodeURIComponent(product.videoFile)}`}
              />
            )}
          </div>
        )}

        {mediaIndex === 0 && (
          <div className="absolute top-3 right-3 z-10">
            <DayNightToggle
              isNight={mode === "night"}
              onToggle={() => setMode((m) => (m === "day" ? "night" : "day"))}
              size={28}
            />
          </div>
        )}

        {totalMedia > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/60"
              onClick={() => setMediaIndex((i) => (i - 1 + totalMedia) % totalMedia)}
            >
              <Icon icon="lucide:chevron-left" className="text-xl" />
            </button>
            <button
              type="button"
              aria-label="Seguinte"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/60"
              onClick={() => setMediaIndex((i) => (i + 1) % totalMedia)}
            >
              <Icon icon="lucide:chevron-right" className="text-xl" />
            </button>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-[#1f2937] text-white shadow-md">
          <button
            type="button"
            aria-label="Image"
            onClick={() => setMediaIndex(0)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${mediaIndex === 0 ? 'bg-[#111827] text-white border-white/20' : 'bg-transparent text-white/80 border-white/20 hover:bg-white/10'}`}
          >
            <Icon icon="lucide:image" className={`text-sm ${mediaIndex === 0 ? 'text-white' : 'text-white/80'}`} />
            <span className="text-xs font-medium">Image</span>
          </button>
          {product.videoFile && (
            <button
              type="button"
              aria-label="Video"
              onClick={() => setMediaIndex(1)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${mediaIndex === 1 ? 'bg-[#111827] text-white border-white/20' : 'bg-transparent text-white/80 border-white/20 hover:bg-white/10'}`}
            >
              <Icon icon="lucide:play-circle" className={`text-sm ${mediaIndex === 1 ? 'text-white' : 'text-white/80'}`} />
              <span className="text-xs font-medium">Video</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


