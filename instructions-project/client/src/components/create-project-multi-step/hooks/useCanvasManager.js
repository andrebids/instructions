import { useState, useCallback, useRef, useEffect } from "react";
import { logger } from "../utils/logger";

// 🧪 Breakpoint de Teste 4
export const TEST_BREAKPOINT_4 = true;

export const useCanvasManager = () => {
  const [availableDecorations, setAvailableDecorations] = useState([]);
  const [selectedDecorations, setSelectedDecorations] = useState([]); // Canvas 1
  const [positionedDecorations, setPositionedDecorations] = useState([]); // Canvas 2
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const stageRef = useRef(null);
  
  // Log canvas state changes
  useEffect(() => {
    if (TEST_BREAKPOINT_4) {
      console.log("🧪 TEST 4: Canvas state", {
        availableCount: availableDecorations.length,
        selectedCount: selectedDecorations.length,
        positionedCount: positionedDecorations.length,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < canvasHistory.length - 1
      });
    }
  }, [availableDecorations, selectedDecorations, positionedDecorations]);

  // ✅ CORRIGIDO: Carregar decorações com fallback para mock
  const loadDecorations = useCallback(async () => {
    try {
      logger.canvas('Loading decorations from API');
      
      // TODO: Substituir por API real quando disponível
      // const response = await decorationsAPI?.getAll?.();
      
      // Fallback para mock data
      const mockDecorations = [
        {
          id: 1,
          name: "Christmas Tree",
          imageUrl: "/decorations/tree.png",
          thumbnailUrl: "/decorations/tree-thumb.png",
          category: "Christmas"
        },
        {
          id: 2,
          name: "Santa Claus",
          imageUrl: "/decorations/santa.png",
          thumbnailUrl: "/decorations/santa-thumb.png",
          category: "Christmas"
        },
        {
          id: 3,
          name: "Snowman",
          imageUrl: "/decorations/snowman.png",
          thumbnailUrl: "/decorations/snowman-thumb.png",
          category: "Winter"
        }
      ];
      setAvailableDecorations(mockDecorations);
      logger.warn('useCanvasManager', 'Using mock decorations - API not available');
    } catch (err) {
      logger.error('useCanvasManager.loadDecorations', err);
      setAvailableDecorations([]); // Fallback vazio
    }
  }, []);

  // Canvas 1: Adicionar decoração à seleção
  const addDecorationToSelection = useCallback((decoration) => {
    const newDecoration = {
      id: `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      decorationId: decoration.id,
      name: decoration.name,
      imageUrl: decoration.imageUrl,
      thumbnailUrl: decoration.thumbnailUrl,
      category: decoration.category,
    };
    
    setSelectedDecorations(prev => [...prev, newDecoration]);
    logger.canvas('Add Decoration', { name: decoration.name, id: decoration.id });
  }, []);

  // Canvas 1: Remover decoração da seleção
  const removeDecorationFromSelection = useCallback((decorationId) => {
    setSelectedDecorations(prev => prev.filter(d => d.id !== decorationId));
    logger.canvas('Remove Decoration', { id: decorationId });
  }, []);

  // Histórico: Salvar estado (movido para antes de ser usado)
  const saveToHistory = useCallback((state) => {
    setCanvasHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state)));
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // ✅ CORRIGIDO: Canvas 2: Inicializar decorações com validação
  const initializePositions = useCallback(() => {
    if (selectedDecorations.length === 0) {
      logger.warn('useCanvasManager', 'No decorations selected to initialize positions');
      return;
    }
    
    const positioned = selectedDecorations.map((dec, index) => ({
      ...dec,
      x: 100 + (index % 3) * 200, // Grid layout
      y: 100 + Math.floor(index / 3) * 200,
      width: 150,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    }));
    
    setPositionedDecorations(positioned);
    saveToHistory(positioned);
    
    logger.canvas('Initialize Positions', {
      count: positioned.length,
      decorations: positioned.map(d => d.name)
    });
  }, [selectedDecorations, saveToHistory]);

  // Canvas 2: Atualizar posição/transformação de decoração
  const updateDecorationTransform = useCallback((decorationId, newAttrs) => {
    setPositionedDecorations(prev => {
      const updated = prev.map(d => 
        d.id === decorationId ? { ...d, ...newAttrs } : d
      );
      saveToHistory(updated);
      return updated;
    });
  }, [saveToHistory]);

  // Canvas 2: Deletar decoração posicionada
  const deletePositionedDecoration = useCallback((decorationId) => {
    setPositionedDecorations(prev => {
      const updated = prev.filter(d => d.id !== decorationId);
      saveToHistory(updated);
      return updated;
    });
    setSelectedItemId(null);
  }, [saveToHistory]);

  // Histórico: Undo
  const undo = useCallback(() => {
    logger.canvas('Undo', { historyIndex, canUndo: historyIndex > 0 });
    
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPositionedDecorations(JSON.parse(JSON.stringify(canvasHistory[newIndex])));
    } else {
      logger.warn('useCanvasManager', 'Cannot undo - at beginning of history');
    }
  }, [historyIndex, canvasHistory]);

  // Histórico: Redo
  const redo = useCallback(() => {
    logger.canvas('Redo', { 
      historyIndex, 
      canRedo: historyIndex < canvasHistory.length - 1 
    });
    
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPositionedDecorations(JSON.parse(JSON.stringify(canvasHistory[newIndex])));
    } else {
      logger.warn('useCanvasManager', 'Cannot redo - at end of history');
    }
  }, [historyIndex, canvasHistory]);

  // Exportar dados do canvas para formData
  const exportCanvasData = useCallback(() => {
    return {
      canvasSelection: selectedDecorations.map(d => ({
        id: d.id,
        decorationId: d.decorationId,
        name: d.name,
      })),
      canvasPositioning: positionedDecorations.map(d => ({
        id: d.id,
        decorationId: d.decorationId,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        rotation: d.rotation,
        scaleX: d.scaleX,
        scaleY: d.scaleY,
      })),
    };
  }, [selectedDecorations, positionedDecorations]);

  return {
    // Estado
    availableDecorations,
    selectedDecorations,
    positionedDecorations,
    selectedItemId,
    setSelectedItemId,
    stageRef,
    
    // Canvas 1 - Selection
    loadDecorations,
    addDecorationToSelection,
    removeDecorationFromSelection,
    
    // Canvas 2 - Positioning
    initializePositions,
    updateDecorationTransform,
    deletePositionedDecoration,
    
    // Histórico
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < canvasHistory.length - 1,
    
    // Export
    exportCanvasData,
  };
};

