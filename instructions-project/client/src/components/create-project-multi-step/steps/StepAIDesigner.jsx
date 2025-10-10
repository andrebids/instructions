import React, { useRef, useEffect, useState } from "react";
import { Card, Button, Spinner, Progress } from "@heroui/react";
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
    const timer = setTimeout(() => setIsPreparing(false), 1500);
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
      }, 100);
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


// Componente Konva Canvas (simulado até instalação das dependências)
const KonvaCanvas = ({ width, height, onDecorationAdd, decorations = [], startGeneration, selectedImage }) => {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simular carregamento de decorações
  const handleGenerateDecorations = async () => {
    setIsLoading(true);
    
    // Simular delay de geração
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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


  return (
    <div className="relative h-full w-full">
      {/* Canvas placeholder - será substituído por Konva real */}
      <div 
        ref={canvasRef}
        className="border-2 border-dashed border-default-300 rounded-lg bg-default-50 h-full w-full overflow-hidden"
        style={{ 
          width: width === "100%" ? "100%" : width,
          height: height === "100%" ? "100%" : height
        }}
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
        
        {/* Overlay Content */}
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
          ) : selectedImage ? (
            <div className="text-center bg-black/50 rounded-lg p-6">
              <Icon icon="lucide:sparkles" className="text-white text-4xl mb-2" />
              <p className="text-white mb-4">Canvas ready for decorations</p>
              <p className="text-white/80 text-sm">Selected: {selectedImage.name}</p>
            </div>
          ) : (
            <div className="text-center">
              <Icon icon="lucide:image" className="text-default-400 text-4xl mb-2" />
              <p className="text-default-600 mb-4">Select an image to start decorating</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorações simuladas */}
      {decorations.map(decoration => (
        <div
          key={decoration.id}
          className="absolute rounded-lg border-2 border-white shadow-lg"
          style={{
            left: decoration.x,
            top: decoration.y,
            width: decoration.width,
            height: decoration.height,
            backgroundColor: decoration.color,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-center justify-center h-full text-white font-bold text-xs">
            {decoration.type}
          </div>
        </div>
      ))}
    </div>
  );
};

export const StepAIDesigner = ({ formData, onInputChange, selectedImage, onUploadStepChange }) => {
  const [decorations, setDecorations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadStep, setUploadStep] = useState('uploading'); // 'uploading', 'loading', 'done'

  // Simular o fluxo de upload
  useEffect(() => {
    // 1. Mostrar o modal de upload (1.5s estático + 3s animação)
    const t1 = setTimeout(() => {
      setUploadStep('loading');
    }, 4500);

    // 2. Mostrar o ecrã de loading por mais 2 segundos
    const t2 = setTimeout(() => {
      setUploadStep('done');
    }, 6500);

    // Limpar os timeouts se o componente for desmontado
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Comunicar mudanças do uploadStep para o componente pai
  useEffect(() => {
    if (onUploadStepChange) {
      onUploadStepChange(uploadStep);
    }
  }, [uploadStep, onUploadStepChange]);


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
    <div className="h-full flex flex-col relative">
      {uploadStep === 'uploading' && <UploadModal />}
      {uploadStep === 'loading' && <LoadingIndicator />}
      
      {/* Canvas Area - Ocupa todo o espaço disponível */}
      <Card className="flex-1 p-6 min-h-0">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Decoration Canvas</h3>
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
              decorations={decorations}
              startGeneration={uploadStep === 'done'}
              selectedImage={selectedImage}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
