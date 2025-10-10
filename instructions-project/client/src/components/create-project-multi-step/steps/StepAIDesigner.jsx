import React, { useRef, useEffect, useState } from "react";
import { Card, CardFooter, Button, Spinner, Progress, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { DecorationLibrary } from "../../decoration-library";

// Componente para o Modal de Upload
const UploadModal = () => {
  const [isPreparing, setIsPreparing] = useState(true);
  const [files, setFiles] = useState([
    { name: 'source 1.jpeg', size: '2.4 MB', progress: 0, status: 'pending' },
    { name: 'source 2.jpeg', size: '1.8 MB', progress: 0, status: 'pending' },
    { name: 'source 3.jpeg', size: '0.9 MB', progress: 0, status: 'pending' },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsPreparing(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPreparing) return;

    let fileIndex = 0;
    const intervals = [];

    const uploadNextFile = () => {
      if (fileIndex >= files.length) return;

      setFiles(prev => {
        const newFiles = [...prev];
        if (newFiles[fileIndex]) {
          newFiles[fileIndex].status = 'uploading';
        }
        return newFiles;
      });

      const interval = setInterval(() => {
        setFiles(prev => {
          const newFiles = [...prev];
          const currentFile = newFiles[fileIndex];

          // Verificar se currentFile existe antes de aceder às suas propriedades
          if (currentFile && currentFile.progress < 100) {
            currentFile.progress += 10;
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
      }, 20);
      intervals.push(interval);
    };

    uploadNextFile();

    return () => intervals.forEach(clearInterval);
  }, [isPreparing, files.length]);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <Card className="p-8 text-center max-w-lg w-full m-4 transition-all duration-300">
        {isPreparing ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Upload Background Image</h2>
            <div className="border-2 border-dashed border-default-300 rounded-lg p-12 bg-default-50">
              <Icon icon="lucide:upload-cloud" className="text-5xl text-default-500 mx-auto mb-4" />
              <p className="text-default-600 mb-2">Drag and drop your images here</p>
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

// Componente Konva Canvas (simulado até instalação das dependências)
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
  decorations = [], 
  canvasImages = [],
  selectedImage 
}) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Função para gerar decorações (não usada automaticamente)
  const handleGenerateDecorations = async () => {
    setIsLoading(true);
    
    // Simular delay de geração
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Adicionar decorações simuladas
    const newDecorations = [
      { id: `dec-${Date.now()}-1`, type: "tree", x: 200, y: 150, width: 100, height: 120, color: "#228B22" },
      { id: `dec-${Date.now()}-2`, type: "lights", x: 300, y: 200, width: 80, height: 60, color: "#FFD700" },
      { id: `dec-${Date.now()}-3`, type: "ornament", x: 400, y: 180, width: 60, height: 60, color: "#FF6347" },
    ];
    
    newDecorations.forEach(decoration => {
      onDecorationAdd(decoration);
    });
    
    setIsLoading(false);
  };

  // Removido useEffect que gerava decorações automaticamente

  // Handle drag and drop
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
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Verificar se é uma decoração sendo movida ou uma nova da biblioteca
      const moveData = e.dataTransfer.getData('decoration-move');
      
      if (moveData) {
        // Mover decoração existente (sempre permitido)
        const decoration = JSON.parse(moveData);
        console.log('🔄 Movendo decoração:', decoration.id, 'para', x, y);
        
        // Atualizar posição da decoração
        onDecorationAdd({ ...decoration, x, y });
        onDecorationRemove(decoration.id);
      } else {
        // Adicionar nova decoração da biblioteca
        const decorationData = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // ⚠️ VERIFICAR SE HÁ IMAGEM DE FUNDO antes de adicionar decoração
        if (canvasImages.length === 0) {
          console.warn('⚠️ Não é possível adicionar decoração sem imagem de fundo!');
          return;
        }
        
        const newDecoration = {
          id: Date.now(), // ID único baseado no timestamp
          type: decorationData.imageUrl ? 'image' : decorationData.type, // Se tem imageUrl, tipo = image
          name: decorationData.name,
          icon: decorationData.icon,
          src: decorationData.imageUrl || undefined, // Adicionar src se tiver imageUrl
          x: x,
          y: y,
          width: decorationData.imageUrl ? 100 : 60, // Imagens PNG maiores
          height: decorationData.imageUrl ? 100 : 60,
          color: getDecorationColor(decorationData.type)
        };
        
        console.log('➕ Adicionando nova decoração:', newDecoration);
        onDecorationAdd(newDecoration);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Canvas placeholder - será substituído por Konva real */}
      <div 
        ref={canvasRef}
        className={`rounded-lg h-full w-full overflow-hidden transition-colors ${
          canvasImages.length > 0 || dragOver
            ? (dragOver 
                ? 'border-2 border-primary bg-primary/10' 
                : 'border-0 bg-default-100')
            : 'border-2 border-dashed border-default-300 bg-default-50'
        }`}
        style={{ 
          width: width === "100%" ? "100%" : width,
          height: height === "100%" ? "100%" : height
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Imagens do Canvas (Source Images adicionadas) - SEMPRE NO FUNDO */}
        {canvasImages.map(img => (
          <div
            key={img.id}
            className="absolute shadow-2xl"
            style={{
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              transform: 'translate(-50%, -50%)',
              zIndex: 1 // Camada de fundo - source images
            }}
          >
            {/* Imagem de fundo */}
            <img
              src={img.src}
              alt={img.name}
              className="w-full h-full object-cover rounded-lg"
              draggable={false}
            />
          </div>
        ))}
        
        {/* Overlay Content - Only show when needed (Layer 2: z-index 50) */}
        {(isLoading || (decorations.length > 0 && canvasImages.length === 0) || (canvasImages.length === 0 && decorations.length === 0)) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 50 }}>
            {isLoading ? (
              <div className="text-center bg-black/50 rounded-lg p-6">
                <Spinner size="lg" color="white" />
                <p className="mt-4 text-white">Generating decorations with AI...</p>
              </div>
            ) : canvasImages.length === 0 && decorations.length === 0 ? (
              <div className="text-center">
                <Icon icon="lucide:image" className="text-default-400 text-4xl mb-2" />
                <p className="text-default-600 mb-4">Click on a Source Image to start</p>
                <p className="text-default-500 text-sm">Then add decorations on top</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {/* Decorações arrastáveis - SEMPRE POR CIMA das source images */}
      {decorations.map(decoration => {
        // Verificar se é uma imagem PNG (decoração tipo image com src)
        const isImageDecoration = decoration.type === 'image' && decoration.src;
        
        return (
          <div
            key={decoration.id}
            className={`absolute cursor-move hover:scale-105 transition-transform ${
              isImageDecoration ? '' : 'rounded-lg border-2 border-white shadow-lg'
            }`}
            style={{
              left: decoration.x,
              top: decoration.y,
              width: decoration.width,
              height: decoration.height,
              backgroundColor: isImageDecoration ? 'transparent' : decoration.color,
              transform: 'translate(-50%, -50%)',
              zIndex: decoration.zIndex || 100 // Cada decoração tem seu próprio z-index
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('decoration-move', JSON.stringify(decoration));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={(e) => {
              // Ao clicar, trazer para frente (aumentar z-index)
              e.stopPropagation();
              const maxZ = Math.max(...decorations.map(d => d.zIndex || 100));
              if (decoration.zIndex < maxZ) {
                console.log('🔼 Trazendo decoração para frente:', decoration.id);
                onDecorationAdd({ ...decoration, zIndex: maxZ + 1 });
                onDecorationRemove(decoration.id);
              }
            }}
          >
            {isImageDecoration ? (
              // Renderizar PNG com transparência
              <img
                src={decoration.src}
                alt={decoration.name || 'decoration'}
                className="w-full h-full object-contain pointer-events-none select-none"
                style={{ backgroundColor: 'transparent' }}
                draggable={false}
              />
            ) : (
              // Renderizar decoração colorida com ícone
              <div className="flex items-center justify-center h-full text-white font-bold text-xs">
                {decoration.icon || decoration.type}
              </div>
            )}
            
            {/* Botão de remover */}
            <button
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors z-20"
              onClick={(e) => {
                e.stopPropagation();
                onDecorationRemove(decoration.id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const StepAIDesigner = ({ formData, onInputChange }) => {
  const [decorations, setDecorations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadStep, setUploadStep] = useState('uploading'); // 'uploading', 'loading', 'done'
  const [selectedImage, setSelectedImage] = useState(null);
  const [canvasImages, setCanvasImages] = useState([]); // Imagens adicionadas ao canvas
  const [nextZIndex, setNextZIndex] = useState(100); // Próximo z-index disponível para decorações
  
  // Imagens carregadas (simuladas)
  const loadedImages = [
    { 
      id: 'source-img-1', 
      name: 'source 1.jpeg', 
      thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center'
    },
    { 
      id: 'source-img-2', 
      name: 'source 2.jpeg', 
      thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center'
    },
    { 
      id: 'source-img-3', 
      name: 'source 3.jpeg', 
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=center'
    },
  ];

  // Simular o fluxo de upload
  useEffect(() => {
    // 1. Mostrar o modal de upload (muito rápido)
    const t1 = setTimeout(() => {
      setUploadStep('loading');
    }, 100);

    // 2. Mostrar o ecrã de loading por tempo mínimo
    const t2 = setTimeout(() => {
      setUploadStep('done');
    }, 300);

    // Limpar os timeouts se o componente for desmontado
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);



  // Adicionar imagem source ao canvas (substitui a anterior)
  const handleImageAddToCanvas = (image) => {
    console.log('📸🖼️ ===== SOURCE IMAGE CLICADA =====');
    console.log('📸 Nome:', image.name);
    console.log('📸 ID:', image.id);
    console.log('📸 URL:', image.thumbnail);
    
    // Calcular dimensões do canvas
    const canvasElement = document.querySelector('.rounded-lg.h-full.w-full');
    let canvasWidth = 1200;
    let canvasHeight = 600;
    let centerX = canvasWidth / 2;
    let centerY = canvasHeight / 2;
    
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      canvasWidth = rect.width;
      canvasHeight = rect.height;
      centerX = canvasWidth / 2;
      centerY = canvasHeight / 2;
    }
    
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
      src: image.thumbnail,
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

  // Remover imagem do canvas
  const handleImageRemoveFromCanvas = (imageId) => {
    setCanvasImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Adicionar decoração ao canvas
  const handleDecorationAdd = (decoration) => {
    // Se a decoração não tem zIndex, atribuir o próximo disponível
    const decorationWithZIndex = {
      ...decoration,
      zIndex: decoration.zIndex || nextZIndex
    };
    
    console.log('✅ Decoração adicionada com z-index:', decorationWithZIndex.zIndex);
    
    setDecorations(prev => [...prev, decorationWithZIndex]);
    setNextZIndex(prev => prev + 1); // Incrementar para a próxima decoração
  };

  // Remover decoração
  const handleDecorationRemove = (decorationId) => {
    setDecorations(prev => prev.filter(d => d.id !== decorationId));
  };

  // Salvar dados no formData
  useEffect(() => {
    onInputChange("canvasDecorations", decorations);
    onInputChange("canvasImages", canvasImages);
  }, [decorations, canvasImages]); // Removido onInputChange das dependências para evitar loop infinito

  return (
    <div className="h-full flex flex-col">
      {uploadStep === 'uploading' && <UploadModal />}
      {uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Main Content Area - 3 Column Layout */}
      {uploadStep === 'done' && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Image Thumbnails */}
          <aside className="w-32 md:w-40 lg:w-48 border-r border-divider bg-content1/30 flex flex-col flex-shrink-0">
            <div className="p-3 md:p-4 border-b border-divider text-center">
              <h3 className="text-base md:text-lg font-semibold">Source Images</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
              {loadedImages.map((image) => (
                <Card
                  key={image.id}
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
                    variant="light"
                    startContent={<Icon icon="lucide:refresh-cw" />}
                    onPress={() => {
                      setDecorations([]);
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
                <KonvaCanvas
                  width="100%"
                  height="100%"
                  onDecorationAdd={handleDecorationAdd}
                  onDecorationRemove={handleDecorationRemove}
                  onImageRemove={handleImageRemoveFromCanvas}
                  decorations={decorations}
                  canvasImages={canvasImages}
                  selectedImage={selectedImage}
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
                return;
              }
              
              // Calcular posição central do canvas se houver imagem selecionada
              const canvasElement = document.querySelector('.rounded-lg.h-full.w-full');
              let centerX = 200; // Posição default
              let centerY = 200;
              
              if (canvasElement) {
                const rect = canvasElement.getBoundingClientRect();
                centerX = rect.width / 2;
                centerY = rect.height / 2;
              }
              
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
