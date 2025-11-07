import React, { useRef, useEffect } from "react";
import { Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { useImageAspectRatio } from '../../hooks/useImageAspectRatio';
import { checkSnapToZone } from '../../utils/snapZoneUtils';

/**
 * Componente para Decorações individuais com Transformer
 * Suporta drag, transform, snap to zones
 * 
 * @param {Object} props
 * @param {Object} props.decoration - Objeto de decoração
 * @param {boolean} props.isSelected - Se está selecionada
 * @param {Function} props.onSelect - Callback quando selecionada
 * @param {Function} props.onChange - Callback quando alterada
 * @param {Array} props.snapZones - Array de zonas de snap
 * @param {boolean} props.isDayMode - Se está em modo dia
 */
export const DecorationItem = ({ 
  decoration, 
  isSelected, 
  onSelect, 
  onChange,
  snapZones = [],
  isDayMode = true
}) => {
  const [image] = useImage(decoration.src, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();

  // ✅ CORREÇÃO DO LOOP INFINITO: Usar hook customizado
  useImageAspectRatio({
    image,
    decoration,
    onChange,
    shapeRef
  });

  useEffect(() => {
    if (isSelected) {
      // Attach transformer manualmente ao shape
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [isSelected]);

  const handleDragMove = function(e) {
    if (!snapZones || snapZones.length === 0) {
      return;
    }
    
    var node = shapeRef.current;
    if (!node) return;
    
    var currentX = node.x();
    var currentY = node.y();
    
    // Verificar snap durante movimento (funciona em ambos os modos)
    var snapped = checkSnapToZone(currentX, currentY, snapZones);
    
    if (snapped.snapped) {
      // Atualizar posição do node em tempo real
      node.position({
        x: snapped.x,
        y: snapped.y
      });
      node.getLayer().batchDraw();
    }
  };

  const handleDragEnd = (e) => {
    var node = shapeRef.current;
    if (!node) return;
    
    var finalX = node.x();
    var finalY = node.y();
    
    // Aplicar snap final antes de salvar (funciona em ambos os modos)
    if (snapZones && snapZones.length > 0) {
      var snapped = checkSnapToZone(finalX, finalY, snapZones);
      finalX = snapped.x;
      finalY = snapped.y;
      
      if (snapped.snapped) {
        node.position({ x: finalX, y: finalY });
        node.getLayer().batchDraw();
        console.log('🎯 Snap aplicado durante drag para zona mais próxima');
      }
    }
    
    console.log('🔄 Decoração movida:', decoration.id, 'nova posição:', finalX, finalY);
    onChange({
      ...decoration,
      x: finalX,
      y: finalY,
    });
  };

  const handleTransformEnd = (e) => {
    // Transformer está a mudar a scale do node, não width/height
    // No store temos apenas width/height
    // Por isso resetamos a scale após transform
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    console.log('🔧 Decoração transformada:', decoration.id, 'scale:', scaleX, scaleY, 'rotation:', node.rotation());
    
    // Resetar scale de volta para 1
    node.scaleX(1);
    node.scaleY(1);
    
    onChange({
      ...decoration,
      x: node.x(),
      y: node.y(),
      // Definir valor mínimo
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  // Renderizar apenas decorações tipo imagem (PNG)
  if (decoration.type === 'image' && decoration.src) {
    return (
      <>
        <KonvaImage
          ref={shapeRef}
          image={image}
          x={decoration.x}
          y={decoration.y}
          width={decoration.width}
          height={decoration.height}
          offsetX={decoration.width / 2}
          offsetY={decoration.height / 2}
          rotation={decoration.rotation || 0}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onTouchStart={(e) => {
            // Selecionar a decoração quando tocar nela
            // Não prevenir comportamento padrão para permitir drag
            onSelect();
          }}
          onDragStart={(e) => {
            // Garantir seleção quando inicia drag
            onSelect();
          }}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            keepRatio={true}
            flipEnabled={false}
            boundBoxFunc={(oldBox, newBox) => {
              // Limitar resize mínimo
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </>
    );
  }
  
  // Decorações coloridas (fallback) - não implementado nesta versão
  return null;
};

