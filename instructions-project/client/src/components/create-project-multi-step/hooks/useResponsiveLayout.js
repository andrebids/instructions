import { useState, useEffect } from 'react';

/**
 * Hook para detectar se estamos em mobile/tablet landscape
 * Retorna informações sobre tamanho da tela e se deve usar drawer
 * 
 * @returns {Object} - { isMobile, isTablet, isLandscape, shouldUseDrawer, width, height }
 */
export const useResponsiveLayout = () => {
  const [windowSize, setWindowSize] = useState({
    width: 1024, // Valores padrão seguros
    height: 768,
  });

  useEffect(() => {
    // Função segura para obter dimensões sem forçar layout
    const safeGetSize = () => {
      if (typeof window === 'undefined') return { width: 1024, height: 768 };
      
      // Aguardar que o documento esteja pronto antes de medir
      if (document.readyState !== 'complete') {
        return { width: 1024, height: 768 };
      }
      
      try {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      } catch (e) {
        return { width: 1024, height: 768 };
      }
    };

    const handleResize = () => {
      // Usar requestAnimationFrame para evitar forçar layout
      requestAnimationFrame(() => {
        const size = safeGetSize();
        setWindowSize(size);
      });
    };

    // Aguardar que o documento esteja pronto antes de medir
    const initSize = () => {
      if (document.readyState === 'complete') {
        requestAnimationFrame(() => {
          const size = safeGetSize();
          setWindowSize(size);
        });
      } else {
        window.addEventListener('load', () => {
          requestAnimationFrame(() => {
            const size = safeGetSize();
            setWindowSize(size);
          });
        }, { once: true });
      }
    };

    initSize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const width = windowSize.width;
  const height = windowSize.height;
  const isLandscape = width > height;
  const isPortrait = height > width;

  // Breakpoints baseados em Tailwind
  // sm: 640px, md: 768px, lg: 1024px, xl: 1280px
  const isMobile = width < 768; // < md
  const isTablet = width >= 768 && width < 1280; // md a xl (inclui tablets maiores)
  const isDesktop = width >= 1280; // >= xl

  // Detectar se é tablet baseado em user agent também
  const isTabletDevice = typeof navigator !== 'undefined' && 
    (/iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent));

  // Usar drawer se:
  // 1. Está em mobile (< 768px) OU
  // 2. Está em tablet (768-1280px) OU
  // 3. É um dispositivo tablet detectado pelo user agent OU
  // 4. Está em landscape e tem largura < 1400px (para tablets maiores)
  const shouldUseDrawer = isMobile || isTablet || isTabletDevice || (isLandscape && width < 1400);

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isLandscape,
    isPortrait,
    shouldUseDrawer,
  };
};

