import { useState, useEffect, useRef } from 'react';

/**
 * Hook para lazy loading de imagens usando IntersectionObserver
 * Carrega a imagem apenas quando ela entra no viewport
 * 
 * @param {string} src - URL da imagem a ser carregada
 * @param {object} options - Opções do IntersectionObserver
 * @param {string} options.rootMargin - Margem do root (ex: '50px' para pré-carregar 50px antes)
 * @param {number} options.threshold - Threshold de visibilidade (0 a 1)
 * @returns {object} { imageSrc, isLoaded, isInView }
 */
export function useLazyImage(src, options = {}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  const { rootMargin = '50px', threshold = 0.01 } = options;

  useEffect(() => {
    // Se não há src, resetar estado
    if (!src) {
      setImageSrc(null);
      setIsLoaded(false);
      setIsInView(false);
      return;
    }

    const imgElement = imgRef.current;
    if (!imgElement) {
      return;
    }

    // Limpar observer anterior se existir
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Resetar estado quando src mudar
    setImageSrc(null);
    setIsLoaded(false);
    setIsInView(false);

    // Criar IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Carregar a imagem quando entrar no viewport
            setImageSrc(src);
            
            // Pré-carregar a imagem para verificar se carrega corretamente
            const img = new Image();
            img.onload = () => {
              setIsLoaded(true);
            };
            img.onerror = () => {
              setIsLoaded(false);
            };
            img.src = src;

            // Parar de observar após detectar visibilidade
            if (observerRef.current && imgElement) {
              observerRef.current.unobserve(imgElement);
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Começar a observar o elemento
    observerRef.current.observe(imgElement);

    // Cleanup
    return () => {
      if (observerRef.current && imgElement) {
        observerRef.current.unobserve(imgElement);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      observerRef.current = null;
    };
  }, [src, rootMargin, threshold]);

  return {
    imageSrc,
    isLoaded,
    isInView,
    imgRef,
  };
}


