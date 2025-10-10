import React, { useRef, useEffect, useState } from "react";
import { Card, Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";

// Componente Konva Canvas (simulado até instalação das dependências)
const KonvaCanvas = ({ width, height, onDecorationAdd, decorations = [] }) => {
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

  return (
    <div className="relative h-full w-full">
      {/* Canvas placeholder - será substituído por Konva real */}
      <div 
        ref={canvasRef}
        className="border-2 border-dashed border-default-300 rounded-lg bg-default-50 h-full w-full"
        style={{ 
          width: width === "100%" ? "100%" : width,
          height: height === "100%" ? "100%" : height
        }}
      >
        <div className="flex items-center justify-center h-full">
          {isLoading ? (
            <div className="text-center">
              <Spinner size="lg" />
              <p className="mt-4 text-default-600">A gerar decorações com IA...</p>
            </div>
          ) : decorations.length > 0 ? (
            <div className="text-center">
              <Icon icon="lucide:check-circle" className="text-success text-4xl mb-2" />
              <p className="text-success font-medium">{decorations.length} decorações geradas</p>
            </div>
          ) : (
            <div className="text-center">
              <Icon icon="lucide:sparkles" className="text-primary text-4xl mb-2" />
              <p className="text-default-600 mb-4">Canvas pronto para decorações</p>
              <Button 
                color="primary" 
                startContent={<Icon icon="lucide:wand-2" />}
                onPress={handleGenerateDecorations}
              >
                Gerar Decorações com IA
              </Button>
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

export const StepAIDesigner = ({ formData, onInputChange }) => {
  const [decorations, setDecorations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
  }, [decorations, onInputChange]);

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Area - Ocupa todo o espaço disponível */}
      <Card className="flex-1 p-6 min-h-0">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Canvas de Decoração</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="light"
                startContent={<Icon icon="lucide:refresh-cw" />}
                onPress={() => setDecorations([])}
                isDisabled={decorations.length === 0}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                color="primary"
                startContent={<Icon icon="lucide:download" />}
                isDisabled={decorations.length === 0}
              >
                Exportar
              </Button>
            </div>
          </div>
          
          <div className="flex-1 min-h-0">
            <KonvaCanvas
              width="100%"
              height="100%"
              onDecorationAdd={handleDecorationAdd}
              decorations={decorations}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
