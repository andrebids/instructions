import React, { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import { ImageRenderItem } from "./ImageRenderItem";
import { generateAllThumbnails } from "../../utils/canvasThumbnail";
import { useTranslation } from "react-i18next";

/**
 * Lista de imagens com thumbnails e toggles para escolha de renderização
 * Layout em Grid para tablets
 */
export function ImageRenderList({
  uploadedImages = [],
  canvasImages = [],
  decorationsByImage = {},
  renderByImage = {},
  onRenderChange
}) {
  const { t } = useTranslation();
  const [thumbnails, setThumbnails] = useState({});
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState(true);
  const hasGeneratedRef = useRef(false);

  // Criar chave única para detectar mudanças significativas
  const dataKey = useMemo(() => {
    const imageIds = uploadedImages.map(img => img.id).join(',');
    const canvasIds = canvasImages.map(img => img.id).join(',');
    const decorationKeys = Object.keys(decorationsByImage).sort().join(',');
    return `${imageIds}|${canvasIds}|${decorationKeys}`;
  }, [uploadedImages, canvasImages, decorationsByImage]);

  // Gerar thumbnails quando componente monta ou dados mudam significativamente
  useEffect(() => {
    if (uploadedImages.length === 0) {
      setIsLoadingThumbnails(false);
      return;
    }

    // Evitar gerar múltiplas vezes para os mesmos dados
    const currentDataKey = dataKey;
    if (hasGeneratedRef.current === currentDataKey) {
      return;
    }

    setIsLoadingThumbnails(true);
    hasGeneratedRef.current = currentDataKey;

    generateAllThumbnails({
      uploadedImages,
      canvasImages,
      decorationsByImage
    })
      .then((generatedThumbnails) => {
        // Verificar se os dados ainda são os mesmos antes de atualizar
        if (hasGeneratedRef.current === currentDataKey) {
          setThumbnails(generatedThumbnails);
          setIsLoadingThumbnails(false);
        }
      })
      .catch((error) => {
        console.error('❌ Erro ao gerar thumbnails:', error);
        if (hasGeneratedRef.current === currentDataKey) {
          setIsLoadingThumbnails(false);
        }
      });
  }, [dataKey, uploadedImages, canvasImages, decorationsByImage]);

  return (
    <div className="pb-24"> {/* Padding bottom para não esconder atrás do sticky footer */}
      {isLoadingThumbnails ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Icon icon="lucide:loader-2" className="text-3xl text-default-400 animate-spin mx-auto" />
            <p className="text-sm text-default-500">{t('common.loading')}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uploadedImages.map((image) => (
            <ImageRenderItem
              key={image.id}
              image={image}
              thumbnail={thumbnails[image.id]}
              selectedRender={renderByImage[image.id] || null}
              onRenderChange={onRenderChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

