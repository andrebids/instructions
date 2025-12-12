import React from "react";
import { productsAPI } from "../../../../../services/api";

// Hook para gerenciar modificação de produtos
export const useProductModification = ({
  currentLogo,
  logoDetails,
  savedLogos,
  onInputChange,
  formik,
  handleUpdate,
}) => {
  // Estados para modificação de logo e pesquisa de produtos
  const [productSearchValue, setProductSearchValue] = React.useState("");
  const [productSearchResults, setProductSearchResults] = React.useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = React.useState(false);
  const [relatedProducts, setRelatedProducts] = React.useState([]);
  const [productSizes, setProductSizes] = React.useState([]);
  const [selectedRelatedProductId, setSelectedRelatedProductId] = React.useState(null);
  const productSearchTimeoutRef = React.useRef(null);
  const hasGeneratedRelatedProductsRef = React.useRef(new Map());
  const lastProcessedProductIdRef = React.useRef(null);

  // Função para buscar produtos do Stock Catalogue com debounce
  const searchProducts = React.useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setProductSearchResults([]);
      return;
    }

    setIsSearchingProducts(true);
    try {
      const results = await productsAPI.search(query.trim());
      setProductSearchResults(results || []);
    } catch (error) {
      console.error('Error searching products:', error);
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  }, []);

  // Debounce da pesquisa de produtos
  React.useEffect(() => {
    if (productSearchTimeoutRef.current) {
      clearTimeout(productSearchTimeoutRef.current);
    }

    if (productSearchValue && productSearchValue.trim().length >= 2) {
      productSearchTimeoutRef.current = setTimeout(() => {
        searchProducts(productSearchValue);
      }, 300);
    } else {
      setProductSearchResults([]);
    }

    return () => {
      if (productSearchTimeoutRef.current) {
        clearTimeout(productSearchTimeoutRef.current);
      }
    };
  }, [productSearchValue, searchProducts]);

  // Handler para seleção de produto
  const handleProductSelection = (productId) => {
    const selectedProduct = productSearchResults.find(p => p.id === productId);
    if (selectedProduct) {
      // Criar 3 produtos relacionados fictícios com tamanhos diferentes
      // Usar as dimensões do produto base como referência
      const baseHeight = parseFloat(selectedProduct.height) || 0;
      const baseWidth = parseFloat(selectedProduct.width) || 0;
      const baseDepth = parseFloat(selectedProduct.depth) || 0;
      const baseDiameter = parseFloat(selectedProduct.diameter) || 0;

      const demoRelatedProducts = [
        {
          id: `${selectedProduct.id}-size-1`,
          name: selectedProduct.name,
          size: "1.5m",
          height: baseHeight ? (baseHeight * 1.5).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 1.5).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 1.5).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 1.5).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
        {
          id: `${selectedProduct.id}-size-2`,
          name: selectedProduct.name,
          size: "2.0m",
          height: baseHeight ? (baseHeight * 2.0).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 2.0).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 2.0).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 2.0).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
        {
          id: `${selectedProduct.id}-size-3`,
          name: selectedProduct.name,
          size: "2.5m",
          height: baseHeight ? (baseHeight * 2.5).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 2.5).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 2.5).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 2.5).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
      ];

      // Atualizar currentLogo com o produto selecionado
      const updatedCurrentLogo = {
        ...currentLogo,
        isModification: true,
        baseProductId: selectedProduct.id,
        baseProduct: selectedProduct,
        relatedProducts: demoRelatedProducts,
        productSizes: [], // Não usado mais, tamanhos estão nos produtos relacionados
      };
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos,
      };
      onInputChange("logoDetails", updatedLogoDetails);

      // Atualizar estados locais
      setRelatedProducts(demoRelatedProducts);
      setProductSizes([]);

      // Marcar que produtos relacionados foram gerados para este produto
      if (hasGeneratedRelatedProductsRef.current) {
        hasGeneratedRelatedProductsRef.current.set(selectedProduct.id, true);
      }

      // Limpar campo de pesquisa
      setProductSearchValue("");
      setProductSearchResults([]);
    }
  };

  // Handler para limpar seleção de produto
  const handleClearProductSelection = () => {
    const updatedCurrentLogo = {
      ...currentLogo,
      baseProductId: null,
      baseProduct: null,
      relatedProducts: [],
      productSizes: [],
      selectedRelatedProductId: null,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);
    setProductSearchValue("");
    setProductSearchResults([]);
    setRelatedProducts([]);
    setProductSizes([]);
    setSelectedRelatedProductId(null);
    // Resetar o ref de produtos gerados para este produto
    if (currentLogo.baseProductId && hasGeneratedRelatedProductsRef.current) {
      hasGeneratedRelatedProductsRef.current.delete(currentLogo.baseProductId);
    }
  };

  // Handler para selecionar um produto relacionado
  const handleSelectRelatedProduct = (product) => {
    // Extrair dimensões do produto
    const height = product.height || product.specs?.dimensions?.heightM || product.specs?.height;
    const width = product.width || product.specs?.dimensions?.widthM || product.specs?.width;
    const depth = product.depth || product.specs?.dimensions?.depthM || product.specs?.depth;
    const diameter = product.diameter || product.specs?.dimensions?.diameterM || product.specs?.diameter;
    const length = product.length || product.specs?.dimensions?.lengthM || product.specs?.length;

    // Atualizar estado de seleção
    setSelectedRelatedProductId(product.id);

    // Salvar o ID do produto selecionado no currentLogo
    const updatedCurrentLogo = {
      ...currentLogo,
      selectedRelatedProductId: product.id,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);

    // Atualizar dimensões do logo com as dimensões do produto selecionado
    const updatedDimensions = {
      ...formik.values.dimensions,
    };

    if (height) {
      updatedDimensions.height = {
        ...updatedDimensions.height,
        value: parseFloat(height)
      };
    }
    if (width) {
      updatedDimensions.width = {
        ...updatedDimensions.width,
        value: parseFloat(width)
      };
    }
    // Depth mapeia para length (comprimento)
    if (depth) {
      updatedDimensions.length = {
        ...updatedDimensions.length,
        value: parseFloat(depth)
      };
    } else if (length) {
      // Se não tem depth mas tem length, usar length
      updatedDimensions.length = {
        ...updatedDimensions.length,
        value: parseFloat(length)
      };
    }
    if (diameter) {
      updatedDimensions.diameter = {
        ...updatedDimensions.diameter,
        value: parseFloat(diameter)
      };
    }

    // Atualizar dimensões no formik
    formik.setFieldValue("dimensions", updatedDimensions);
    handleUpdate("dimensions", updatedDimensions);
  };

  // Handler para mudança do switch de modificação
  const handleModificationToggle = (isModification) => {
    const updatedCurrentLogo = {
      ...currentLogo,
      isModification: isModification,
      baseProductId: isModification ? currentLogo.baseProductId : null,
      baseProduct: isModification ? currentLogo.baseProduct : null,
      relatedProducts: isModification ? (currentLogo.relatedProducts || []) : [],
      productSizes: isModification ? (currentLogo.productSizes || []) : [],
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);

    if (!isModification) {
      // Limpar pesquisa quando desativar
      setProductSearchValue("");
      setProductSearchResults([]);
      setRelatedProducts([]);
      setProductSizes([]);
    }
  };

  // Sincronizar estados locais com currentLogo quando produto é carregado
  // E gerar produtos relacionados de demo se necessário
  React.useEffect(() => {
    const currentProductId = currentLogo.baseProduct?.id;
    
    // Se não há produto base, limpar estados
    if (!currentProductId) {
      if (lastProcessedProductIdRef.current !== null) {
        setRelatedProducts([]);
        setProductSizes([]);
        setSelectedRelatedProductId(null);
        lastProcessedProductIdRef.current = null;
      }
      return;
    }

    // Se o produto não mudou, apenas sincronizar estados se necessário
    if (lastProcessedProductIdRef.current === currentProductId) {
      // Sincronizar estados locais com currentLogo
      if (currentLogo.relatedProducts && currentLogo.relatedProducts.length > 0) {
        setRelatedProducts(currentLogo.relatedProducts);
      }
      if (currentLogo.selectedRelatedProductId) {
        setSelectedRelatedProductId(currentLogo.selectedRelatedProductId);
      }
      if (currentLogo.productSizes) {
        setProductSizes(currentLogo.productSizes);
      }
      return;
    }

    // Produto mudou - processar novo produto
    lastProcessedProductIdRef.current = currentProductId;
    const hasGenerated = hasGeneratedRelatedProductsRef.current.get(currentProductId) || false;

    // Se já tem produtos relacionados, usar eles
    if (currentLogo.relatedProducts && currentLogo.relatedProducts.length > 0) {
      setRelatedProducts(currentLogo.relatedProducts);
      // Restaurar seleção se houver um produto relacionado selecionado
      if (currentLogo.selectedRelatedProductId) {
        setSelectedRelatedProductId(currentLogo.selectedRelatedProductId);
      }
      hasGeneratedRelatedProductsRef.current.set(currentProductId, true);
      setProductSizes(currentLogo.productSizes || []);
    } else if (!hasGenerated) {
      // Se não tem produtos relacionados mas tem produto base, gerar demo apenas uma vez por produto
      const selectedProduct = currentLogo.baseProduct;
      // Usar as dimensões do produto base como referência
      const baseHeight = parseFloat(selectedProduct.height) || 0;
      const baseWidth = parseFloat(selectedProduct.width) || 0;
      const baseDepth = parseFloat(selectedProduct.depth) || 0;
      const baseDiameter = parseFloat(selectedProduct.diameter) || 0;

      const demoRelatedProducts = [
        {
          id: `${selectedProduct.id}-size-1`,
          name: selectedProduct.name,
          size: "1.5m",
          height: baseHeight ? (baseHeight * 1.5).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 1.5).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 1.5).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 1.5).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
        {
          id: `${selectedProduct.id}-size-2`,
          name: selectedProduct.name,
          size: "2.0m",
          height: baseHeight ? (baseHeight * 2.0).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 2.0).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 2.0).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 2.0).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
        {
          id: `${selectedProduct.id}-size-3`,
          name: selectedProduct.name,
          size: "2.5m",
          height: baseHeight ? (baseHeight * 2.5).toFixed(2) : null,
          width: baseWidth ? (baseWidth * 2.5).toFixed(2) : null,
          depth: baseDepth ? (baseDepth * 2.5).toFixed(2) : null,
          diameter: baseDiameter ? (baseDiameter * 2.5).toFixed(2) : null,
          imageUrl: (() => {
            const url = selectedProduct.thumbnailUrl || selectedProduct.imagesDayUrl || selectedProduct.imagesNightUrl;
            // Filtrar URLs temporárias (não existem no servidor)
            if (url && (url.includes('thumb_temp_') || url.includes('temp_dayImage_') || url.includes('temp_nightImage_'))) {
              return null;
            }
            return url;
          })(),
          baseProductId: selectedProduct.id,
        },
      ];
      setRelatedProducts(demoRelatedProducts);
      hasGeneratedRelatedProductsRef.current.set(currentProductId, true);
      setProductSizes(currentLogo.productSizes || []);

      // Atualizar currentLogo com os produtos relacionados gerados
      const updatedCurrentLogo = {
        ...currentLogo,
        relatedProducts: demoRelatedProducts,
      };
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos,
      };
      onInputChange("logoDetails", updatedLogoDetails);
    } else {
      setProductSizes(currentLogo.productSizes || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogo.baseProduct?.id]);

  return {
    productSearchValue,
    setProductSearchValue,
    productSearchResults,
    isSearchingProducts,
    relatedProducts,
    productSizes,
    selectedRelatedProductId,
    handleProductSelection,
    handleClearProductSelection,
    handleSelectRelatedProduct,
    handleModificationToggle,
  };
};

