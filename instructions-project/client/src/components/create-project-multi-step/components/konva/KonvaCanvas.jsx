import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect } from 'react-konva';
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { URLImage } from './URLImage';
import { DecorationItem } from './DecorationItem';
import { SnapZoneMarkers } from './SnapZoneMarkers';
import { CartoucheText } from './CartoucheText';
import { checkSnapToZone } from '../../utils/snapZoneUtils';
import { getDecorationColor } from '../../utils/decorationUtils';

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
  showSnapZones = true,
  cartoucheInfo = null // Informações do cartouche: { projectName, streetOrZone, option }
}) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);
  
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
    
    // Obter largura do container
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    
    // Evitar valores inválidos
    if (containerWidth === 0 || containerHeight === 0) return;
    
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
    fitStageIntoParentContainer();
    
    const resizeObserver = new ResizeObserver(() => {
      fitStageIntoParentContainer();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []); // Sem dependências - só executa uma vez

  // Handlers para modo de edição de zonas
  const handleMouseDownZone = function(e) {
    if (!isEditingZones || !onZoneCreate) return;
    
    var stage = e.target.getStage();
    var pointerPos = stage.getPointerPosition();
    var containerRect = containerRef.current.getBoundingClientRect();
    
    // Converter para coordenadas do canvas virtual
    var x = pointerPos.x / stageSize.scale;
    var y = pointerPos.y / stageSize.scale;
    
    setIsDrawingZone(true);
    setCurrentZone({
      startX: x,
      startY: y,
      x: x,
      y: y,
      width: 0,
      height: 0
    });
  };

  const handleMouseMoveZone = function(e) {
    if (!isEditingZones || !isDrawingZone || !currentZone) return;
    
    var stage = e.target.getStage();
    var pointerPos = stage.getPointerPosition();
    var containerRect = containerRef.current.getBoundingClientRect();
    
    // Converter para coordenadas do canvas virtual
    var x = pointerPos.x / stageSize.scale;
    var y = pointerPos.y / stageSize.scale;
    
    // Calcular dimensões do retângulo
    var newX = Math.min(currentZone.startX, x);
    var newY = Math.min(currentZone.startY, y);
    var newWidth = Math.abs(x - currentZone.startX);
    var newHeight = Math.abs(y - currentZone.startY);
    
    setCurrentZone({
      startX: currentZone.startX,
      startY: currentZone.startY,
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  const handleMouseUpZone = function(e) {
    if (!isEditingZones || !isDrawingZone || !currentZone) return;
    
    // Só criar zona se tiver tamanho mínimo
    if (currentZone.width > 10 && currentZone.height > 10) {
      var newZone = {
        id: 'temp-zone-' + Date.now(),
        x: currentZone.x,
        y: currentZone.y,
        width: currentZone.width,
        height: currentZone.height,
        label: 'Zone ' + (snapZones.length + 1)
      };
      
      if (onZoneCreate) {
        console.log('🎨 [DEBUG] Criando zona temporária:', newZone);
        onZoneCreate(newZone);
      }
    }
    
    setIsDrawingZone(false);
    setCurrentZone(null);
  };

  // Click/Touch no Stage para desselecionar decoração ou iniciar criação de zona
  const checkDeselect = (e) => {
    if (isEditingZones) {
      // No modo edição, não desselecionar decorações
      return;
    }
    
    // Desselecionar apenas quando clica diretamente no stage (área vazia)
    const target = e.target;
    const stage = e.target.getStage();
    
    if (target === stage) {
      console.log('❌ Desselecionado');
      setSelectedId(null);
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
        console.warn('⚠️ Não é possível adicionar decoração sem imagem de fundo!');
        if (onRequireBackground) {
          onRequireBackground();
        }
        return;
      }

      // Adicionar nova decoração da biblioteca
      const decorationData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Calcular posição relativa ao Stage
      const stage = stageRef.current;
      if (!stage) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      var x = (e.clientX - containerRect.left) / stageSize.scale;
      var y = (e.clientY - containerRect.top) / stageSize.scale;
      
      // Aplicar snap se houver zonas definidas para o modo atual
      if (snapZones && snapZones.length > 0) {
        var snapped = checkSnapToZone(x, y, snapZones);
        x = snapped.x;
        y = snapped.y;
        if (snapped.snapped) {
          console.log('🎯 Snap aplicado para zona mais próxima');
        }
      }
      
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
        onMouseDown={isEditingZones ? handleMouseDownZone : checkDeselect}
        onMouseMove={isEditingZones ? handleMouseMoveZone : undefined}
        onMouseUp={isEditingZones ? handleMouseUpZone : undefined}
        onTouchStart={(e) => {
          // Não fazer nada aqui - deixar o evento propagar para o KonvaImage
          // O checkDeselect será chamado apenas se clicar no stage vazio
          const target = e.target;
          const stage = e.target.getStage();
          // Se clicou no stage vazio, desselecionar
          if (target === stage) {
            checkDeselect(e);
          }
          // Se clicou numa decoração, deixar o evento propagar para o onTouchStart do KonvaImage
        }}
        onTouchEnd={(e) => {
          // Similar ao onTouchStart - apenas desselecionar se clicar no stage vazio
          const target = e.target;
          const stage = e.target.getStage();
          if (target === stage) {
            checkDeselect(e);
          }
        }}
        clipX={0}
        clipY={0}
        clipWidth={stageSize.width}
        clipHeight={stageSize.height}
        className={`rounded-lg ${
          canvasImages.length > 0 || dragOver
            ? (dragOver 
                ? 'ring-2 ring-primary bg-primary/10' 
                : isEditingZones
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


        {/* Layer 1.5: Snap Zone Markers (mostrar por padrão, ocultar apenas se showSnapZones for false) */}
        <Layer>
          {/* Zonas salvas (mostrar sempre que houver zonas E showSnapZones for true OU em modo edição) */}
          <SnapZoneMarkers 
            zones={snapZones} 
            isVisible={
              snapZones.length > 0 && (isEditingZones || showSnapZones)
            }
          />
          
          {/* Zonas temporárias sendo criadas (modo edição) */}
          {isEditingZones && currentZone && currentZone.width > 0 && currentZone.height > 0 && (
            <Rect
              x={currentZone.x}
              y={currentZone.y}
              width={currentZone.width}
              height={currentZone.height}
              stroke="rgba(255, 193, 7, 0.9)"
              strokeWidth={2}
              fill="rgba(255, 193, 7, 0.2)"
              listening={false}
              dash={[5, 5]}
            />
          )}
          
          {/* Mostrar todas as zonas no modo edição */}
          {isEditingZones && (
            <SnapZoneMarkers 
              zones={snapZones} 
              isVisible={true}
            />
          )}
        </Layer>

        {/* Layer 2: Decorações (arrastáveis com Transformer) */}
        <Layer>
          {decorations.map(decoration => (
            <DecorationItem
              key={decoration.id}
              decoration={decoration}
              isSelected={decoration.id === selectedId}
              snapZones={snapZones}
              isDayMode={isDayMode}
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

