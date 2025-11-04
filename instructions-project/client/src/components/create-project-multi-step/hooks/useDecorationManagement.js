import { useState } from 'react';

/**
 * Hook para gerenciar decorações por imagem
 * Mantém mapeamento de decorações por imagem selecionada
 * 
 * @param {Object} params
 * @param {Object | null} params.selectedImage - Imagem selecionada atual
 * @returns {Object} - Estados e funções de gestão de decorações
 */
export const useDecorationManagement = ({ selectedImage }) => {
  const [decorationsByImage, setDecorationsByImage] = useState({});

  /**
   * Adicionar decoração ao canvas e ao mapeamento da imagem
   * @param {Object} decoration - Decoração a adicionar
   * @param {Array} decorations - Array atual de decorações
   * @param {Function} setDecorations - Setter do estado de decorações
   */
  const handleDecorationAdd = (decoration, decorations, setDecorations) => {
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

  /**
   * Remover decoração do canvas e do mapeamento
   * @param {number|string} decorationId - ID da decoração a remover
   * @param {Array} decorations - Array atual de decorações
   * @param {Function} setDecorations - Setter do estado de decorações
   */
  const handleDecorationRemove = (decorationId, decorations, setDecorations) => {
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

  /**
   * Atualizar decoração (transformações, movimentos)
   * @param {number|string} decorationId - ID da decoração a atualizar
   * @param {Object} newAttrs - Novos atributos da decoração
   * @param {Array} decorations - Array atual de decorações
   * @param {Function} setDecorations - Setter do estado de decorações
   */
  const handleDecorationUpdate = (decorationId, newAttrs, decorations, setDecorations) => {
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

  /**
   * Carregar decorações de uma imagem específica
   * @param {string} imageId - ID da imagem
   * @returns {Array} - Array de decorações da imagem
   */
  const loadDecorationsForImage = (imageId) => {
    return decorationsByImage[imageId] || [];
  };

  /**
   * Salvar decorações de uma imagem específica
   * @param {string} imageId - ID da imagem
   * @param {Array} decorations - Array de decorações a salvar
   */
  const saveDecorationsForImage = (imageId, decorations) => {
    setDecorationsByImage(prev => ({
      ...prev,
      [imageId]: decorations
    }));
  };

  return {
    decorationsByImage,
    setDecorationsByImage,
    handleDecorationAdd,
    handleDecorationRemove,
    handleDecorationUpdate,
    loadDecorationsForImage,
    saveDecorationsForImage
  };
};

