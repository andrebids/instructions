import React, { useRef, useEffect, useState } from "react";
import { Card, CardFooter, Button, Spinner, Progress, Image } from "@heroui/react";
import { Icon } from "@iconify/react";

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

// Componente para Cartão de Decoração
const DecorationCard = ({ decoration, index }) => (
  <div
    key={index}
    className="p-2 md:p-3 border border-divider rounded-lg cursor-grab hover:border-primary/50 transition-colors bg-background"
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({
        type: decoration.type,
        name: decoration.name,
        icon: decoration.icon
      }));
    }}
  >
    <div className="text-center">
      <div className="text-xl md:text-2xl mb-1">{decoration.icon}</div>
      <p className="text-[10px] md:text-xs text-default-600 truncate">{decoration.name}</p>
    </div>
  </div>
);


// Componente Konva Canvas (simulado até instalação das dependências)
const KonvaCanvas = ({ width, height, onDecorationAdd, onDecorationRemove, decorations = [], startGeneration, selectedImage }) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Simular carregamento de decorações
  const handleGenerateDecorations = async () => {
    setIsLoading(true);
    
    // Simular delay de geração (muito rápido)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Adicionar decorações simuladas
    const newDecorations = [
      { id: 1, type: "tree", x: 200, y: 150, width: 100, height: 120, color: "#228B22" },
      { id: 2, type: "lights", x: 300, y: 200, width: 80, height: 60, color: "#FFD700" },
      { id: 3, type: "ornament", x: 400, y: 180, width: 60, height: 60, color: "#FF6347" },
    ];
    
    newDecorations.forEach(decoration => {
      onDecorationAdd(decoration);
    });
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (startGeneration) {
      handleGenerateDecorations();
    }
  }, [startGeneration]);

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
      const decorationData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Criar nova decoração
      const newDecoration = {
        id: Date.now(), // ID único baseado no timestamp
        type: decorationData.type,
        name: decorationData.name,
        icon: decorationData.icon,
        x: x,
        y: y,
        width: 60,
        height: 60,
        color: getDecorationColor(decorationData.type)
      };
      
      onDecorationAdd(newDecoration);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Função para obter cor baseada no tipo
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


  return (
    <div className="relative h-full w-full">
      {/* Canvas placeholder - será substituído por Konva real */}
      <div 
        ref={canvasRef}
        className={`rounded-lg h-full w-full overflow-hidden transition-colors ${
          selectedImage 
            ? (dragOver 
                ? 'border-2 border-primary bg-primary/10' 
                : 'border-0 bg-transparent')
            : (dragOver 
                ? 'border-2 border-primary bg-primary/10' 
                : 'border-2 border-dashed border-default-300 bg-default-50')
        }`}
        style={{ 
          width: width === "100%" ? "100%" : width,
          height: height === "100%" ? "100%" : height
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Background Image */}
        {selectedImage && (
          <div className="absolute inset-0">
            <img
              src={selectedImage.thumbnail}
              alt={selectedImage.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Overlay Content - Only show when needed */}
        {(isLoading || decorations.length > 0 || !selectedImage) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {isLoading ? (
              <div className="text-center bg-black/50 rounded-lg p-6">
                <Spinner size="lg" color="white" />
                <p className="mt-4 text-white">Generating decorations with AI...</p>
              </div>
            ) : decorations.length > 0 ? (
              <div className="text-center bg-black/50 rounded-lg p-6">
                <Icon icon="lucide:check-circle" className="text-success text-4xl mb-2" />
                <p className="text-success font-medium">{decorations.length} decorations generated</p>
              </div>
            ) : (
              <div className="text-center">
                <Icon icon="lucide:image" className="text-default-400 text-4xl mb-2" />
                <p className="text-default-600 mb-4">Select an image to start decorating</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Decorações arrastáveis */}
      {decorations.map(decoration => (
        <div
          key={decoration.id}
          className="absolute rounded-lg border-2 border-white shadow-lg cursor-move hover:scale-105 transition-transform"
          style={{
            left: decoration.x,
            top: decoration.y,
            width: decoration.width,
            height: decoration.height,
            backgroundColor: decoration.color,
            transform: 'translate(-50%, -50%)'
          }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(decoration));
          }}
        >
          <div className="flex items-center justify-center h-full text-white font-bold text-xs">
            {decoration.icon || decoration.type}
          </div>
          {/* Botão de remover */}
          <button
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDecorationRemove(decoration.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export const StepAIDesigner = ({ formData, onInputChange }) => {
  const [decorations, setDecorations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadStep, setUploadStep] = useState('uploading'); // 'uploading', 'loading', 'done'
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Imagens carregadas (simuladas)
  const loadedImages = [
    { 
      id: 1, 
      name: 'source 1.jpeg', 
      thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center'
    },
    { 
      id: 2, 
      name: 'source 2.jpeg', 
      thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop&crop=center'
    },
    { 
      id: 3, 
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



  // Adicionar decoração ao canvas
  const handleDecorationAdd = (decoration) => {
    setDecorations(prev => [...prev, decoration]);
  };

  // Remover decoração
  const handleDecorationRemove = (decorationId) => {
    setDecorations(prev => prev.filter(d => d.id !== decorationId));
  };

  // Salvar decorações no formData
  useEffect(() => {
    onInputChange("canvasDecorations", decorations);
  }, [decorations]); // Removido onInputChange das dependências para evitar loop infinito

  return (
    <div className="h-full flex flex-col">
      {uploadStep === 'uploading' && <UploadModal />}
      {uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Main Content Area - 3 Column Layout */}
      {uploadStep === 'done' && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Image Thumbnails */}
          <aside className="w-32 md:w-40 lg:w-48 border-r border-divider bg-content1/30 flex flex-col flex-shrink-0">
            <div className="p-3 md:p-4 border-b border-divider">
              <h3 className="text-base md:text-lg font-semibold">Source Images</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
              {loadedImages.map((image) => (
                <Card
                  key={image.id}
                  isFooterBlurred
                  className={`cursor-pointer border-none transition-all duration-200 ${
                    selectedImage?.id === image.id 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:ring-1 hover:ring-primary/50'
                  }`}
                  radius="lg"
                  onClick={() => setSelectedImage(image)}
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
                  
                  <CardFooter className="absolute bg-black/40 bottom-0 z-10 py-1">
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
            </div>
          </aside>

          {/* Center Canvas Area */}
          <div className="flex-1 min-h-0 flex flex-col bg-content1">
            <div className="h-full flex flex-col p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-base md:text-lg font-semibold">Decoration Canvas</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Icon icon="lucide:refresh-cw" />}
                    onPress={() => setDecorations([])}
                    isDisabled={decorations.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 min-h-0">
                <KonvaCanvas
                  width="100%"
                  height="100%"
                  onDecorationAdd={handleDecorationAdd}
                  onDecorationRemove={handleDecorationRemove}
                  decorations={decorations}
                  startGeneration={uploadStep === 'done'}
                  selectedImage={selectedImage}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Decoration Library */}
          <aside className="w-48 md:w-56 lg:w-64 border-l border-divider bg-content1/30 flex flex-col flex-shrink-0">
            <div className="p-3 md:p-4 border-b border-divider">
              <h3 className="text-base md:text-lg font-semibold">Decorations</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-3 lg:p-4">
              <div className="space-y-4">
                {/* Decoration Categories */}
                <div>
                  <h4 className="text-xs md:text-sm font-medium text-default-600 mb-2">Trees & Plants</h4>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {[
                      { name: 'Pine Tree', icon: '🌲', type: 'tree' },
                      { name: 'Oak Tree', icon: '🌳', type: 'tree' },
                      { name: 'Palm Tree', icon: '🌴', type: 'tree' },
                      { name: 'Bush', icon: '🌿', type: 'plant' }
                    ].map((decoration, index) => (
                      <DecorationCard key={index} decoration={decoration} index={index} />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs md:text-sm font-medium text-default-600 mb-2">Lights & Ornaments</h4>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {[
                      { name: 'Christmas Lights', icon: '💡', type: 'lights' },
                      { name: 'Star', icon: '⭐', type: 'ornament' },
                      { name: 'Bell', icon: '🔔', type: 'ornament' },
                      { name: 'Gift', icon: '🎁', type: 'ornament' }
                    ].map((decoration, index) => (
                      <DecorationCard key={index} decoration={decoration} index={index} />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs md:text-sm font-medium text-default-600 mb-2">Holiday Items</h4>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {[
                      { name: 'Snowman', icon: '⛄', type: 'holiday' },
                      { name: 'Santa Hat', icon: '🎅', type: 'holiday' },
                      { name: 'Candy Cane', icon: '🍭', type: 'holiday' },
                      { name: 'Snowflake', icon: '❄️', type: 'holiday' }
                    ].map((decoration, index) => (
                      <DecorationCard key={index} decoration={decoration} index={index} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
