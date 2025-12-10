import React from "react";
import { Card, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

/**
 * Componente de ações em massa para escolha de renderização
 * Layout compacto para otimizar espaço em tablets
 */
export function RenderBulkActions({ uploadedImages = [], onApplyToAll }) {
  const { t } = useTranslation();
  const imageCount = uploadedImages.length;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-5xl mx-auto">
        {/* Opção A: Renderização via IA */}
        <Card
          className="relative p-3 border border-default-200 hover:border-warning-300 transition-all cursor-pointer bg-content1"
          isPressable
          onPress={() => onApplyToAll?.('ai')}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center">
              <Icon icon="lucide:zap" className="text-xl text-warning-600" />
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-semibold text-foreground">
                {t('pages.createProject.renderDefinition.bulkActions.ai')}
              </h4>
              <p className="text-xs text-default-500 truncate">
                {t('pages.createProject.renderDefinition.bulkActions.aiDesc')}
              </p>
            </div>

            <Button
              color="warning"
              variant="flat"
              size="sm"
              className="px-2 min-w-16 h-8 text-xs font-medium"
              onPress={() => onApplyToAll?.('ai')}
            >
              {t('pages.createProject.renderDefinition.bulkActions.applyToAll')}
            </Button>
          </div>
        </Card>

        {/* Opção B: Designer Profissional */}
        <Card
          className="relative p-3 border border-default-200 hover:border-pink-300 transition-all cursor-pointer bg-content1"
          isPressable
          onPress={() => onApplyToAll?.('designer')}
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
              <Icon icon="lucide:palette" className="text-xl text-pink-600" />
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-semibold text-foreground">
                {t('pages.createProject.renderDefinition.bulkActions.designer')}
              </h4>
              <p className="text-xs text-default-500 truncate">
                {t('pages.createProject.renderDefinition.bulkActions.designerDesc')}
              </p>
            </div>

            <Button
              color="secondary"
              variant="flat"
              size="sm"
              className="px-2 min-w-16 h-8 text-xs font-medium"
              onPress={() => onApplyToAll?.('designer')}
            >
              {t('pages.createProject.renderDefinition.bulkActions.applyToAll')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

