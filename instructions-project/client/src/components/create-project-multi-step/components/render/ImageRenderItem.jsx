import React from "react";
import { Card, CardBody, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

/**
 * Item individual da lista de renderização
 * Layout compacto otimizado para tablets
 */
export function ImageRenderItem({ image, thumbnail, selectedRender, onRenderChange }) {
  const { t } = useTranslation();
  const isAI = selectedRender === 'ai';
  const isDesigner = selectedRender === 'designer';

  return (
    <Card 
      className={`
        w-full transition-all duration-300 backdrop-blur-md border 
        ${isDesigner 
          ? 'bg-black/60 border-pink-500/50 shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)]' 
          : isAI 
            ? 'bg-black/60 border-warning-500/50 shadow-[0_0_20px_-5px_rgba(245,165,36,0.3)]'
            : 'bg-black/40 border-white/10 hover:bg-black/50 hover:border-white/20'
        }
      `}
    >
      <CardBody className="p-4">
        <div className="flex items-center gap-4">
          {/* Thumbnail Compacto */}
          <div className={`
            flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border transition-all duration-300 relative group
            ${isDesigner ? 'border-pink-500/50' : isAI ? 'border-warning-500/50' : 'border-white/10'}
          `}>
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={image.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div className={`w-full h-full ${!thumbnail ? 'flex' : 'hidden'} items-center justify-center bg-white/5`}>
              <Icon icon="lucide:image" className="text-2xl text-white/20" />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-0.5">
            {/* Nome do ficheiro */}
            <p className="text-base font-bold text-white truncate" title={image.name}>
              {image.name}
            </p>

            {/* Controls Integrados */}
            <div className="flex items-center justify-between mt-auto">
              <div className={`
                flex items-center gap-3 rounded-full px-3 py-1.5 border transition-all duration-300
                ${isDesigner 
                  ? 'bg-pink-500/10 border-pink-500/20' 
                  : isAI 
                    ? 'bg-warning-500/10 border-warning-500/20' 
                    : 'bg-white/5 border-white/10'}
              `}>
                <Switch
                  isSelected={isDesigner}
                  onValueChange={(checked) => {
                    onRenderChange(image.id, checked ? 'designer' : 'ai');
                  }}
                  color="secondary"
                  size="sm"
                  classNames={{
                     wrapper: isDesigner ? 'group-data-[selected=true]:bg-pink-500' : 'group-data-[selected=true]:bg-warning-500',
                  }}
                  thumbIcon={({ isSelected, className }) => 
                    isSelected ? (
                      <Icon icon="lucide:palette" className={className} />
                    ) : (
                      <Icon icon="lucide:zap" className={className} />
                    )
                  }
                />
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isDesigner ? 'text-pink-500' : isAI ? 'text-warning-500' : 'text-default-400'
                }`}>
                  {isDesigner 
                    ? t('pages.createProject.renderDefinition.bulkActions.designer') 
                    : isAI 
                      ? t('pages.createProject.renderDefinition.bulkActions.ai') 
                      : t('pages.createProject.renderDefinition.summary.unassigned')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

