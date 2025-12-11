// Utilidades para posicionar e dimensionar decorações (PNG) no canvas
// Tamanho base ampliado (~3x+) para inserção inicial
export const BASE_DECORATION_SIZE = 1200;
export const MIN_DECORATION_SIZE = 180;

// Cache simples em memória para dimensões de imagens
const imageSizeCache = new Map(); // key: src -> { width, height }

export const getCachedImageSize = (src) => {
  if (!src) return null;
  return imageSizeCache.get(src) || null;
};

const setCachedImageSize = (src, dims) => {
  if (!src || !dims) return;
  imageSizeCache.set(src, dims);
};

/**
 * Pré-carrega uma imagem para obter dimensões naturais.
 * @param {string} src
 * @returns {Promise<{ width: number, height: number } | null>}
 */
export const preloadImageSize = (src) => {
  if (!src) return Promise.resolve(null);

  const cached = getCachedImageSize(src);
  if (cached) {
    console.log('[decorationPlacement] preloadImageSize cache hit', { src, dims: cached });
    return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const start = performance.now?.() || Date.now();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => {
      console.warn('[decorationPlacement] preloadImageSize error', { src, durationMs: (performance.now?.() || Date.now()) - start });
      resolve(null);
    };
    img.src = src;
    console.log('[decorationPlacement] preloadImageSize start', { src });
  }).then((dims) => {
    if (dims && dims.width && dims.height) {
      setCachedImageSize(src, dims);
    }
    return dims;
  });
};

/**
 * Calcula tamanho inicial mantendo proporção, limitando o maior lado a base.
 */
export const computeInitialSizeFromImageDims = (
  dims,
  baseSize = BASE_DECORATION_SIZE,
  minSize = MIN_DECORATION_SIZE
) => {
  const start = performance.now?.() || Date.now();
  if (!dims || !dims.width || !dims.height) {
    return { width: baseSize, height: baseSize };
  }

  const { width, height } = dims;
  if (width <= 0 || height <= 0) {
    return { width: baseSize, height: baseSize };
  }

  if (width === height) {
    return { width: baseSize, height: baseSize };
  }

  if (width > height) {
    const w = baseSize;
    const h = Math.max(minSize, (baseSize * height) / width);
    return { width: w, height: h };
  }

  const h = baseSize;
  const w = Math.max(minSize, (baseSize * width) / height);
  const res = { width: w, height: h };
  const duration = (performance.now?.() || Date.now()) - start;
  if (duration > 16) {
    console.log('[decorationPlacement] computeInitialSizeFromImageDims slow', { dims, res, durationMs: duration });
  }
  return res;
};

/**
 * Desloca posição se já houver decoração próxima (colisão simples).
 */
export const offsetIfColliding = (decorations = [], x, y, step = 10, maxTries = 8) => {
  let nextX = x;
  let nextY = y;

  const isColliding = (cx, cy) =>
    decorations.some((d) => {
      const dx = Math.abs((d.x ?? 0) - cx);
      const dy = Math.abs((d.y ?? 0) - cy);
      return dx < step && dy < step;
    });

  let tries = 0;
  while (tries < maxTries && isColliding(nextX, nextY)) {
    nextX += step;
    nextY += step;
    tries += 1;
  }

  return { x: nextX, y: nextY };
};

