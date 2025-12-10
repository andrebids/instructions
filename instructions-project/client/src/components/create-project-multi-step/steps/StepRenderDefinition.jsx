import React, { useState, useCallback, useMemo } from "react";
import { Card, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { RenderBulkActions } from "../components/render/RenderBulkActions";
import { ImageRenderList } from "../components/render/ImageRenderList";
import { projectsAPI, ordersAPI } from "../../../services/api";

/**
 * Step de Definição de Renderização
 * Layout otimizado para tablets com sticky footer
 */
export function StepRenderDefinition({ formData, onInputChange, onNext, onBack }) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);

  const uploadedImages = formData?.uploadedImages || [];
  const canvasImages = formData?.canvasImages || [];
  const decorationsByImage = formData?.decorationsByImage || {};
  const renderByImage = formData?.renderByImage || {};
  const projectId = formData?.id || formData?.tempProjectId;

  // Calcular resumo
  const summary = useMemo(() => {
    const aiCount = uploadedImages.filter(img => renderByImage[img.id] === 'ai').length;
    const designerCount = uploadedImages.filter(img => renderByImage[img.id] === 'designer').length;
    const unassignedCount = uploadedImages.length - aiCount - designerCount;
    const canConfirm = unassignedCount === 0 && uploadedImages.length > 0;
    
    return { aiCount, designerCount, unassignedCount, canConfirm };
  }, [uploadedImages, renderByImage]);

  // Handler para aplicar renderização a todas as imagens
  const handleApplyToAll = useCallback((workflow) => {
    const newRenderByImage = {};
    uploadedImages.forEach(image => {
      newRenderByImage[image.id] = workflow;
    });
    onInputChange?.('renderByImage', newRenderByImage);
  }, [uploadedImages, onInputChange]);

  // Handler para mudança individual de renderização
  const handleRenderChange = useCallback((imageId, render) => {
    const currentRenderByImage = formData?.renderByImage || {};
    onInputChange?.('renderByImage', {
      ...currentRenderByImage,
      [imageId]: render
    });
  }, [formData?.renderByImage, onInputChange]);

  // Handler para confirmar e processar
  const handleConfirm = useCallback(async () => {
    if (!projectId) {
      console.error('❌ Cannot process: project ID is missing');
      return;
    }

    const currentRenderByImage = formData?.renderByImage || {};
    const unassignedImages = uploadedImages.filter(img => !currentRenderByImage[img.id]);
    
    if (unassignedImages.length > 0) {
      console.warn('⚠️ Some images do not have render method assigned');
      return;
    }

    setIsProcessing(true);

    try {
      // Salvar renderByImage no canvas
      const canvasData = {
        canvasDecorations: formData?.canvasDecorations || [],
        canvasImages: canvasImages,
        decorationsByImage: decorationsByImage,
        cartoucheByImage: formData?.cartoucheByImage || {},
        renderByImage: currentRenderByImage
      };

      await projectsAPI.updateCanvas(projectId, canvasData);

      // Processar cada imagem de acordo com seu método de renderização
      const aiImages = uploadedImages.filter(img => currentRenderByImage[img.id] === 'ai');
      const designerImages = uploadedImages.filter(img => currentRenderByImage[img.id] === 'designer');

      // Para imagens AI: sincronizar decorações com orders (se necessário)
      if (aiImages.length > 0 && formData?.canvasDecorations?.length > 0) {
        const decorationsToSync = formData.canvasDecorations
          .map(dec => ({
            decorationId: dec.decorationId || dec.id,
            name: dec.name || 'Decoração',
            imageUrl: dec.dayUrl || dec.nightUrl || dec.src || dec.imageUrl,
            price: dec.price || 0,
          }));

        if (decorationsToSync.length > 0) {
          await ordersAPI.syncDecorations(projectId, decorationsToSync);
        }
      }

      // Para imagens Designer: criar observações/requests para designers
      for (const image of designerImages) {
        const observationData = {
          content: 'Por favor, processe esta imagem com renderização profissional (transformação dia-para-noite e aplicação de efeitos realistas).',
          linkedResultImageId: image.id,
          attachments: []
        };
        await projectsAPI.addObservation(projectId, observationData);
      }

      console.log('✅ Renderização confirmada e processamento iniciado');
      
      // Navegar para o próximo step
      if (onNext) {
        onNext();
      }
      
    } catch (error) {
      console.error('❌ Error processing renderization:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    projectId,
    formData?.renderByImage,
    formData?.canvasDecorations,
    formData?.cartoucheByImage,
    uploadedImages,
    canvasImages,
    decorationsByImage,
    onNext
  ]);

  return (
    <div className="h-full flex flex-col bg-default-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-content1 px-6 py-4 border-b border-divider">
        <h2 className="text-xl font-bold mb-1">{t('pages.createProject.renderDefinition.title')}</h2>
        <p className="text-sm text-default-500">
          {t('pages.createProject.renderDefinition.subtitle')}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Bulk Actions */}
          {uploadedImages.length > 0 && (
            <RenderBulkActions
              uploadedImages={uploadedImages}
              onApplyToAll={handleApplyToAll}
            />
          )}

          {/* Lista de Imagens */}
          {uploadedImages.length > 0 ? (
            <ImageRenderList
              uploadedImages={uploadedImages}
              canvasImages={canvasImages}
              decorationsByImage={decorationsByImage}
              renderByImage={renderByImage}
              onRenderChange={handleRenderChange}
            />
          ) : (
            <Card className="p-12 bg-black/40 border border-white/10 backdrop-blur-md">
              <div className="text-center text-default-400">
                <Icon icon="lucide:image-off" className="text-6xl mx-auto mb-4 text-default-600" />
                <p className="text-xl font-bold text-white mb-2">Nenhuma imagem disponível para renderização.</p>
                <p className="text-base">Volte ao passo anterior para adicionar imagens.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky Footer com Resumo e Navegação */}
      <div className="w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          {/* Resumo Compacto - Mantido acima dos botões para contexto importante */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-4">
              {summary.aiCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Icon icon="lucide:zap" className="text-warning-500 text-base" />
                  <span className="text-default-600">
                    <span className="font-semibold">{summary.aiCount}</span> {t('pages.createProject.renderDefinition.summary.viaAI')}
                  </span>
                </div>
              )}
              {summary.designerCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Icon icon="lucide:palette" className="text-pink-500 text-base" />
                  <span className="text-default-600">
                    <span className="font-semibold">{summary.designerCount}</span> {t('pages.createProject.renderDefinition.summary.viaDesigner')}
                  </span>
                </div>
              )}
              {summary.unassignedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Icon icon="lucide:alert-circle" className="text-warning-500 text-base" />
                  <span className="text-warning-600">
                    <span className="font-semibold">{summary.unassignedCount}</span> {t('pages.createProject.renderDefinition.summary.unassigned')}
                  </span>
                </div>
              )}
            </div>
            <div className="text-default-500">
              {t('pages.createProject.renderDefinition.summary.total')}: <span className="font-semibold">{uploadedImages.length}</span> {t('pages.createProject.renderDefinition.summary.images')}
            </div>
          </div>

          {/* Botões de Navegação - Layout alinhado com NavigationFooter */}
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="flat"
              onPress={onBack}
              isDisabled={isProcessing}
              startContent={<Icon icon="lucide:arrow-left" />}
            >
              {t('common.back')}
            </Button>

            <Button
              color="primary"
              onPress={handleConfirm}
              isDisabled={!summary.canConfirm || isProcessing}
              isLoading={isProcessing}
              endContent={!isProcessing && <Icon icon="lucide:arrow-right" />}
              className="bg-blue-600 text-white"
            >
              {isProcessing
                ? t('pages.createProject.renderDefinition.summary.processing')
                : summary.canConfirm
                  ? t('common.continue') // Using generic 'Continue' or similar
                  : t('pages.createProject.renderDefinition.summary.selectRequired')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

