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

  return (
    <div className="mb-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Instant AI Option */}
        <Card
          isPressable
          onPress={() => onApplyToAll?.('ai')}
          className="group relative overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-warning-500/50 hover:bg-black/60 hover:shadow-[0_0_30px_-5px_rgba(245,165,36,0.2)]"
        >
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-warning-500/10 text-3xl text-warning-500 group-hover:scale-110 group-hover:bg-warning-500/20 transition-all duration-300">
              <Icon icon="lucide:zap" />
            </div>

            <div className="flex flex-1 flex-col text-left">
              <h4 className="text-lg font-bold text-white group-hover:text-warning-400 transition-colors">
                {t('pages.createProject.renderDefinition.bulkActions.ai')}
              </h4>
              <p className="mt-1 text-sm text-default-400 font-medium leading-relaxed">
                {t('pages.createProject.renderDefinition.bulkActions.aiDesc')}
              </p>
            </div>

            <Button
              className="bg-warning-500/10 text-warning-500 font-bold border border-warning-500/20 min-w-[100px] h-10 group-hover:bg-warning-500 group-hover:text-black transition-all"
              variant="flat"
              onPress={() => onApplyToAll?.('ai')}
            >
              {t('pages.createProject.renderDefinition.bulkActions.applyToAll')}
            </Button>
          </div>
        </Card>

        {/* Pro Designer Option */}
        <Card
          isPressable
          onPress={() => onApplyToAll?.('designer')}
          className="group relative overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md p-6 transition-all duration-300 hover:border-pink-500/50 hover:bg-black/60 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.2)]"
        >
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-3xl text-pink-500 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
              <Icon icon="lucide:palette" />
            </div>

            <div className="flex flex-1 flex-col text-left">
              <h4 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors">
                {t('pages.createProject.renderDefinition.bulkActions.designer')}
              </h4>
              <p className="mt-1 text-sm text-default-400 font-medium leading-relaxed">
                {t('pages.createProject.renderDefinition.bulkActions.designerDesc')}
              </p>
            </div>

            <Button
              className="bg-pink-500/10 text-pink-500 font-bold border border-pink-500/20 min-w-[100px] h-10 group-hover:bg-pink-500 group-hover:text-white transition-all"
              variant="flat"
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

