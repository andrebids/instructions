/**
 * Drawer de decorações para mobile/tablet
 */
import React from 'react';
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { DecorationLibrary } from "../../decoration-library";
import { getDecorationColor } from '../utils/decorationUtils';
import { getCenterPosition } from '../utils/canvasCalculations';

/**
 * Drawer de decorações
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o drawer está aberto
 * @param {Function} props.onClose - Callback para fechar o drawer
 * @param {boolean} props.isDayMode - Se está em modo dia
 * @param {boolean} props.disabled - Se está desabilitado
 * @param {Function} props.onDecorationSelect - Callback quando decoração é selecionada
 * @param {Function} props.onRequireBackground - Callback quando precisa de imagem de fundo
 */
export const DecorationDrawer = ({
  isOpen,
  onClose,
  isDayMode,
  disabled,
  onDecorationSelect,
  onRequireBackground
}) => {
  const handleDecorationSelect = (decoration) => {
    // Verificar se há imagem de fundo antes de adicionar decoração
    if (disabled) {
      console.warn('⚠️ Please add a background image first!');
      if (onRequireBackground) {
        onRequireBackground();
      }
      return;
    }
    
    // Usar dimensões virtuais do canvas (sempre 1200x600)
    const { centerX, centerY } = getCenterPosition(1200, 600);
    
    // Criar nova decoração para o canvas na posição central
    const newDecoration = {
      id: 'dec-' + Date.now(),
      decorationId: decoration.id, // ID da decoração na base de dados (para orders)
      type: decoration.imageUrl ? 'image' : decoration.type,
      name: decoration.name,
      icon: decoration.icon,
      price: decoration.price || 0, // Preço para orders
      // Guardar URLs para alternância futura
      dayUrl: decoration.imageUrlDay || decoration.thumbnailUrl || decoration.imageUrl || undefined,
      nightUrl: decoration.imageUrlNight || undefined,
      src: decoration.imageUrl || undefined,
      x: centerX,
      y: centerY,
      width: decoration.imageUrl ? 200 : 120,
      height: decoration.imageUrl ? 200 : 120,
      rotation: 0,
      color: getDecorationColor(decoration.type)
    };
    onDecorationSelect(newDecoration);
  };

  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={
          'fixed top-0 right-0 h-full w-80 md:w-96 bg-content1 border-l border-divider z-50 transform transition-transform duration-300 ease-in-out ' +
          (isOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <div className="h-full flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-divider flex items-center justify-between">
            <h3 className="text-lg font-semibold">Decorations</h3>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={onClose}
              aria-label="Close drawer"
            >
              <Icon icon="lucide:x" />
            </Button>
          </div>
          
          {/* Drawer Content */}
          <div className="flex-1 overflow-hidden">
            <DecorationLibrary
              mode="drawer"
              isDayMode={isDayMode}
              disabled={disabled}
              onDecorationSelect={handleDecorationSelect}
              enableSearch={true}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </>
  );
};
