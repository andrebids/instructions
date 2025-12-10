import React, { useState, useEffect } from 'react';

export const NightThumb = ({ 
  dayImage, 
  nightImage, 
  filename, 
  isActive, 
  duration = 4000,
  objectPosition = '50% 50%'
}) => {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nightImageLoaded, setNightImageLoaded] = useState(false);
  const [isConverted, setIsConverted] = useState(false);

  useEffect(() => {
    let timeoutId = null;
    let animationFrameId = null;
    let finalFrameId = null;

    if (isActive && nightImage) {
      // Usar setTimeout para evitar setState síncrono em effect
      timeoutId = setTimeout(() => {
        setIsAnimating(true);
        setProgress(0);
        
        // Animar progresso de 0 a 100% durante a duração
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.min((elapsed / duration) * 100, 100);
          setProgress(newProgress);
          
          if (newProgress < 100) {
            animationFrameId = requestAnimationFrame(animate);
          } else {
            // Aguardar um frame adicional para garantir que o último frame seja renderizado
            // antes de mudar para o estado convertido
            finalFrameId = requestAnimationFrame(() => {
              setIsAnimating(false);
              setIsConverted(true);
            });
          }
        };
        
        animationFrameId = requestAnimationFrame(animate);
      }, 0);
    } else {
      timeoutId = setTimeout(() => {
        setIsAnimating(false);
        setProgress(0);
      }, 0);
    }

    // Cleanup: cancelar timeout e animation frames quando o effect re-executa ou componente desmonta
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (finalFrameId) {
        cancelAnimationFrame(finalFrameId);
      }
    };
  }, [isActive, duration, nightImage]);

  // Se não há nightImage, não mostrar animação
  if (!nightImage) {
    return null;
  }

  // Antes de converter: não mostrar nada por cima do thumbnail
  if (!isActive && !isConverted) {
    return null;
  }

  // Depois de converter: mostrar versão noite com hover para dia e badge
  if (!isActive && isConverted) {
    return (
      <div className="absolute inset-0 z-20 pointer-events-none group">
        {/* Imagem do dia (base) - visível no hover */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-100 opacity-0">
          <img 
            src={dayImage} 
            alt={`${filename} - Day`}
            className="w-full h-full object-cover"
            style={{ objectPosition }}
          />
        </div>
        
        {/* Imagem da noite convertida (sem filtro) */}
        <div 
          className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 opacity-100">
          <img 
            src={nightImage} 
            alt={`${filename} - Night`}
            className="w-full h-full object-cover"
            style={{ objectPosition }}
            onLoad={() => setNightImageLoaded(true)}
            onError={(e) => {
              // Fallback visual se imagem falhar
              e.target.style.filter = 'brightness(0.2) contrast(2) saturate(0)';
              e.target.style.backgroundColor = '#1e3a8a';
            }}
          />
        </div>
        
        {/* Overlay azul noturno subtil */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-0"
          style={{
            background: `rgba(30, 58, 138, 0.08)`,
            opacity: 1
          }}
        />
        
        {/* Ícone de modo noite (subtil) */}
        <div className="absolute top-2 left-2 pointer-events-none group-hover:opacity-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] leading-none text-white shadow-sm">
            <svg className="w-3 h-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            <span>Night</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Durante conversão (animação activa)
  if (!isAnimating) return null;

  // Calcular valores suaves para transição gradual
  // Ambas as imagens ficam visíveis durante a maior parte da transição
  // Imagem de dia: blur aumenta gradualmente de 0 a 25px, opacity diminui suavemente
  const dayBlur = (progress / 100) * 25; // Blur de 0 a 25px
  
  // Opacity da imagem de dia: mantém visível até 80%, depois desaparece suavemente
  let dayOpacity;
  if (progress <= 80) {
    dayOpacity = 1 - (progress / 100) * 0.5; // De 1.0 a 0.5 até 80%
  } else {
    dayOpacity = 0.5 - ((progress - 80) / 20) * 0.5; // De 0.5 a 0 nos últimos 20%
  }
  
  // Imagem de noite: começa desfocada e vai ficando nítida gradualmente
  const nightBlur = 25 - (progress / 100) * 25; // Blur de 25px a 0px (fica nítida gradualmente)
  
  // Opacity da imagem de noite: aparece gradualmente ao longo da transição, garantindo 1.0 no final
  let nightOpacity;
  if (progress <= 20) {
    nightOpacity = (progress / 100) * 0.4; // De 0 a 0.08 até 20%
  } else {
    nightOpacity = 0.08 + ((progress - 20) / 80) * 0.92; // De 0.08 a 1.0 dos 20% aos 100%
  }
  
  // Garantir que no final (100%) a imagem de noite está totalmente visível e nítida
  const finalNightOpacity = progress >= 100 ? 1 : nightOpacity;
  const finalNightBlur = progress >= 100 ? 0 : Math.max(0, nightBlur);
  const finalDayOpacity = progress >= 100 ? 0 : Math.max(0, dayOpacity);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Container para as duas imagens com cross-fade */}
      <div className="relative w-full h-full">
        {/* Imagem do dia (base) - com blur progressivo e fade suave */}
        <div 
          className="absolute inset-0">
          <img 
            src={dayImage} 
            alt={`${filename} - Day`}
            className="w-full h-full object-cover"
            style={{ objectPosition }}
            style={{
              filter: `blur(${dayBlur}px)`,
              opacity: finalDayOpacity,
              willChange: 'filter, opacity'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        {/* Imagem da noite - começa desfocada e vai ficando nítida */}
        <div 
          className="absolute inset-0"
          style={{ 
            opacity: finalNightOpacity,
            willChange: 'opacity'
          }}>
          <img 
            src={nightImage} 
            alt={`${filename} - Night`}
            className="w-full h-full object-cover"
            style={{
              objectPosition,
              filter: `blur(${finalNightBlur}px)`,
              willChange: 'filter'
            }}
            onLoad={() => {
              setNightImageLoaded(true);
            }}
            onError={(e) => {
              // Fallback visual se imagem falhar
              e.target.style.filter = 'brightness(0.2) contrast(2) saturate(0)';
              e.target.style.backgroundColor = '#1e3a8a';
            }}
          />
        </div>
        
        {/* Scan line vertical com efeito de processamento AI */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              90deg,
              transparent 0%,
              rgba(59, 130, 246, 0.1) 45%,
              rgba(59, 130, 246, 0.3) 50%,
              rgba(59, 130, 246, 0.1) 55%,
              transparent 100%
            )`,
            width: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            top: `${progress}%`,
            height: '4px',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.4)',
            animation: progress < 100 ? 'scanline-pulse 0.5s ease-in-out infinite' : 'none'
          }}
        />
        
        {/* Overlay de processamento com gradiente */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(59, 130, 246, 0.05) 0%,
              rgba(59, 130, 246, 0.1) ${progress}%,
              transparent ${Math.min(progress + 10, 100)}%
            )`
          }}
        />
        
        {/* Overlay azul noturno subtil que aumenta com o progresso */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `rgba(30, 58, 138, ${(progress / 100) * 0.15})`, // Azul mais subtil
            opacity: progress / 100,
            willChange: 'opacity'
          }}
        />
        
      </div>
      
      {/* CSS para animação do scan line */}
      <style jsx>{`
        @keyframes scanline-pulse {
          0%, 100% { 
            opacity: 0.6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.6), 0 0 16px rgba(59, 130, 246, 0.4);
          }
          50% { 
            opacity: 1;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.6);
          }
        }
      `}</style>
    </div>
  );
};
