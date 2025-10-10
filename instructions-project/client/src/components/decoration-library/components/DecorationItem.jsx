import React from 'react';
// Note: @dnd-kit will be used when dependencies are installed
// For now, using HTML5 drag-and-drop for compatibility
import { Icon } from '@iconify/react';

export const DecorationItem = ({ decoration, onSelect }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(decoration));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(decoration);
    }
  };

  // TODO: When dnd-kit is installed, replace with:
  // const { attributes, listeners, setNodeRef, transform } = useDraggable({
  //   id: decoration.id,
  //   data: decoration
  // });

  return (
    <div
      className="relative p-2 md:p-3 border border-divider rounded-lg cursor-pointer hover:border-primary/50 transition-all duration-200 bg-background hover:bg-default-50 active:scale-95"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      title={`Click to add ${decoration.name} (${decoration.ref})`}
    >
      <div className="text-center pointer-events-none">
        {/* Mostrar imagem PNG se disponível, caso contrário mostrar ícone */}
        {decoration.imageUrl ? (
          <div className="w-full h-12 md:h-16 mb-1 flex items-center justify-center">
            <img
              src={decoration.imageUrl}
              alt={decoration.name}
              className="max-w-full max-h-full object-contain select-none"
              style={{ backgroundColor: 'transparent' }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-xl md:text-2xl mb-1 select-none">{decoration.icon}</div>
        )}
        
        <p className="text-[10px] md:text-xs text-default-600 truncate font-medium">
          {decoration.name}
        </p>
        <p className="text-[9px] text-default-400 truncate">
          {decoration.ref}
        </p>
      </div>
      
      {/* Drag indicator */}
      <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <Icon icon="lucide:grip-vertical" className="text-xs text-default-400" />
      </div>
    </div>
  );
};
