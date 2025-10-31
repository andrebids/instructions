import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export const YOLO12ThumbnailOverlay = ({ duration = 2500 }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    'Initializing...',
    'Analyzing...',
    'Detecting zones...'
  ];

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      // Mudar step baseado no progresso
      const currentStep = Math.floor((newProgress / 100) * steps.length);
      setStep(Math.min(currentStep, steps.length - 1));
      
      if (newProgress < 100) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [duration]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none bg-black/50 backdrop-blur-[2px] rounded-lg flex flex-col items-center justify-center" style={{ borderRadius: 'inherit' }}>
      {/* Efeito de scanlines sutis */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(59, 130, 246, 0.15) 3px,
            rgba(59, 130, 246, 0.15) 6px
          )`,
          animation: 'scanlineMove 1s linear infinite',
          borderRadius: 'inherit'
        }}
      />
      
      {/* Conteúdo compacto */}
      <div className="relative z-10 flex flex-col items-center gap-2 px-2">
        {/* Ícone pequeno */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-md opacity-60 animate-pulse" />
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-full p-2">
            <Icon icon="lucide:search" className="text-white text-sm" />
          </div>
        </div>
        
        {/* Texto pequeno */}
        <div className="text-center">
          <p className="text-white text-[10px] font-semibold mb-0.5">Detecting</p>
          <p className="text-blue-200 text-[8px] font-mono">{steps[step]}</p>
        </div>
        
        {/* Barra de progresso pequena */}
        <div className="w-16 h-1 bg-black/40 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-100"
            style={{ width: progress + '%' }}
          />
        </div>
      </div>
      
      {/* CSS para animações */}
      <style jsx>{`
        @keyframes scanlineMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(10px);
          }
        }
      `}</style>
    </div>
  );
};

