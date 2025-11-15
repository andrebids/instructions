/**
 * Componente de controles do canvas
 */
import React from 'react';
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

/**
 * Controles do canvas (botões de ação)
 * @param {Object} props
 * @param {boolean} props.isDayMode - Se está em modo dia
 * @param {Function} props.onToggleDayNight - Callback para alternar dia/noite
 * @param {boolean} props.canToggleDayNight - Se pode alternar dia/noite
 * @param {Function} props.onOpenCartouche - Callback para abrir modal de cartouche
 * @param {boolean} props.canOpenCartouche - Se pode abrir cartouche
 * @param {Function} props.onClearAll - Callback para limpar tudo
 * @param {boolean} props.canClearAll - Se pode limpar tudo
 * @param {Function} props.onOpenDecorations - Callback para abrir drawer de decorações (mobile)
 * @param {boolean} props.shouldUseDrawer - Se deve usar drawer (mobile)
 */
export const CanvasControls = ({
  isDayMode,
  onToggleDayNight,
  canToggleDayNight,
  onOpenCartouche,
  canOpenCartouche,
  onClearAll,
  canClearAll,
  onOpenDecorations,
  shouldUseDrawer = false
}) => {
  return (
    <div className="flex items-center justify-between mb-3 md:mb-4">
      <h3 className="text-base md:text-lg font-semibold text-center flex-1">Decoration Canvas</h3>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="flat"
          color={isDayMode ? "warning" : "primary"}
          startContent={
            <Icon 
              icon={isDayMode ? "lucide:sun" : "lucide:moon"} 
              className={isDayMode ? "text-warning" : "text-primary"}
            />
          }
          onPress={onToggleDayNight}
          isDisabled={!canToggleDayNight}
          aria-label={isDayMode ? "Switch to night mode" : "Switch to day mode"}
        >
          {isDayMode ? 'Day' : 'Night'}
        </Button>
        <Button
          size="sm"
          variant="flat"
          color="default"
          startContent={<Icon icon="lucide:map-pin" className="text-default-500" />}
          onPress={onOpenCartouche}
          isDisabled={!canOpenCartouche}
          title={!canOpenCartouche ? "Select an image first" : undefined}
          aria-label="Open cartouche information"
        >
          Cartouche
        </Button>
        <Button
          size="sm"
          variant="light"
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={onClearAll}
          isDisabled={!canClearAll}
          aria-label="Clear all decorations and images"
        >
          Clear All
        </Button>
        {/* Botão para abrir drawer de decorações (apenas em mobile/tablet) */}
        {shouldUseDrawer && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Icon icon="lucide:package" />}
            onPress={onOpenDecorations}
            aria-label="Open decorations library"
          >
            Decorations
          </Button>
        )}
      </div>
    </div>
  );
};

