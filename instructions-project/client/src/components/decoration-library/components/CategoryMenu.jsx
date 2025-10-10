import React from 'react';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export const CategoryMenu = ({ categories, activeCategory, onCategoryChange }) => {

  return (
    <div className="p-3 border-b border-divider">
      <h4 className="text-xs md:text-sm font-medium text-default-600 mb-3">Categories</h4>
      <div className="space-y-1">
        {/* All button */}
        <Button
          variant={!activeCategory ? "solid" : "light"}
          color={!activeCategory ? "primary" : "default"}
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            console.log('🏠 [CategoryMenu] Selecting: All');
            onCategoryChange(null);
          }}
          startContent={<Icon icon="lucide:home" />}
        >
          <span className="text-xs">All</span>
        </Button>

        {/* Categories list */}
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "solid" : "light"}
            color={activeCategory === category.id ? "primary" : "default"}
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              console.log('📂 [CategoryMenu] Selecting category:', category.name);
              onCategoryChange(category.id);
            }}
            startContent={<span className="text-sm">{category.icon}</span>}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs">{category.name}</span>
              <span className="text-xs opacity-60">({category.count})</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
