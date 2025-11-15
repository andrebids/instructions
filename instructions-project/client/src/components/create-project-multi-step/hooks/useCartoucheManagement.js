/**
 * Hook para gerenciar cartouche por imagem
 */
import { useEffect } from 'react';
import { getDefaultStreetName, getCartoucheForImage as getCartoucheUtil } from '../utils/cartoucheUtils';

/**
 * Hook para gerenciar cartouche
 * @param {Object} params
 * @param {Object} params.formData - Dados do formulário
 * @param {Function} params.onInputChange - Callback para atualizar formData
 * @param {Array} params.uploadedImages - Imagens uploadadas
 * @returns {Object} - Funções e dados do cartouche
 */
export function useCartoucheManagement({ formData, onInputChange, uploadedImages }) {
  // Inicializar valores padrão para todas as imagens quando são carregadas
  useEffect(() => {
    if (uploadedImages.length > 0) {
      const currentCartoucheByImage = formData?.cartoucheByImage || {};
      let needsUpdate = false;
      const updatedCartoucheByImage = { ...currentCartoucheByImage };

      uploadedImages.forEach((image, index) => {
        // Se não existe entrada para esta imagem, criar com valores padrão
        if (!updatedCartoucheByImage[image.id]) {
          const defaultStreetName = getDefaultStreetName(index);
          updatedCartoucheByImage[image.id] = {
            streetOrZone: defaultStreetName,
            option: "base"
          };
          needsUpdate = true;
        }
      });

      // Atualizar apenas se houver mudanças
      if (needsUpdate) {
        onInputChange?.('cartoucheByImage', updatedCartoucheByImage);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedImages.map(img => img.id).join(',')]); // Executar quando IDs das imagens mudarem

  /**
   * Obtém dados do cartouche para uma imagem
   */
  const getCartoucheForImage = (imageId) => {
    return getCartoucheUtil(formData?.cartoucheByImage, imageId, uploadedImages);
  };

  /**
   * Atualiza dados do cartouche para uma imagem
   */
  const updateCartoucheForImage = (imageId, updates) => {
    const currentCartoucheByImage = formData?.cartoucheByImage || {};
    const current = currentCartoucheByImage[imageId] || getCartoucheForImage(imageId);
    
    const updatedCartoucheByImage = {
      ...currentCartoucheByImage,
      [imageId]: { ...current, ...updates }
    };
    
    onInputChange?.('cartoucheByImage', updatedCartoucheByImage);
  };

  /**
   * Obtém nome padrão do projeto
   */
  const getDefaultProjectName = () => {
    return formData?.projectName || "Mairie du Soleil";
  };

  /**
   * Atualiza nome do projeto
   */
  const handleProjectNameChange = (value) => {
    onInputChange?.('projectName', value);
  };

  /**
   * Aplica cartouche ao canvas
   */
  const applyCartouche = (canvasImages, selectedImage, setCanvasImages, setIsLocationModalOpen) => {
    if (canvasImages.length === 0 || !selectedImage) {
      console.warn('⚠️ Não há imagem de fundo no canvas ou imagem selecionada');
      return;
    }

    const cartouchePath = '/cartouches/CARTOUCHEpaysage.png';
    
    // Encontrar a imagem de fundo no canvas (primeira imagem que não é cartouche)
    const backgroundImage = canvasImages.find(img => !img.isCartouche);
    
    if (!backgroundImage) {
      console.warn('⚠️ Não foi possível encontrar a imagem de fundo');
      return;
    }
    
    // Usar as mesmas dimensões e posição da imagem de fundo para o cartouche
    const cartoucheImage = {
      id: `cartouche-${Date.now()}`,
      type: 'image',
      name: 'Cartouche',
      src: cartouchePath,
      x: backgroundImage.x,
      y: backgroundImage.y,
      width: backgroundImage.width,
      height: backgroundImage.height,
      isCartouche: true
    };

    // Remover cartouches anteriores (se houver) e adicionar o novo
    const filteredImages = canvasImages.filter(img => !img.isCartouche);
    setCanvasImages([...filteredImages, cartoucheImage]);
    
    // Salvar que o cartouche foi aplicado para esta imagem
    const currentCartoucheByImage = formData?.cartoucheByImage || {};
    const updatedCartoucheByImage = {
      ...currentCartoucheByImage,
      [selectedImage.id]: {
        ...getCartoucheForImage(selectedImage.id),
        hasCartouche: true
      }
    };
    onInputChange?.('cartoucheByImage', updatedCartoucheByImage);
    
    console.log('✅ Cartouche aplicado ao canvas e salvo para imagem:', selectedImage.id, {
      width: backgroundImage.width,
      height: backgroundImage.height,
      x: backgroundImage.x,
      y: backgroundImage.y
    });
    
    // Fechar o modal após aplicar
    setIsLocationModalOpen(false);
  };

  return {
    getCartoucheForImage,
    updateCartoucheForImage,
    getDefaultProjectName,
    handleProjectNameChange,
    applyCartouche
  };
}

