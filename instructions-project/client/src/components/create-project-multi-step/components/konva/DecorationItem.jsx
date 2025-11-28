import React, { useRef, useEffect } from "react";
import { Image as KonvaImage, Transformer, Rect } from 'react-konva';
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
  // Obter URL da imagem baseado no modo (dia/noite) ou usar src
  // Tentar várias fontes de URL
  const rawImageUrl = decoration.src || 
                      (isDayMode ? decoration.dayUrl : decoration.nightUrl) || 
                      decoration.dayUrl || 
                      decoration.nightUrl ||
                      decoration.imageUrl ||
                      decoration.thumbnailUrl;
  
  // Mapear caminho da imagem (mesma lógica do URLImage)
  const mapImagePath = (path) => {
    if (!path) return path;
    // Se já é URL completa (http/https), usar diretamente
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
    
    // Se tem baseApi configurado, usar ele para caminhos que começam com /uploads/ ou /SHOP/
    if (baseApi) {
      if (path.indexOf('/uploads/') === 0 || path.indexOf('/SHOP/') === 0) {
        return baseApi + path;
      }
    }
    
    // Sem baseApi: converter /uploads/ ou /SHOP/ para /api/... para passar pelo proxy
    if (path.indexOf('/uploads/') === 0) {
      return '/api' + path;
    }
    if (path.indexOf('/SHOP/') === 0) {
      return '/api' + path;
    }
    
    return path;
  };
  
  const imageUrl = mapImagePath(rawImageUrl);
  // Só tentar carregar a imagem se tivermos uma URL válida
  const [image, imageStatus] = useImage(imageUrl && imageUrl !== '' ? imageUrl : null, 'anonymous');
  
  // Log para debug
  useEffect(() => {
    if (!rawImageUrl) {
      console.warn('⚠️ [DecorationItem] Sem URL de imagem:', {
        id: decoration.id,
        name: decoration.name,
        type: decoration.type,
        decoration: {
          src: decoration.src,
          dayUrl: decoration.dayUrl,
          nightUrl: decoration.nightUrl,
          imageUrl: decoration.imageUrl,
          thumbnailUrl: decoration.thumbnailUrl
        },
        isDayMode
      });
    } else {
      if (imageUrl !== rawImageUrl) {
        console.log('🔄 [DecorationItem] Caminho mapeado:', {
          id: decoration.id,
          name: decoration.name,
          original: rawImageUrl,
          mapped: imageUrl
        });
      }
      
      // useImage retorna status como objeto ou string
      if (imageStatus && typeof imageStatus === 'object' && imageStatus.error) {
        console.error('❌ [DecorationItem] Erro ao carregar imagem:', {
          id: decoration.id,
          name: decoration.name,
          imageUrl,
          error: imageStatus.error,
          decoration: {
            src: decoration.src,
            dayUrl: decoration.dayUrl,
            nightUrl: decoration.nightUrl,
            imageUrl: decoration.imageUrl
          }
        });
      } else if (image) {
        console.log('✅ [DecorationItem] Imagem carregada:', {
          id: decoration.id,
          name: decoration.name,
          imageUrl,
          imageWidth: image.width,
          imageHeight: image.height
        });
      }
    }
  }, [imageStatus, image, decoration.id, decoration.name, decoration.type, imageUrl, rawImageUrl, decoration.src, decoration.dayUrl, decoration.nightUrl, decoration.imageUrl, decoration.thumbnailUrl, isDayMode]);
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
    
    // Prevenir scroll durante interação (se o evento permitir)
    try {
      if (e.evt && e.evt.cancelable !== false) {
        e.evt.preventDefault();
      }
    } catch (err) {
      // Ignorar se preventDefault não for permitido (evento passivo)
    }
    
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
    
    // Prevenir scroll durante drag (se o evento permitir)
    try {
      if (e.evt && e.evt.cancelable !== false) {
        e.evt.preventDefault();
      }
    } catch (err) {
      // Ignorar se preventDefault não for permitido (evento passivo)
    }
    
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
    
    // Prevenir comportamentos padrão (se o evento permitir)
    try {
      if (e.evt && e.evt.cancelable !== false) {
        e.evt.preventDefault();
      }
    } catch (err) {
      // Ignorar se preventDefault não for permitido (evento passivo)
    }
    
    // Se não estava arrastando, foi apenas um tap (seleção)
    if (!isDragging.current) {
      onSelect();
    }
    
    // Resetar estado
    isDragging.current = false;
    touchStartPos.current = { x: 0, y: 0 };
  };

  // Renderizar apenas decorações tipo imagem (PNG)
  // Verificar se há URL de imagem disponível
  if (decoration.type === 'image' && imageUrl) {
    // Handlers comuns para ambos os casos
    const commonHandlers = {
      draggable: true,
      onClick: onSelect,
      onTap: onSelect,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onDragStart: (e) => {
        if (isTouchDevice && e.evt) {
          try {
            if (e.evt.cancelable !== false) {
              e.evt.preventDefault();
            }
          } catch (err) {
            // Ignorar se preventDefault não for permitido (evento passivo)
          }
        }
        onSelect();
      },
      onDragMove: (e) => {
        if (isTouchDevice && e.evt) {
          try {
            if (e.evt.cancelable !== false) {
              e.evt.preventDefault();
            }
          } catch (err) {
            // Ignorar se preventDefault não for permitido (evento passivo)
          }
        }
        handleDragMove(e);
      },
      onDragEnd: (e) => {
        if (isTouchDevice && e.evt) {
          try {
            if (e.evt.cancelable !== false) {
              e.evt.preventDefault();
            }
          } catch (err) {
            // Ignorar se preventDefault não for permitido (evento passivo)
          }
        }
        handleDragEnd(e);
      },
      onTransformEnd: handleTransformEnd,
    };

    const commonProps = {
      ref: shapeRef,
      x: decoration.x,
      y: decoration.y,
      width: decoration.width,
      height: decoration.height,
      offsetX: decoration.width / 2,
      offsetY: decoration.height / 2,
      rotation: decoration.rotation || 0,
      ...commonHandlers
    };

    return (
      <>
        {/* Renderizar imagem quando carregada, senão renderizar placeholder */}
        {image ? (
          <KonvaImage
            {...commonProps}
            image={image}
          />
        ) : (
          <Rect
            {...commonProps}
            fill="#888888"
            opacity={0.3}
            stroke="#666666"
            strokeWidth={1}
          />
        )}
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

