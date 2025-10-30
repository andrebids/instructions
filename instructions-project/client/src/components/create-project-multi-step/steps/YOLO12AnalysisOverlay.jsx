import React, { useState, useEffect } from 'react';
import { Spinner, Progress } from '@heroui/react';
import { Icon } from '@iconify/react';

export const YOLO12AnalysisOverlay = ({ onComplete, duration = 2500 }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  const steps = [
    'Initializing YOLO12 v1.2...',
    'Analyzing image structure...',
    'Detecting decoration zones...',
    'Processing results...'
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
      } else {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    };
    
    requestAnimationFrame(animate);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
      {/* Efeito de scanlines horizontais */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(59, 130, 246, 0.03) 2px,
            rgba(59, 130, 246, 0.03) 4px
          )`,
          animation: 'scanlineMove 0.8s linear infinite'
        }}
      />
      
      {/* Grid de detecção */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'gridPulse 2s ease-in-out infinite'
        }}
      />
      
      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full px-6">
        {/* Ícone YOLO */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-full p-6">
            <Icon icon="lucide:scan" className="text-white text-4xl" />
          </div>
        </div>
        
        {/* Título */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">YOLO12 Analysis</h2>
          <p className="text-blue-300 text-sm font-mono">{steps[step]}</p>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full">
          <Progress 
            value={progress} 
            color="primary"
            className="mb-2"
            classNames={{
              indicator: "bg-gradient-to-r from-blue-500 to-cyan-500"
            }}
          />
          <p className="text-center text-white/60 text-xs font-mono">
            {Math.round(progress)}%
          </p>
        </div>
        
        {/* Partículas animadas */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particleFloat ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>
      </div>
      
      {/* CSS para animações */}
      <style jsx>{`
        @keyframes scanlineMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(20px);
          }
        }
        
        @keyframes gridPulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        @keyframes particleFloat {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

