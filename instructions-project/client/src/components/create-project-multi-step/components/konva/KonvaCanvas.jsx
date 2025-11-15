import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect } from 'react-konva';
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { URLImage } from './URLImage';
import { DecorationItem } from './DecorationItem';
// import { SnapZoneMarkers } from './SnapZoneMarkers'; // Zonas removidas
import { CartoucheText } from './CartoucheText';
// import { checkSnapToZone } from '../../utils/snapZoneUtils'; // Zonas removidas
import { getDecorationColor } from '../../utils/decorationUtils';
import { useResponsiveProfile } from '../../../../hooks/useResponsiveProfile';

/**
 * Componente KonvaCanvas - Canvas principal com layers organizados
 * Gerencia Stage, Layers, drag & drop, zone editing, controles de z-index
 */
export const KonvaCanvas = ({ 
  width, 
  height, 
  onDecorationAdd, 
  onDecorationRemove, 
  onImageRemove,
  onDecorationUpdate,
  decorations = [], 
  canvasImages = [],
  selectedImage,
  onRequireBackground,
  snapZones = [],
  isDayMode = true,
  isEditingZones = false,
  onZoneCreate = null,
  analysisComplete = {}, // Nova prop para verificar se análise YOLO completou
  showSnapZones = false, // Zonas removidas
  cartoucheInfo = null // Informações do cartouche: { projectName, streetOrZone, option }
}) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  // const [isDrawingZone, setIsDrawingZone] = useState(false); // Zonas removidas
  // const [currentZone, setCurrentZone] = useState(null); // Zonas removidas
  
  // Detectar dispositivo touch
  const { hasTouch } = useResponsiveProfile();
  const isTouchDevice = hasTouch || (typeof window !== 'undefined' && 'ontouchstart' in window);
  
  // Define tamanho virtual/base da cena (dimensões de referência)
  const sceneWidth = 1200;
  const sceneHeight = 600;
  
  // Estado para rastrear escala e dimensões atuais
  const [stageSize, setStageSize] = useState({
    width: sceneWidth,
    height: sceneHeight,
    scale: 1
  });

  // Função para tornar o Stage responsivo
  const fitStageIntoParentContainer = () => {
    if (!containerRef.current) return;
    
    // Aguardar CSS estar carregado antes de medir dimensões
    // Verificar se o documento está pronto e aguardar próximo frame de renderização
    if (document.readyState !== 'complete') {
      // Se ainda não está pronto, aguardar evento load
      const handleLoad = () => {
        requestAnimationFrame(() => {
          measureAndFit();
        });
      };
      if (document.readyState === 'loading') {
        window.addEventListener('load', handleLoad, { once: true });
        return;
      }
    }
    
    // Usar requestAnimationFrame para garantir que layout está pronto
    requestAnimationFrame(() => {
      measureAndFit();
    });
  };

  // Função auxiliar para medir e ajustar dimensões
  const measureAndFit = () => {
    if (!containerRef.current) return;
    
    // Obter largura do container
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    
    // Evitar valores inválidos
    if (containerWidth === 0 || containerHeight === 0) {
      // Se ainda não tem dimensões, tentar novamente após pequeno delay
      setTimeout(() => {
        measureAndFit();
      }, 100);
      return;
    }
    
    // Calcular escala baseada na largura e altura
    const scaleX = containerWidth / sceneWidth;
    const scaleY = containerHeight / sceneHeight;
    
    // Usar a menor escala para manter aspect ratio
    const scale = Math.min(scaleX, scaleY);
    
    // Atualizar estado com novas dimensões
    setStageSize({
      width: sceneWidth * scale,
      height: sceneHeight * scale,
      scale: scale
    });
  };

  // Atualizar no mount e quando a janela redimensiona
  useEffect(() => {
    // Aguardar que CSS esteja carregado antes de medir dimensões
    // Isso evita o erro "Layout was forced before the page was fully loaded"
    let resizeObserver = null;
    let initTimeout = null;
    let resizeTimeout = null;

    const safeMeasure = () => {
      // Usar try-catch para evitar erros de layout
      try {
        if (containerRef.current) {
          fitStageIntoParentContainer();
        }
      } catch (e) {
        // Ignorar erros de layout - tentar novamente depois
        console.warn('[KonvaCanvas] Erro ao medir dimensões, tentando novamente...', e.message);
        setTimeout(safeMeasure, 100);
      }
    };

    const initStage = () => {
      // Aguardar que tudo esteja pronto antes de medir
      const waitForReady = () => {
        if (document.readyState === 'complete' && containerRef.current) {
          // Aguardar múltiplos frames para garantir que layout está estável
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              safeMeasure();
            });
          });
        } else {
          // Se ainda não está pronto, tentar novamente
          initTimeout = setTimeout(waitForReady, 50);
        }
      };

      if (document.readyState === 'complete') {
        waitForReady();
      } else {
        window.addEventListener('load', waitForReady, { once: true });
      }
    };

    initStage();
    
    // Criar ResizeObserver apenas após inicialização completa
    const setupResizeObserver = () => {
      if (!resizeObserver && containerRef.current && document.readyState === 'complete') {
        resizeObserver = new ResizeObserver(() => {
          // Cancelar timeout anterior se existir
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }
          
          // Usar debounce para evitar muitas chamadas
          resizeTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
              safeMeasure();
            });
          }, 16); // ~60fps
        });
        
        resizeObserver.observe(containerRef.current);
      } else if (!containerRef.current || document.readyState !== 'complete') {
        // Tentar novamente se ainda não está pronto
        setTimeout(setupResizeObserver, 100);
      }
    };
    
    // Aguardar um pouco antes de tentar observar (dar tempo para CSS carregar)
    setTimeout(setupResizeObserver, 300);
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, []); // Sem dependências - só executa uma vez

  // Handlers para modo de edição de zonas - REMOVIDOS (zonas não são mais usadas)
  // Funções comentadas para manter compatibilidade, mas não são mais chamadas
  /*
  const handleMouseDownZone = function(e) {
    // Zonas removidas
  };

  const handleMouseMoveZone = function(e) {
    // Zonas removidas
  };

  const handleMouseUpZone = function(e) {
    // Zonas removidas
  };
  */

  // Click/Touch no Stage para desselecionar decoração
  const checkDeselect = (e) => {
    // Zonas removidas - sempre permitir desseleção
    // Desselecionar apenas quando clica diretamente no stage (área vazia)
    const target = e.target;
    const stage = e.target.getStage();
    
    if (target === stage) {
      console.log('❌ Desselecionado');
      setSelectedId(null);
    }
  };

  // Handler melhorado para touch no Stage
  const handleTouchStart = (e) => {
    const target = e.target;
    const stage = e.target.getStage();
    
    // Se clicou no stage vazio, prevenir scroll e desselecionar
    if (target === stage && isTouchDevice) {
      // Prevenir scroll apenas quando toca no stage vazio
      if (e.evt && e.evt.preventDefault) {
        e.evt.preventDefault();
      }
      checkDeselect(e);
    }
    // Se clicou numa decoração, deixar o evento propagar para o DecorationItem
  };

  const handleTouchEnd = (e) => {
    const target = e.target;
    const stage = e.target.getStage();
    
    // Desselecionar apenas se clicar no stage vazio
    if (target === stage) {
      // Prevenir comportamentos padrão apenas no stage vazio
      if (isTouchDevice && e.evt && e.evt.preventDefault) {
        e.evt.preventDefault();
      }
      checkDeselect(e);
    }
  };

  // Handle drag and drop da biblioteca (HTML)
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    try {
      // Verificar se há imagem de fundo
      if (canvasImages.length === 0) {
        console.warn('⚠️ Cannot add decoration without a background image!');
        if (onRequireBackground) {
          onRequireBackground();
        }
        return;
      }

      // Adicionar nova decoração da biblioteca
      const decorationData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Calcular posição relativa ao Stage
      const stage = stageRef.current;
      if (!stage || !containerRef.current) return;
      
      // Proteger getBoundingClientRect para evitar erros de layout
      let containerRect;
      try {
        containerRect = containerRef.current.getBoundingClientRect();
      } catch (e) {
        console.warn('[KonvaCanvas] Erro ao obter bounding rect:', e.message);
        return;
      }
      
      var x = (e.clientX - containerRect.left) / stageSize.scale;
      var y = (e.clientY - containerRect.top) / stageSize.scale;
      
      // Snap zones removidas - não aplicar snap
      
      const newDecoration = {
        id: Date.now(),
        type: decorationData.imageUrl ? 'image' : decorationData.type,
        name: decorationData.name,
        icon: decorationData.icon,
        src: decorationData.imageUrl || undefined,
        x: x,
        y: y,
        width: decorationData.imageUrl ? 200 : 120, // 2x maior: 100->200, 60->120
        height: decorationData.imageUrl ? 200 : 120, // 2x maior: 100->200, 60->120
        rotation: 0,
        color: getDecorationColor(decorationData.type)
      };
      
      console.log('➕ Adicionando nova decoração:', newDecoration);
      onDecorationAdd(newDecoration);
    } catch (error) {
      console.error('❌ Error handling drop:', error);
    }
  };

  // Funções para controlar z-index (ordem no array)
  const moveDecorationToFront = () => {
    if (!selectedId) return;
    
    const index = decorations.findIndex(d => d.id === selectedId);
    if (index === -1 || index === decorations.length - 1) return;
    
    console.log('⬆️ Movendo decoração para frente:', selectedId);
    
    // Remove da posição atual e adiciona no final (topo)
    const decoration = decorations[index];
    onDecorationRemove(selectedId);
    setTimeout(() => onDecorationAdd(decoration), 0);
  };

  const moveDecorationToBack = () => {
    if (!selectedId) return;
    
    const index = decorations.findIndex(d => d.id === selectedId);
    if (index === -1 || index === 0) return;
    
    console.log('⬇️ Movendo decoração para trás:', selectedId);
    
    // Reordenar: mover para o início
    const decoration = decorations[index];
    const newDecorations = [decoration, ...decorations.slice(0, index), ...decorations.slice(index + 1)];
    
    // Limpar e re-adicionar na nova ordem
    decorations.forEach(d => onDecorationRemove(d.id));
    setTimeout(() => {
      newDecorations.forEach(d => onDecorationAdd(d));
    }, 0);
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ touchAction: 'none' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Stage do React-Konva */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageSize.scale}
        scaleY={stageSize.scale}
        onMouseDown={checkDeselect}
        // Handlers melhorados para touch
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        clipX={0}
        clipY={0}
        clipWidth={stageSize.width}
        clipHeight={stageSize.height}
        className={`rounded-lg ${
          canvasImages.length > 0 || dragOver
            ? (dragOver 
                ? 'ring-2 ring-primary bg-primary/10' 
                : false // Zonas removidas
                  ? 'ring-2 ring-warning bg-warning/5 cursor-crosshair'
                  : 'bg-default-100')
            : 'border-2 border-dashed border-default-300 bg-default-50'
        }`}
      >
        {/* Layer 1: Source Images (não arrastáveis) */}
        <Layer>
          {canvasImages.map(img => (
            <URLImage
              key={img.id}
              src={img.src}
              x={img.x}
              y={img.y}
              width={img.width}
              height={img.height}
            />
          ))}
        </Layer>


        {/* Layer 1.5: Snap Zone Markers - REMOVIDO (zonas não são mais usadas) */}
        {/* Zonas foram removidas da funcionalidade */}

        {/* Layer 2: Decorações (arrastáveis com Transformer) */}
        <Layer>
          {decorations.map(decoration => (
            <DecorationItem
              key={decoration.id}
              decoration={decoration}
              isSelected={decoration.id === selectedId}
              snapZones={[]} // Zonas removidas
              isDayMode={isDayMode}
              isTouchDevice={isTouchDevice}
              onSelect={() => {
                console.log('✅ Decoração selecionada:', decoration.id);
                setSelectedId(decoration.id);
              }}
              onChange={(newAttrs) => {
                // Atualizar decoração via callback
                if (onDecorationUpdate) {
                  onDecorationUpdate(decoration.id, newAttrs);
                } else {
                  // Fallback: remover e adicionar
                  onDecorationRemove(decoration.id);
                  onDecorationAdd(newAttrs);
                }
              }}
            />
          ))}
        </Layer>

        {/* Layer 3: Cartouche Text (texto sobre o cartouche - deve ficar por cima de tudo) */}
        {cartoucheInfo && (() => {
          const cartoucheImage = canvasImages.find(img => img.isCartouche);
          const backgroundImage = canvasImages.find(img => !img.isCartouche && img.isSourceImage);
          
          console.log('🎨 [KonvaCanvas] Renderizando CartoucheText:', {
            hasCartoucheInfo: !!cartoucheInfo,
            cartoucheInfo,
            cartoucheImage,
            backgroundImage: backgroundImage ? {
              x: backgroundImage.x,
              y: backgroundImage.y,
              width: backgroundImage.width,
              height: backgroundImage.height
            } : null,
            cartoucheImageCount: canvasImages.filter(img => img.isCartouche).length,
            allCanvasImages: canvasImages.map(img => ({ id: img.id, isCartouche: img.isCartouche }))
          });
          
          if (!cartoucheImage) {
            console.warn('⚠️ [KonvaCanvas] Não encontrou cartoucheImage no canvasImages');
            return null;
          }
          
          return (
            <Layer>
              <CartoucheText
                cartoucheImage={cartoucheImage}
                backgroundImage={backgroundImage}
                projectName={cartoucheInfo.projectName}
                streetOrZone={cartoucheInfo.streetOrZone}
                option={cartoucheInfo.option}
              />
            </Layer>
          );
        })()}
      </Stage>

      {/* Botão de remover - HTML overlay */}
      {selectedId && (
        <Button
          size="sm"
          color="danger"
          className="absolute top-2 right-2"
          startContent={<Icon icon="lucide:trash-2" />}
          onPress={() => {
            console.log('🗑️ Removendo decoração:', selectedId);
            onDecorationRemove(selectedId);
            setSelectedId(null);
          }}
          aria-label="Remove decoration"
        >
          Remove
        </Button>
      )}

      {/* Controles de Layer (z-index) */}
      {selectedId && (
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="flat"
            className="bg-default-200"
            startContent={<Icon icon="lucide:arrow-down" />}
            onPress={moveDecorationToBack}
            aria-label="Send decoration to back"
          >
            Send Back
          </Button>
          <Button
            size="sm"
            variant="flat"
            className="bg-default-200"
            startContent={<Icon icon="lucide:arrow-up" />}
            onPress={moveDecorationToFront}
            aria-label="Bring decoration to front"
          >
            Bring Front
          </Button>
        </div>
      )}

      {/* Overlays informativos */}
      {canvasImages.length === 0 && decorations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <Icon icon="lucide:image" className="text-default-400 text-4xl mb-2" />
            <p className="text-default-600 mb-4">Click on a Source Image to start</p>
            <p className="text-default-500 text-sm">Then add decorations on top</p>
          </div>
        </div>
      )}
    </div>
  );
};

