import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export const CategoryMenu = ({ categories, onCategorySelect }) => {
  console.log('📋 [CategoryMenu] Rendering', categories.length, 'categories');
  const baseApi = (import.meta?.env?.VITE_API_URL || '').replace(/\/$/, '') || '';
  const resolveSrc = function(path){
    if (!path) return '';
    if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0 || path.indexOf('data:') === 0) return path;
    if (path.indexOf('/uploads/') === 0 && baseApi) return baseApi + path;
    return path;
  };

  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => {
              console.log('📂 [CategoryMenu] Selecting category:', category.name);
              onCategorySelect(category.id);
            }}
            className="p-4 border border-divider rounded-lg cursor-pointer hover:border-primary/50 transition-all duration-200 bg-background hover:bg-default-50 active:scale-95"
          >
            <div className="text-center">
              {/* Thumbnail da categoria (preferir versão Night), sem fundo cinza */}
              <div className="w-full h-24 rounded-md overflow-hidden mb-2">
                {(category.thumbnailNight || category.thumbnail) ? (
                  <img
                    src={resolveSrc(category.thumbnailNight || category.thumbnail)}
                    alt={category.name + ' thumbnail'}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-default-400">{category.icon || '🖼️'}</div>
                )}
              </div>
              <div className="text-3xl mb-2 hidden">{category.icon}</div>
              <h3 className="text-sm font-semibold text-default-700 mb-1">
                {category.name}
              </h3>
              <p className="text-xs text-default-500">
                {category.count ? `${category.count} decoration${category.count !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
