import React, { useRef, useEffect, useState } from "react";
import { Card, CardFooter, Button, Spinner, Progress, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { DecorationLibrary } from "../../decoration-library";
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Circle } from 'react-konva';
import useImage from 'use-image';
import { NightThumb } from '../../NightThumb';
import { YOLO12ThumbnailOverlay } from './YOLO12ThumbnailOverlay';
import { UnifiedSnapZonesPanel } from './UnifiedSnapZonesPanel';
import { projectsAPI } from '../../../services/api';
import useSourceImages from '../hooks/useSourceImages';

// Componente para o Modal de Upload
const UploadModal = ({ onUploadComplete }) => {
  const [isPreparing, setIsPreparing] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([
    { name: 'source 1.jpeg', size: '2.4 MB', progress: 0, status: 'pending' },
    { name: 'source 2.jpeg', size: '1.8 MB', progress: 0, status: 'pending' },
    { name: 'source 3.jpeg', size: '0.9 MB', progress: 0, status: 'pending' },
  ]);
  const callbackCalledRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsPreparing(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPreparing) return;

    let fileIndex = 0;
    const intervals = [];

    const uploadNextFile = () => {
      if (fileIndex >= files.length) {
        return;
      }

      setFiles(prev => {
        const newFiles = [...prev];
        if (newFiles[fileIndex]) {
          newFiles[fileIndex].status = 'uploading';
        }
        return newFiles;
      });

      // 2 segundos por arquivo: incrementar 5% a cada 100ms (20 * 100ms = 2000ms)
      const interval = setInterval(() => {
        setFiles(prev => {
          const newFiles = [...prev];
          const currentFile = newFiles[fileIndex];

          // Verificar se currentFile existe antes de aceder às suas propriedades
          if (currentFile && currentFile.progress < 100) {
            currentFile.progress += 5;
            return newFiles;
          } else if (currentFile) {
            clearInterval(interval);
            currentFile.status = 'done';
            fileIndex++;
            // Chamar uploadNextFile no próximo tick para evitar problemas de estado
            setTimeout(uploadNextFile, 50);
            return newFiles;
          }
          return newFiles;
        });
      }, 100);
      intervals.push(interval);
    };

    uploadNextFile();

    return () => intervals.forEach(clearInterval);
  }, [isPreparing, files.length]);

  // Verificar quando todos os arquivos estão completos
  useEffect(() => {
    if (isPreparing) return;
    
    const allDone = files.every(file => file.status === 'done');
    if (allDone && files.length > 0 && onUploadComplete && !callbackCalledRef.current) {
      callbackCalledRef.current = true;
      const timer = setTimeout(() => {
        onUploadComplete();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [files, isPreparing, onUploadComplete]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    // Simular recepção de arquivos (fake)
    if (isPreparing) {
      setIsPreparing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card className="p-8 text-center max-w-lg w-full m-4 transition-all duration-300">
        {isPreparing ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Upload Background Image</h2>
            <div 
              className={`border-2 border-dashed rounded-lg p-12 bg-default-50 transition-all duration-200 ${
                dragOver 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                  : 'border-default-300'
              }`}
            >
              <Icon icon="lucide:upload-cloud" className={`text-5xl mx-auto mb-4 transition-colors ${
                dragOver ? 'text-primary' : 'text-default-500'
              }`} />
              <p className={`mb-2 transition-colors ${
                dragOver ? 'text-primary font-medium' : 'text-default-600'
              }`}>
                {dragOver ? 'Drop your images here' : 'Drag and drop your images here'}
              </p>
              <p className="text-default-500 text-sm mb-4">or</p>
              <Button color="primary" variant="ghost">Select Files</Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Uploading Files...</h2>
            <div className="p-4 bg-default-50 rounded-lg space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-default-100">
                  <Icon icon="lucide:image" className="text-3xl text-primary flex-shrink-0" />
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-medium truncate text-sm">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={file.progress} size="sm" className="flex-1" />
                      <span className="text-xs text-default-500 w-10 text-right">{file.progress}%</span>
                    </div>
                  </div>
                  {file.status === 'done' && <Icon icon="lucide:check-circle" className="text-2xl text-success flex-shrink-0" />}
                   {file.status === 'uploading' && <Spinner size="sm" />}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// Componente para o Indicador de Carregamento
const LoadingIndicator = () => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
    <Spinner size="lg" />
    <p className="mt-4 text-white">Simulating image processing...</p>
  </div>
);

// Função para obter cor baseada no tipo de decoração
const getDecorationColor = (type) => {
  const colors = {
    'tree': '#228B22',
    'plant': '#32CD32',
    'lights': '#FFD700',
    'ornament': '#FF6347',
    'holiday': '#FF69B4'
  };
  return colors[type] || '#6B7280';
};

// ============================================
// COMPONENTES REACT-KONVA
// ============================================

// Componente para carregar Source Images (não arrastáveis)
const URLImage = ({ src, width, height, x, y }) => {
  const [image] = useImage(src, 'anonymous');
  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      offsetX={width / 2}
      offsetY={height / 2}
      listening={false} // Não responde a eventos (não arrastável)
    />
  );
};

// Componente para renderizar marcas de snap zones
const SnapZoneMarkers = ({ zones = [], isVisible = false }) => {
  if (!isVisible || !zones || zones.length === 0) {
    return null;
  }

  return (
    <>
      {zones.map(function(zone) {
        var centerX = zone.x + zone.width / 2;
        var centerY = zone.y + zone.height / 2;
        
        return (
          <React.Fragment key={zone.id}>
            {/* Retângulo da zona */}
            <Rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth={2}
              fill="rgba(59, 130, 246, 0.1)"
              listening={false}
              dash={[5, 5]}
            />
            {/* Ponto central indicando snap */}
            <Circle
              x={centerX}
              y={centerY}
              radius={4}
              fill="rgba(59, 130, 246, 0.8)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={1}
              listening={false}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

// Componente para Decorações individuais com Transformer
const DecorationItem = ({ 
  decoration, 
  isSelected, 
  onSelect, 
  onChange,
  snapZones = [],
  isDayMode = true
}) => {
  const [image] = useImage(decoration.src, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  // Após carregar a imagem, ajustar altura para manter proporção original
  useEffect(() => {
    if (!image || !shapeRef.current) {
      return;
    }
    // Se width/height atuais não correspondem ao aspect ratio da imagem, corrigir
    var imgW = image && image.width ? image.width : 0;
    var imgH = image && image.height ? image.height : 0;
    if (imgW > 0 && imgH > 0 && decoration && decoration.width && decoration.height) {
      var expectedHeight = decoration.width * (imgH / imgW);
      if (Math.abs(expectedHeight - decoration.height) > 0.5) {
        onChange({
          ...decoration,
          height: expectedHeight,
          // manter demais propriedades inalteradas
        });
      }
    }
  }, [image]);

  useEffect(() => {
    if (isSelected) {
      // Attach transformer manualmente ao shape
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [isSelected]);

  // Função para verificar snap a uma zona (dentro do DecorationItem)
  var checkSnapToZone = function(x, y, zones) {
    if (!zones || zones.length === 0) {
      return { x: x, y: y, snapped: false };
    }
    
    var snapThreshold = 50;
    var closestZone = null;
    var minDistance = Infinity;
    
    for (var i = 0; i < zones.length; i++) {
      var zone = zones[i];
      var zoneCenterX = zone.x + zone.width / 2;
      var zoneCenterY = zone.y + zone.height / 2;
      
      var dx = x - zoneCenterX;
      var dy = y - zoneCenterY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapThreshold && distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    }
    
    if (closestZone) {
      return {
        x: closestZone.x + closestZone.width / 2,
        y: closestZone.y + closestZone.height / 2,
        snapped: true
      };
    }
    
    return { x: x, y: y, snapped: false };
  };

  const handleDragMove = function(e) {
    if (!snapZones || snapZones.length === 0) {
      return;
    }
    
    var node = shapeRef.current;
    if (!node) return;
    
    var currentX = node.x();
    var currentY = node.y();
    
    // Verificar snap durante movimento (funciona em ambos os modos)
    var snapped = checkSnapToZone(currentX, currentY, snapZones);
    
    if (snapped.snapped) {
      // Atualizar posição do node em tempo real
      node.position({
        x: snapped.x,
        y: snapped.y
      });
      node.getLayer().batchDraw();
    }
  };

  const handleDragEnd = (e) => {
    var node = shapeRef.current;
    if (!node) return;
    
    var finalX = node.x();
    var finalY = node.y();
    
    // Aplicar snap final antes de salvar (funciona em ambos os modos)
    if (snapZones && snapZones.length > 0) {
      var snapped = checkSnapToZone(finalX, finalY, snapZones);
      finalX = snapped.x;
      finalY = snapped.y;
      
      if (snapped.snapped) {
        node.position({ x: finalX, y: finalY });
        node.getLayer().batchDraw();
        console.log('🎯 Snap aplicado durante drag para zona mais próxima');
      }
    }
    
    console.log('🔄 Decoração movida:', decoration.id, 'nova posição:', finalX, finalY);
    onChange({
      ...decoration,
      x: finalX,
      y: finalY,
    });
  };

  const handleTransformEnd = (e) => {
    // Transformer está a mudar a scale do node, não width/height
    // No store temos apenas width/height
    // Por isso resetamos a scale após transform
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    console.log('🔧 Decoração transformada:', decoration.id, 'scale:', scaleX, scaleY, 'rotation:', node.rotation());
    
    // Resetar scale de volta para 1
    node.scaleX(1);
    node.scaleY(1);
    
    onChange({
      ...decoration,
      x: node.x(),
      y: node.y(),
      // Definir valor mínimo
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  // Renderizar apenas decorações tipo imagem (PNG)
  if (decoration.type === 'image' && decoration.src) {
    return (
      <>
        <KonvaImage
          ref={shapeRef}
          image={image}
          x={decoration.x}
          y={decoration.y}
          width={decoration.width}
          height={decoration.height}
          offsetX={decoration.width / 2}
          offsetY={decoration.height / 2}
          rotation={decoration.rotation || 0}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            keepRatio={true}
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => {
              // Limitar resize mínimo
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </>
    );
  }
  
  // Decorações coloridas (fallback) - não implementado nesta versão
  return null;
};

// ============================================
// COMPONENTE KONVA CANVAS PRINCIPAL
// ============================================
// 
// Arquitetura de Layers (inspirada nas boas práticas do Konva):
// ┌─────────────────────────────────────────────┐
// │ Layer 3: Decorações (z-index 100+)         │ ← Arrastáveis, z-index dinâmico
// │   - Cada decoração tem z-index próprio      │   (100, 101, 102, 103...)
// │   - Click traz para frente                  │
// │   - Drag & drop otimizado                   │
// ├─────────────────────────────────────────────┤
// │ Layer 2: Overlay UI (z-index 50)           │ ← Mensagens e loading
// │   - Apenas quando necessário                │
// ├─────────────────────────────────────────────┤
// │ Layer 1: Source Images (z-index 1)         │ ← Imagem de fundo
// │   - Estática, não arrastável                │
// │   - listening(false) para performance       │
// └─────────────────────────────────────────────┘
const KonvaCanvas = ({ 
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
  analysisComplete = {} // Nova prop para verificar se análise YOLO completou
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
    
    // Desselecionar quando clica em área vazia
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
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

  // Função para verificar snap a uma zona
  const checkSnapToZone = function(x, y, zones) {
    if (!zones || zones.length === 0) {
      return { x: x, y: y, snapped: false };
    }
    
    var snapThreshold = 50;
    var closestZone = null;
    var minDistance = Infinity;
    
    for (var i = 0; i < zones.length; i++) {
      var zone = zones[i];
      var zoneCenterX = zone.x + zone.width / 2;
      var zoneCenterY = zone.y + zone.height / 2;
      
      var dx = x - zoneCenterX;
      var dy = y - zoneCenterY;
      var distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < snapThreshold && distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    }
    
    if (closestZone) {
      return {
        x: closestZone.x + closestZone.width / 2,
        y: closestZone.y + closestZone.height / 2,
        snapped: true
      };
    }
    
    return { x: x, y: y, snapped: false };
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
        width: decorationData.imageUrl ? 100 : 60,
        height: decorationData.imageUrl ? 100 : 60,
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
        onTouchStart={checkDeselect}
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

        {/* Layer 1.5: Snap Zone Markers (mostrar após análise YOLO completa ou em modo edição) */}
        <Layer>
          {/* Zonas salvas (mostrar sempre que houver zonas E análise YOLO completa OU em modo edição) */}
          <SnapZoneMarkers 
            zones={snapZones} 
            isVisible={
              snapZones.length > 0 && 
              (
                (selectedImage && analysisComplete[selectedImage.id]) || 
                isEditingZones
              )
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
          >
            Send Back
          </Button>
          <Button
            size="sm"
            variant="flat"
            className="bg-default-200"
            startContent={<Icon icon="lucide:arrow-up" />}
            onPress={moveDecorationToFront}
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

export const StepAIDesigner = ({ formData, onInputChange }) => {
  const [decorations, setDecorations] = useState([]);
  const [noBgWarning, setNoBgWarning] = useState(false);
  const [decorationsByImage, setDecorationsByImage] = useState({}); // Mapeia decorações por imagem: { 'source-img-1': [...decorations], 'source-img-2': [...] }
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadStep, setUploadStep] = useState('uploading'); // 'uploading', 'loading', 'done'
  const [selectedImage, setSelectedImage] = useState(null);
  const [canvasImages, setCanvasImages] = useState([]); // Imagens adicionadas ao canvas
  const [activeGifIndex, setActiveGifIndex] = useState(-1); // Controla em qual thumbnail o GIF está visível (-1 = nenhum)
  const [isDayMode, setIsDayMode] = useState(true); // Controla se mostra imagem de dia ou noite
  const [uploadedImages, setUploadedImages] = useState([]); // Imagens disponíveis após upload completo
  
  // Estados para sistema YOLO12 Snap Zones
  const [snapZonesByImage, setSnapZonesByImage] = useState({}); // Mapeia zonas de snap por imagem
  
  // Carregar dados salvos do formData ao inicializar E quando formData mudar
  useEffect(function() {
    console.log('📦 [DEBUG] Verificando formData para carregar zonas:', {
      temSnapZones: !!formData?.snapZonesByImage,
      snapZonesKeys: formData?.snapZonesByImage ? Object.keys(formData.snapZonesByImage) : [],
      snapZonesValue: formData?.snapZonesByImage,
      estadoAtual: Object.keys(snapZonesByImage),
      formDataId: formData?.id
    });
    
    // Tentar carregar do formData primeiro
    if (formData?.snapZonesByImage && Object.keys(formData.snapZonesByImage).length > 0) {
      // Só atualizar se for diferente do estado atual
      var formDataKeys = Object.keys(formData.snapZonesByImage).sort().join(',');
      var currentKeys = Object.keys(snapZonesByImage).sort().join(',');
      
      if (formDataKeys !== currentKeys || JSON.stringify(formData.snapZonesByImage) !== JSON.stringify(snapZonesByImage)) {
        console.log('📦 [DEBUG] Carregando zonas salvas do formData:', formData.snapZonesByImage);
        setSnapZonesByImage(formData.snapZonesByImage);
      } else {
        console.log('📦 [DEBUG] Zonas já estão carregadas, pulando...');
      }
    } else {
      // Se não há no formData, tentar carregar do localStorage como backup
      // Usar chave temporária baseada na sessão ou projeto
      var storageKey = 'snapZonesByImage_temp';
      if (formData?.id) {
        storageKey = 'snapZonesByImage_' + formData.id;
      }
      
      try {
        var savedZones = localStorage.getItem(storageKey);
        if (savedZones) {
          var parsedZones = JSON.parse(savedZones);
          if (parsedZones && Object.keys(parsedZones).length > 0) {
            console.log('📦 [DEBUG] Carregando zonas do localStorage:', parsedZones);
            setSnapZonesByImage(parsedZones);
            // Atualizar formData também
            onInputChange("snapZonesByImage", parsedZones);
          } else {
            console.log('📦 [DEBUG] Nenhuma zona encontrada no formData nem localStorage');
          }
        } else {
          console.log('📦 [DEBUG] Nenhuma zona encontrada no formData nem localStorage');
        }
      } catch (e) {
        console.log('⚠️ Erro ao carregar do localStorage:', e);
      }
    }
    
    if (formData?.canvasDecorations && Array.isArray(formData.canvasDecorations) && formData.canvasDecorations.length > 0) {
      console.log('📦 Carregando decorações salvas do formData:', formData.canvasDecorations.length, 'decorações');
      setDecorations(formData.canvasDecorations);
    }
    
    if (formData?.decorationsByImage && Object.keys(formData.decorationsByImage).length > 0) {
      console.log('📦 Carregando decorações por imagem do formData');
      setDecorationsByImage(formData.decorationsByImage);
    }
  }, [formData?.snapZonesByImage, formData?.id]); // Executar quando formData.snapZonesByImage ou formData.id mudar
  const [analyzingImageId, setAnalyzingImageId] = useState(null); // ID da imagem que está sendo analisada
  const [analysisComplete, setAnalysisComplete] = useState({}); // Mapeia quais imagens já foram analisadas
  const [showUnifiedPanel, setShowUnifiedPanel] = useState(false); // Painel unificado oculto por padrão
  const [isEditingZones, setIsEditingZones] = useState(false); // Modo de edição visual
  const [tempZones, setTempZones] = useState([]); // Zonas temporárias sendo criadas no modo edição
  
  // Carregar Source Images da API usando hook
  var { sourceImages, loading: sourceImagesLoading, error: sourceImagesError } = useSourceImages();
  
  // Fallback para imagens hardcoded caso API não retorne dados
  var loadedImages = sourceImages && sourceImages.length > 0 ? sourceImages : [
    { 
      id: 'source-img-1', 
      name: 'source 1.jpeg', 
      thumbnail: '/demo-images/sourceday/SOURCE1.jpg',
      nightVersion: '/demo-images/sourcenight/SOURCE1.png'
    },
    { 
      id: 'source-img-2', 
      name: 'source 2.jpeg', 
      thumbnail: '/demo-images/sourceday/SOURCE2.jpg',
      nightVersion: '/demo-images/sourcenight/SOURCE2.png'
    },
    { 
      id: 'source-img-3', 
      name: 'source 3.jpeg', 
      thumbnail: '/demo-images/sourceday/SOURCE3.png',
      nightVersion: '/demo-images/sourcenight/SOURCE3.png'
    },
  ];

  // Callback quando upload completo
  const handleUploadComplete = () => {
    // Mudar para 'loading' antes de mostrar imagens
    setUploadStep('loading');
    
    // Após um breve delay, popular uploadedImages e mostrar interface
    setTimeout(() => {
      setUploadedImages(loadedImages);
      setUploadStep('done');
      
      // Iniciar conversão automática sequencial após upload
      // Começar com primeira imagem após 500ms
      setTimeout(() => {
        setActiveGifIndex(0); // Source 1
      }, 500);
      
      // Sequência de animação do GIF: Source 1 -> Source 2 -> Source 3 -> desaparece
      setTimeout(() => {
        setActiveGifIndex(1); // Source 2
      }, 4500); // 500ms delay inicial + 4000ms conversão da primeira
      
      setTimeout(() => {
        setActiveGifIndex(2); // Source 3
      }, 8500); // 500ms + 4000ms + 4000ms
      
      setTimeout(() => {
        setActiveGifIndex(-1); // Desaparece após todas convertidas
      }, 12500); // 500ms + 4000ms * 3
    }, 300);
  };



  // Adicionar imagem source ao canvas (substitui a anterior)
  const handleImageAddToCanvas = (image, useDayMode = isDayMode) => {
    console.log('📸🖼️ ===== SOURCE IMAGE CLICADA =====');
    console.log('📸 Nome:', image.name);
    console.log('📸 ID:', image.id);
    console.log('📸 Modo:', useDayMode ? 'Day' : 'Night');
    
    // 1. Guardar decorações da imagem anterior antes de trocar
    if (selectedImage && selectedImage.id !== image.id) {
      console.log('💾 Guardando decorações da imagem anterior:', selectedImage.id, decorations.length, 'decorações');
      setDecorationsByImage(prev => ({
        ...prev,
        [selectedImage.id]: decorations
      }));
    }
    
    // 2. Carregar decorações da nova imagem do mapeamento (ou array vazio se não existir)
    const newImageDecorations = decorationsByImage[image.id] || [];
    console.log('📂 Carregando decorações da imagem:', image.id, newImageDecorations.length, 'decorações');
    setDecorations(newImageDecorations);
    
    // Carregar zonas de snap da nova imagem (já carregado em currentSnapZones mas garantir consistência)
    
    // Escolher a imagem correta baseada no modo
    const imageSrc = useDayMode ? image.thumbnail : image.nightVersion;
    console.log('📸 URL:', imageSrc);
    
    // Usar dimensões virtuais do canvas (sempre 1200x600)
    // O Konva vai escalar automaticamente para o tamanho real
    const canvasWidth = 1200;
    const canvasHeight = 600;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Calcular dimensões da imagem para caber no canvas mantendo aspect ratio
    // Assumindo aspect ratio 4:3 das imagens (pode ser ajustado)
    const imageAspectRatio = 4 / 3;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    
    // Margem de segurança (2% de cada lado) - mais espaço para a imagem
    const maxWidth = canvasWidth * 0.96;
    const maxHeight = canvasHeight * 0.96;
    
    let imageWidth, imageHeight;
    
    // Calcular tamanho mantendo aspect ratio e garantindo que cabe no canvas
    if (maxWidth / imageAspectRatio <= maxHeight) {
      // Limitado pela largura
      imageWidth = maxWidth;
      imageHeight = maxWidth / imageAspectRatio;
    } else {
      // Limitado pela altura
      imageHeight = maxHeight;
      imageWidth = maxHeight * imageAspectRatio;
    }
    
    console.log('📐 Canvas:', canvasWidth, 'x', canvasHeight);
    console.log('📐 Imagem:', imageWidth, 'x', imageHeight);
    
    const newImageLayer = {
      id: `img-${Date.now()}`, // ID único com prefixo
      type: 'image',
      name: image.name,
      src: imageSrc,
      x: centerX,
      y: centerY,
      width: imageWidth,
      height: imageHeight,
      isSourceImage: true
    };
    
    console.log('✅ Imagem adicionada ao canvas:', newImageLayer);
    
    // SUBSTITUI a imagem anterior (não adiciona)
    setCanvasImages([newImageLayer]);
    setSelectedImage(image);
  };

  // Trocar as imagens das decorações quando alternar dia/noite
  useEffect(function() {
    console.log('[CANVAS] mode', isDayMode ? 'day' : 'night');
    setDecorations(function(prev) {
      var next = [];
      for (var i = 0; i < prev.length; i++) {
        var d = prev[i];
        if (d.dayUrl || d.nightUrl) {
          var nextSrc = isDayMode ? (d.dayUrl || d.src) : (d.nightUrl || d.dayUrl || d.src);
          next.push(Object.assign({}, d, { src: nextSrc }));
        } else {
          next.push(d);
        }
      }
      return next;
    });
  }, [isDayMode]);

  // Alternar entre modo dia e noite
  const toggleDayNightMode = () => {
    const newMode = !isDayMode;
    setIsDayMode(newMode);
    
    // Cancelar modo de edição ao alternar modo para evitar confusão
    if (isEditingZones) {
      setIsEditingZones(false);
      setTempZones([]);
    }
    
    // Se há uma imagem selecionada, atualizar a imagem no canvas
    if (selectedImage && canvasImages.length > 0) {
      console.log('🌓 Alternando modo:', newMode ? 'Day' : 'Night');
      handleImageAddToCanvas(selectedImage, newMode);
      
      // Se alternando para modo noite e análise ainda não foi feita, disparar análise YOLO12
      if (newMode === false && selectedImage && !analysisComplete[selectedImage.id]) {
        setTimeout(function() {
          setAnalyzingImageId(selectedImage.id);
          setTimeout(function() {
            setAnalyzingImageId(null);
            setAnalysisComplete(function(prev) {
              var updated = {};
              for (var key in prev) {
                updated[key] = prev[key];
              }
              updated[selectedImage.id] = true;
              return updated;
            });
          }, 2500);
        }, 500);
      }
    }
  };

  // Remover imagem do canvas
  const handleImageRemoveFromCanvas = (imageId) => {
    setCanvasImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Adicionar decoração ao canvas
  // No React-Konva, z-index = ordem no array (último = frente)
  const handleDecorationAdd = (decoration) => {
    console.log('✅ Decoração adicionada:', decoration.id);
    const updatedDecorations = [...decorations, decoration];
    setDecorations(updatedDecorations);
    
    // Atualizar mapeamento da imagem selecionada
    if (selectedImage) {
      setDecorationsByImage(prev => ({
        ...prev,
        [selectedImage.id]: updatedDecorations
      }));
    }
  };

  // Remover decoração
  const handleDecorationRemove = (decorationId) => {
    const updatedDecorations = decorations.filter(d => d.id !== decorationId);
    setDecorations(updatedDecorations);
    
    // Atualizar mapeamento da imagem selecionada
    if (selectedImage) {
      setDecorationsByImage(prev => ({
        ...prev,
        [selectedImage.id]: updatedDecorations
      }));
    }
  };

  // Atualizar decoração (transformações, movimentos)
  const handleDecorationUpdate = (decorationId, newAttrs) => {
    const updatedDecorations = decorations.map(d => 
      d.id === decorationId ? newAttrs : d
    );
    setDecorations(updatedDecorations);
    
    // Atualizar mapeamento da imagem selecionada
    if (selectedImage) {
      setDecorationsByImage(prev => ({
        ...prev,
        [selectedImage.id]: updatedDecorations
      }));
    }
  };

  // Funções para gerenciar snap zones (compartilhadas entre dia e noite)
  const handleAddSnapZone = (zone) => {
    if (!selectedImage) {
      console.log('⚠️ Nenhuma imagem selecionada para adicionar zona');
      return;
    }
    
    console.log('➕ [DEBUG] Adicionando zona manual:', zone, 'para imagem:', selectedImage.id);
    
    var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
    var currentZones = imageZones.day || imageZones.night || []; // Usar qualquer um que tenha, ou vazio
    var updatedZones = [...currentZones, zone];
    
    console.log('➕ [DEBUG] Zonas antes:', currentZones.length, '| Zonas depois:', updatedZones.length);
    
    // Salvar em ambos os modos (dia e noite)
    setSnapZonesByImage(prev => {
      var updated = {};
      for (var key in prev) {
        updated[key] = prev[key];
      }
      updated[selectedImage.id] = {
        day: updatedZones,
        night: updatedZones
      };
      console.log('➕ [DEBUG] Estado snapZonesByImage atualizado:', updated);
      return updated;
    });
    
    console.log('✅ Zona de snap adicionada:', zone.id, 'para imagem:', selectedImage.id, '(dia e noite)');
  };

  const handleRemoveSnapZone = (zoneId) => {
    if (!selectedImage) return;
    
    var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
    var currentZones = imageZones.day || imageZones.night || [];
    var updatedZones = currentZones.filter(function(z) {
      return z.id !== zoneId;
    });
    
    // Remover de ambos os modos (dia e noite)
    setSnapZonesByImage(prev => ({
      ...prev,
      [selectedImage.id]: {
        day: updatedZones,
        night: updatedZones
      }
    }));
    
    console.log('🗑️ Zona de snap removida:', zoneId, '(dia e noite)');
  };

  // Função recursiva para disparar análise YOLO12 sequencialmente
  var triggerYOLOAnalysis = function(imageId) {
    if (!imageId) return;
    
    // Verificar se já foi analisada usando o estado atual
    setAnalysisComplete(function(prev) {
      if (prev[imageId]) {
        return prev; // Já analisada, não fazer nada
      }
      
      console.log('🔍 Disparando análise YOLO12 para imagem:', imageId);
      setAnalyzingImageId(imageId);
      
      // Após análise completar
      setTimeout(function() {
        console.log('✅ Análise YOLO12 completa para imagem:', imageId);
        setAnalyzingImageId(null);
        
        // Marcar como completa
        setAnalysisComplete(function(prevState) {
          var updated = {};
          for (var key in prevState) {
            updated[key] = prevState[key];
          }
          updated[imageId] = true;
          
          // Encontrar próximo índice
          var currentIndex = uploadedImages.findIndex(function(img) {
            return img.id === imageId;
          });
          
          // Disparar análise na próxima imagem se houver
          if (currentIndex >= 0 && currentIndex < uploadedImages.length - 1) {
            var nextImageId = uploadedImages[currentIndex + 1].id;
            
            setTimeout(function() {
              triggerYOLOAnalysis(nextImageId);
            }, 300);
          }
          
          return updated;
        });
      }, 2500); // Duração da animação YOLO12
      
      return prev;
    });
  };

  // Detectar quando conversão para noite completa e disparar análise YOLO12 sequencialmente
  useEffect(function() {
    if (activeGifIndex >= 0 && activeGifIndex < uploadedImages.length) {
      var imageId = uploadedImages[activeGifIndex].id;
      
      // Verificar se análise ainda não foi iniciada para esta imagem
      setAnalysisComplete(function(prev) {
        if (!prev[imageId]) {
          // Disparar após conversão completar (4 segundos)
          var timeoutId = setTimeout(function() {
            triggerYOLOAnalysis(imageId);
          }, 4000); // Aguardar conversão completar (duração do NightThumb)
          
          return prev;
        }
        return prev;
      });
    }
  }, [activeGifIndex, uploadedImages]);

  // Salvar zonas temporárias e sair do modo edição
  const handleSaveZones = function() {
    if (!selectedImage) {
      console.log('⚠️ Nenhuma imagem selecionada para salvar zonas');
      return;
    }
    
    if (tempZones.length === 0) {
      console.log('⚠️ Nenhuma zona temporária para salvar');
      return;
    }
    
    console.log('💾 [DEBUG] Salvando zonas temporárias:', tempZones.length, 'zonas para imagem:', selectedImage.id);
    
    var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
    // Usar zonas existentes de qualquer modo (ou vazio)
    var currentZones = imageZones.day || imageZones.night || [];
    var updatedZones = [...currentZones, ...tempZones];
    
    console.log('💾 [DEBUG] Zonas antes:', currentZones.length, '| Zonas depois:', updatedZones.length);
    
    // Salvar em ambos os modos (dia e noite)
    setSnapZonesByImage(function(prev) {
      var updated = {};
      for (var key in prev) {
        updated[key] = prev[key];
      }
      updated[selectedImage.id] = {
        day: updatedZones,
        night: updatedZones
      };
      console.log('💾 [DEBUG] Estado snapZonesByImage atualizado:', updated);
      return updated;
    });
    
    console.log('✅ Zonas salvas:', updatedZones.length, 'zonas para imagem:', selectedImage.id, '(dia e noite)');
    setTempZones([]);
    setIsEditingZones(false);
  };

  // Cancelar edição
  const handleCancelEditZones = function() {
    setTempZones([]);
    setIsEditingZones(false);
    console.log('❌ Edição de zonas cancelada');
  };

  // Obter zonas de snap da imagem atual (compartilhadas entre dia e noite)
  var imageZones = selectedImage ? (snapZonesByImage[selectedImage.id] || { day: [], night: [] }) : { day: [], night: [] };
  // Usar zonas de qualquer modo (são as mesmas)
  var currentSnapZones = imageZones.day || imageZones.night || [];
  var allZonesForDisplay = isEditingZones ? [...currentSnapZones, ...tempZones] : currentSnapZones;
  
  // Migração: se imageZones é um array (estrutura antiga), converter para nova estrutura
  useEffect(function() {
    if (!selectedImage) return;
    
    var imageZones = snapZonesByImage[selectedImage.id];
    if (Array.isArray(imageZones)) {
      console.log('⚠️ Migrando zonas antigas para nova estrutura:', selectedImage.id);
      setSnapZonesByImage(function(prev) {
        var updated = {};
        var needsUpdate = false;
        
        for (var key in prev) {
          if (Array.isArray(prev[key])) {
            // Migrar para ambos os modos (dia e noite)
            updated[key] = { day: prev[key], night: prev[key] };
            needsUpdate = true;
          } else {
            updated[key] = prev[key];
          }
        }
        
        // Só retornar atualizado se realmente houve mudança
        return needsUpdate ? updated : prev;
      });
    }
  }, [selectedImage?.id]); // Removido snapZonesByImage das dependências para evitar loop
  
  // Obter zonas de snap da imagem atual (compartilhadas entre dia e noite)
  var imageZones = selectedImage ? (snapZonesByImage[selectedImage.id] || { day: [], night: [] }) : { day: [], night: [] };
  // Usar zonas de qualquer modo (são as mesmas)
  var currentSnapZones = imageZones.day || imageZones.night || [];
  var allZonesForDisplay = isEditingZones ? [...currentSnapZones, ...tempZones] : currentSnapZones;
  
  // Debug: log detalhado quando imagem é selecionada
  useEffect(function() {
    if (selectedImage) {
      console.log('🔍 [DEBUG] Imagem selecionada:', selectedImage.id);
      console.log('🔍 [DEBUG] Estado snapZonesByImage:', snapZonesByImage);
      console.log('🔍 [DEBUG] Zonas para esta imagem:', snapZonesByImage[selectedImage.id]);
      var imageZones = snapZonesByImage[selectedImage.id] || { day: [], night: [] };
      var currentZones = imageZones.day || imageZones.night || [];
      console.log('🔍 [DEBUG] Zonas finais calculadas:', currentZones.length, 'zonas', currentZones);
    }
  }, [selectedImage?.id, snapZonesByImage]);

  // Salvar dados no formData E no localStorage como backup E na base de dados se projeto existir
  useEffect(() => {
    console.log('💾 [DEBUG] Salvando zonas no formData:', {
      snapZonesByImage: snapZonesByImage,
      zonasCount: Object.keys(snapZonesByImage).length,
      zonasPorImagem: Object.keys(snapZonesByImage).map(key => ({
        imagem: key,
        zonas: snapZonesByImage[key]?.day?.length || snapZonesByImage[key]?.night?.length || 0
      })),
      projectId: formData?.id
    });
    
    // Salvar no formData
    onInputChange("canvasDecorations", decorations);
    onInputChange("canvasImages", canvasImages);
    onInputChange("snapZonesByImage", snapZonesByImage);
    onInputChange("decorationsByImage", decorationsByImage);
    
    // Salvar também no localStorage como backup
    try {
      var projectId = formData?.id || 'temp';
      localStorage.setItem('snapZonesByImage_' + projectId, JSON.stringify(snapZonesByImage));
      console.log('💾 [DEBUG] Zonas salvas no localStorage também (chave: snapZonesByImage_' + projectId + ')');
    } catch (e) {
      console.log('⚠️ Erro ao salvar no localStorage:', e);
    }
    
    // Se projeto já existe (tem ID), salvar automaticamente na base de dados
    if (formData?.id && Object.keys(snapZonesByImage).length > 0) {
      var timeoutId = setTimeout(function() {
        projectsAPI.updateCanvas(formData.id, {
          snapZonesByImage: snapZonesByImage,
          canvasDecorations: decorations,
          canvasImages: canvasImages,
          decorationsByImage: decorationsByImage
        }).then(function() {
          console.log('✅ [DEBUG] Zonas salvas na base de dados para projeto:', formData.id);
        }).catch(function(err) {
          console.error('❌ [DEBUG] Erro ao salvar zonas na base de dados:', err);
        });
      }, 500); // Debounce de 500ms para evitar muitas chamadas
      
      return function() {
        clearTimeout(timeoutId);
      };
    }
  }, [decorations, canvasImages, snapZonesByImage, decorationsByImage, formData?.id]); // Removido onInputChange das dependências para evitar loop infinito

  return (
    <div className="h-full flex flex-col">
      {uploadStep === 'uploading' && <UploadModal onUploadComplete={handleUploadComplete} />}
      {uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Painel unificado de snap zones */}
      {uploadStep === 'done' && (
        <>
          <UnifiedSnapZonesPanel
            selectedImage={selectedImage}
            zones={currentSnapZones}
            tempZones={tempZones}
            isEditingZones={isEditingZones}
            isDayMode={isDayMode}
            isAnalyzed={selectedImage ? (analysisComplete[selectedImage.id] || false) : false}
            onToggleEditMode={() => {
              if (isEditingZones) {
                handleCancelEditZones();
              } else {
                setIsEditingZones(true);
                setTempZones([]);
                console.log('✏️ Modo edição de zonas ativado');
              }
            }}
            onSaveZones={handleSaveZones}
            onCancelEdit={handleCancelEditZones}
            onAddZone={handleAddSnapZone}
            onRemoveZone={handleRemoveSnapZone}
            isVisible={showUnifiedPanel}
            onToggle={() => setShowUnifiedPanel(!showUnifiedPanel)}
          />
          {/* Botão para mostrar/ocultar painel */}
          <Button
            size="md"
            variant="flat"
            color="primary"
            className="fixed bottom-4 right-4 z-[100] shadow-lg hover:shadow-xl transition-shadow"
            onPress={() => {
              console.log('🔧 Toggle Unified Panel:', !showUnifiedPanel);
              setShowUnifiedPanel(!showUnifiedPanel);
            }}
            title="Configurar Snap Zones"
            startContent={<Icon icon="lucide:crosshair" className="text-lg" />}
          >
            Snap Zones
          </Button>
        </>
      )}
      
      {/* Main Content Area - 3 Column Layout */}
      {uploadStep === 'done' && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Image Thumbnails */}
          <aside className="w-32 md:w-40 lg:w-48 border-r border-divider bg-content1/30 flex flex-col flex-shrink-0">
            <div className="p-3 md:p-4 border-b border-divider text-center">
              <h3 className="text-base md:text-lg font-semibold">Source Images</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
              {uploadedImages.map((image, index) => (
                <div key={image.id} className="relative">
                  <Card
                    isFooterBlurred
                    isPressable
                    className={`cursor-pointer border-none transition-all duration-200 ${
                      selectedImage?.id === image.id 
                        ? 'ring-2 ring-primary shadow-lg' 
                        : 'hover:ring-1 hover:ring-primary/50'
                    }`}
                    radius="lg"
                    onPress={() => {
                      console.log('🖱️ CARD CLICADO - Imagem:', image.name);
                      handleImageAddToCanvas(image);
                    }}
                  >
                    {/* NightThumb com animação de dia para noite */}
                    <NightThumb
                      dayImage={image.thumbnail}
                      nightImage={image.nightVersion}
                      filename={image.name}
                      isActive={index === activeGifIndex}
                      duration={4000}
                    />
                    
                    <Image
                      alt={image.name}
                      className="object-cover"
                      height={120}
                      src={image.thumbnail}
                      width="100%"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center bg-default-100">
                      <Icon icon="lucide:image" className="text-4xl text-default-400" />
                    </div>
                    
                    <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
                      <div className="flex grow gap-2 items-center">
                        <p className="text-tiny text-white/80 truncate">{image.name}</p>
                      </div>
                      {selectedImage?.id === image.id && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Icon icon="lucide:check" className="text-white text-xs" />
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                  
                  {/* Overlay de análise YOLO12 no thumbnail específico - FORA do Card para garantir z-index */}
                  {analyzingImageId === image.id && (
                    <YOLO12ThumbnailOverlay duration={2500} />
                  )}
                </div>
              ))}

              {/* Fake add image card (placed after sources) */}
              <Card
                isFooterBlurred
                isPressable={false}
                className="w-full cursor-not-allowed border-none transition-all duration-200 opacity-80 hover:opacity-70"
                radius="lg"
                onPress={() => {
                  console.log('➕ [Source Images] Fake add image clicked');
                }}
              >
                <div className="w-full h-[120px] flex items-center justify-center bg-gradient-to-br from-default-100 to-default-200 rounded-lg relative overflow-hidden">
                  {/* Overlay pattern sutil para indicar disabled */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/2"></div>
                  
                  <div className="flex flex-col items-center gap-2 text-default-500 relative z-10">
                    <Icon icon="lucide:upload-cloud" className="text-3xl opacity-80" />
                    <span className="text-sm font-medium text-center leading-tight">Add image or take picture</span>
                  </div>
                </div>
                <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1 pointer-events-none">
                  <div className="flex grow gap-2 items-center">
                    <Icon icon="lucide:clock" className="text-tiny text-warning-400" />
                    <p className="text-tiny text-white/80 truncate">Upload (coming soon)</p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </aside>

          {/* Center Canvas Area */}
          <div className="flex-1 min-h-0 flex flex-col bg-content1">
            <div className="h-full flex flex-col p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold text-center flex-1">Decoration Canvas</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color={isDayMode ? "warning" : "primary"}
                    startContent={
                      <Icon 
                        icon={isDayMode ? "lucide:sun" : "lucide:moon"} 
                        className={isDayMode ? "text-warning" : "text-primary"}
                      />
                    }
                    onPress={toggleDayNightMode}
                    isDisabled={canvasImages.length === 0}
                  >
                    {isDayMode ? 'Day' : 'Night'}
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Icon icon="lucide:refresh-cw" />}
                    onPress={() => {
                      // Limpar tudo, incluindo o mapeamento de decorações por imagem
                      setDecorations([]);
                      setDecorationsByImage({});
                      setCanvasImages([]);
                      setSelectedImage(null);
                    }}
                    isDisabled={decorations.length === 0 && canvasImages.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                {noBgWarning && (
                  <div className="mb-2 p-2 rounded-md bg-warning-50 border border-warning-200 text-warning-700 text-sm">
                    ⚠️ Select a background image to add PNGs
                  </div>
                )}
                <KonvaCanvas
                  width="100%"
                  height="100%"
                  onDecorationAdd={handleDecorationAdd}
                  onDecorationRemove={handleDecorationRemove}
                  onDecorationUpdate={handleDecorationUpdate}
                  onImageRemove={handleImageRemoveFromCanvas}
                  decorations={decorations}
                  canvasImages={canvasImages}
                  selectedImage={selectedImage}
                  snapZones={allZonesForDisplay}
                  isDayMode={isDayMode}
                  isEditingZones={isEditingZones}
                  analysisComplete={analysisComplete}
                  onZoneCreate={(zone) => {
                    console.log('🎨 [DEBUG] Zona criada no canvas, adicionando a tempZones:', zone);
                    setTempZones(function(prev) {
                      var updated = [...prev, zone];
                      console.log('🎨 [DEBUG] tempZones atualizado:', updated.length, 'zonas temporárias');
                      return updated;
                    });
                  }}
                  onRequireBackground={() => {
                    setNoBgWarning(true);
                    setTimeout(() => setNoBgWarning(false), 2000);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Decoration Library */}
          <DecorationLibrary
            mode="sidebar"
            isDayMode={isDayMode}
            disabled={canvasImages.length === 0}
            onDecorationSelect={(decoration) => {
              // ⚠️ VERIFICAR SE HÁ IMAGEM DE FUNDO antes de adicionar decoração
              if (canvasImages.length === 0) {
                console.warn('⚠️ Adicione primeiro uma imagem de fundo!');
                setNoBgWarning(true);
                setTimeout(() => setNoBgWarning(false), 2000);
                return;
              }
              
              // Usar dimensões virtuais do canvas (sempre 1200x600)
              // O Konva vai escalar automaticamente para o tamanho real
              const centerX = 600; // Centro do canvas virtual (1200/2)
              const centerY = 300; // Centro do canvas virtual (600/2)
              
              // Criar nova decoração para o canvas na posição central
              const newDecoration = {
                id: `dec-${Date.now()}`, // ID único com prefixo
                type: decoration.imageUrl ? 'image' : decoration.type, // Se tem imageUrl, tipo = image
                name: decoration.name,
                icon: decoration.icon,
                // Guardar URLs para alternância futura
                dayUrl: decoration.imageUrlDay || decoration.thumbnailUrl || decoration.imageUrl || undefined,
                nightUrl: decoration.imageUrlNight || undefined,
                src: decoration.imageUrl || undefined, // URL já resolvida pelo modo atual
                x: centerX,
                y: centerY,
                width: decoration.imageUrl ? 100 : 60, // Imagens PNG maiores
                height: decoration.imageUrl ? 100 : 60,
                rotation: 0, // Rotação inicial
                color: getDecorationColor(decoration.type)
              };
              handleDecorationAdd(newDecoration);
            }}
            enableSearch={true}
            className="w-64 md:w-72 lg:w-80"
          />
        </div>
      )}
    </div>
  );
};
