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
 * @param {boolean} props.isTouchDevice - Se está em dispositivo touch
 */
export const DecorationItem = ({ 
  decoration, 
  isSelected, 
  onSelect, 
  onChange,
  snapZones = [],
  isDayMode = true,
  isTouchDevice = false
}) => {
  const [image] = useImage(decoration.src, 'anonymous');
  const shapeRef = useRef();
  const trRef = useRef();
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

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

  // Handlers melhorados para touch
  const handleTouchStart = (e) => {
    if (!isTouchDevice) return;
    
    // Prevenir scroll durante interação
    e.evt.preventDefault();
    
    // Guardar posição inicial do toque
    const touch = e.evt.touches[0] || e.evt.changedTouches[0];
    if (touch) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      touchStartPos.current = { x: point.x, y: point.y };
      isDragging.current = false;
    }
    
    // Selecionar a decoração
    onSelect();
  };

  const handleTouchMove = (e) => {
    if (!isTouchDevice) return;
    
    // Prevenir scroll durante drag
    e.evt.preventDefault();
    
    // Verificar se está arrastando (movimento > 5px)
    const touch = e.evt.touches[0];
    if (touch && touchStartPos.current) {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      const dx = Math.abs(point.x - touchStartPos.current.x);
      const dy = Math.abs(point.y - touchStartPos.current.y);
      
      if (dx > 5 || dy > 5) {
        isDragging.current = true;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (!isTouchDevice) return;
    
    // Prevenir comportamentos padrão
    e.evt.preventDefault();
    
    // Se não estava arrastando, foi apenas um tap (seleção)
    if (!isDragging.current) {
      onSelect();
    }
    
    // Resetar estado
    isDragging.current = false;
    touchStartPos.current = { x: 0, y: 0 };
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragStart={(e) => {
            // Prevenir scroll em touch durante drag
            if (isTouchDevice && e.evt) {
              e.evt.preventDefault();
            }
            // Garantir seleção quando inicia drag
            onSelect();
          }}
          onDragMove={(e) => {
            // Prevenir scroll durante drag em touch
            if (isTouchDevice && e.evt) {
              e.evt.preventDefault();
            }
            handleDragMove(e);
          }}
          onDragEnd={(e) => {
            // Prevenir comportamentos padrão em touch
            if (isTouchDevice && e.evt) {
              e.evt.preventDefault();
            }
            handleDragEnd(e);
          }}
          onTransformEnd={handleTransformEnd}
        />
        {isSelected && (
          <Transformer
            ref={trRef}
            keepRatio={true}
            flipEnabled={false}
            // Configurações otimizadas para touch
            anchorSize={isTouchDevice ? 12 : 8}
            anchorStrokeWidth={isTouchDevice ? 2 : 1}
            borderEnabled={true}
            borderStrokeWidth={isTouchDevice ? 2 : 1}
            rotateEnabled={true}
            resizeEnabled={true}
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

