import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export const CategoryMenu = ({ categories, onCategorySelect }) => {
  console.log('📋 [CategoryMenu] Rendering', categories.length, 'categories');

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
              <div className="text-3xl mb-2">{category.icon}</div>
              <h3 className="text-sm font-semibold text-default-700 mb-1">
                {category.name}
              </h3>
              <p className="text-xs text-default-500">
                {category.count} decoration{category.count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
