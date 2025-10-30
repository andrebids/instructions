import React, { useRef, useEffect, useState } from "react";
import { Card, CardFooter, Button, Spinner, Progress, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { DecorationLibrary } from "../../decoration-library";
import { Stage, Layer, Image as KonvaImage, Transformer, Rect, Circle } from 'react-konva';
import useImage from 'use-image';
import { NightThumb } from '../../NightThumb';
import { YOLO12ThumbnailOverlay } from './YOLO12ThumbnailOverlay';
import { SnapZonesPanel } from './SnapZonesPanel';

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
  onChange 
}) => {
  const [image] = useImage(decoration.src, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      // Attach transformer manualmente ao shape
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    console.log('🔄 Decoração movida:', decoration.id, 'nova posição:', e.target.x(), e.target.y());
    onChange({
      ...decoration,
      x: e.target.x(),
      y: e.target.y(),
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
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
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
  isDayMode = true
}) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
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

  // Click/Touch no Stage para desselecionar decoração
  const checkDeselect = (e) => {
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
      
      // Aplicar snap se houver zonas definidas e modo noite ativo
      if (!isDayMode && snapZones && snapZones.length > 0) {
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
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        className={`rounded-lg ${
          canvasImages.length > 0 || dragOver
            ? (dragOver 
                ? 'ring-2 ring-primary bg-primary/10' 
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

        {/* Layer 1.5: Snap Zone Markers (apenas modo noite) */}
        <Layer>
          <SnapZoneMarkers 
            zones={snapZones} 
            isVisible={!isDayMode}
          />
        </Layer>

        {/* Layer 2: Decorações (arrastáveis com Transformer) */}
        <Layer>
          {decorations.map(decoration => (
            <DecorationItem
              key={decoration.id}
              decoration={decoration}
              isSelected={decoration.id === selectedId}
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
  const [analyzingImageId, setAnalyzingImageId] = useState(null); // ID da imagem que está sendo analisada
  const [analysisComplete, setAnalysisComplete] = useState({}); // Mapeia quais imagens já foram analisadas
  const [showSnapZonesPanel, setShowSnapZonesPanel] = useState(false); // Painel oculto por padrão
  
  // Imagens carregadas (simuladas) - dados de origem
  const loadedImages = [
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

  // Alternar entre modo dia e noite
  const toggleDayNightMode = () => {
    const newMode = !isDayMode;
    setIsDayMode(newMode);
    
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

  // Funções para gerenciar snap zones
  const handleAddSnapZone = (zone) => {
    if (!selectedImage) return;
    
    var currentZones = snapZonesByImage[selectedImage.id] || [];
    var updatedZones = [...currentZones, zone];
    
    setSnapZonesByImage(prev => ({
      ...prev,
      [selectedImage.id]: updatedZones
    }));
    
    console.log('✅ Zona de snap adicionada:', zone.id, 'para imagem:', selectedImage.id);
  };

  const handleRemoveSnapZone = (zoneId) => {
    if (!selectedImage) return;
    
    var currentZones = snapZonesByImage[selectedImage.id] || [];
    var updatedZones = currentZones.filter(function(z) {
      return z.id !== zoneId;
    });
    
    setSnapZonesByImage(prev => ({
      ...prev,
      [selectedImage.id]: updatedZones
    }));
    
    console.log('🗑️ Zona de snap removida:', zoneId);
  };

  // Detectar quando conversão para noite completa e disparar análise YOLO12
  useEffect(function() {
    if (activeGifIndex >= 0 && activeGifIndex < uploadedImages.length) {
      var imageId = uploadedImages[activeGifIndex].id;
      
      // Se a análise ainda não foi completada para esta imagem, disparar após delay
      if (!analysisComplete[imageId]) {
        var timeoutId = setTimeout(function() {
          // Disparar análise YOLO12 no thumbnail específico
          setAnalyzingImageId(imageId);
          
          // Após análise completar, marcar como completa
          setTimeout(function() {
            setAnalyzingImageId(null);
            setAnalysisComplete(function(prev) {
              var updated = {};
              for (var key in prev) {
                updated[key] = prev[key];
              }
              updated[imageId] = true;
              return updated;
            });
          }, 2500); // Duração da animação YOLO12
        }, 4000); // Aguardar conversão completar (duração do NightThumb)
        
        return function() {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [activeGifIndex, uploadedImages, analysisComplete]);

  // Obter zonas de snap da imagem atual
  var currentSnapZones = selectedImage ? (snapZonesByImage[selectedImage.id] || []) : [];

  // Salvar dados no formData
  useEffect(() => {
    onInputChange("canvasDecorations", decorations);
    onInputChange("canvasImages", canvasImages);
    onInputChange("snapZonesByImage", snapZonesByImage);
  }, [decorations, canvasImages, snapZonesByImage]); // Removido onInputChange das dependências para evitar loop infinito

  return (
    <div className="h-full flex flex-col">
      {uploadStep === 'uploading' && <UploadModal onUploadComplete={handleUploadComplete} />}
      {uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Painel de configuração de snap zones (oculto por padrão) */}
      {uploadStep === 'done' && (
        <>
          <SnapZonesPanel
            zones={currentSnapZones}
            onAddZone={handleAddSnapZone}
            onRemoveZone={handleRemoveSnapZone}
            isVisible={showSnapZonesPanel}
            onToggle={() => setShowSnapZonesPanel(!showSnapZonesPanel)}
          />
          {/* Botão para mostrar/ocultar painel - mais visível */}
          <Button
            isIconOnly
            size="md"
            variant="flat"
            color="primary"
            className="fixed bottom-4 right-4 z-40 shadow-lg hover:shadow-xl transition-shadow"
            onPress={() => setShowSnapZonesPanel(!showSnapZonesPanel)}
            title="Configurar Snap Zones"
          >
            <Icon icon="lucide:crosshair" className="text-lg" />
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
                <Card
                  key={image.id}
                  isFooterBlurred
                  isPressable
                  className={`cursor-pointer border-none transition-all duration-200 relative ${
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
                  
                  {/* Overlay de análise YOLO12 no thumbnail específico */}
                  {analyzingImageId === image.id && (
                    <YOLO12ThumbnailOverlay duration={2500} />
                  )}
                  
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
                  snapZones={currentSnapZones}
                  isDayMode={isDayMode}
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
                src: decoration.imageUrl || undefined, // Adicionar src se tiver imageUrl
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
            className="w-48 md:w-56 lg:w-64"
          />
        </div>
      )}
    </div>
  );
};
