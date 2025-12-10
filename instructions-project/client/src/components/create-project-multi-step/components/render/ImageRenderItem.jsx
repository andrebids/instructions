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
    <Card className="w-full bg-content1 border border-default-200 shadow-sm hover:shadow-md transition-all">
      <CardBody className="p-3">
        <div className="flex items-center gap-3">
          {/* Thumbnail Compacto */}
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-default-100 border border-default-200">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={image.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div className="w-full h-full hidden items-center justify-center bg-default-100">
              <Icon icon="lucide:image" className="text-xl text-default-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between h-16 py-1">
            {/* Nome do ficheiro */}
            <p className="text-sm font-medium text-foreground truncate" title={image.name}>
              {image.name}
            </p>

            {/* Controls Integrados */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-2 bg-default-50 rounded-full px-2 py-1 border border-default-100">
                <Switch
                  isSelected={isDesigner}
                  onValueChange={(checked) => {
                    onRenderChange(image.id, checked ? 'designer' : 'ai');
                  }}
                  color="secondary"
                  size="sm"
                  classNames={{
                    wrapper: isDesigner ? 'bg-pink-500' : 'bg-warning-500',
                  }}
                  thumbIcon={({ isSelected, className }) => 
                    isSelected ? (
                      <Icon icon="lucide:palette" className={className} />
                    ) : (
                      <Icon icon="lucide:zap" className={className} />
                    )
                  }
                />
                <span className={`text-xs font-semibold ${isDesigner ? 'text-pink-600' : isAI ? 'text-warning-600' : 'text-default-400'}`}>
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

