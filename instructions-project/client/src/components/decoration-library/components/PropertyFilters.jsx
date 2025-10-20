import React, { useState } from 'react';
import { Input, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export const PropertyFilters = ({ 
  onFiltersChange,
  className = "",
  disabled = false 
}) => {
  const [textContent, setTextContent] = useState('T');
  const [height, setHeight] = useState(10);
  const [dimension, setDimension] = useState('2d'); // '2d', 'grid', '3d'

  const handleTextContentChange = (value) => {
    setTextContent(value);
    onFiltersChange?.({ textContent: value, height, dimension });
  };

  const handleHeightChange = (value) => {
    setHeight(value);
    onFiltersChange?.({ textContent, height: value, dimension });
  };

  const handleDimensionChange = (value) => {
    setDimension(value);
    onFiltersChange?.({ textContent, height, dimension: value });
  };

  const dimensionOptions = [
    { value: '2d', icon: 'lucide:square', label: '2D' },
    { value: 'grid', icon: 'lucide:grid-3x3', label: 'Grid' },
    { value: '3d', icon: 'lucide:box', label: '3D' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Text Content */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            Text Content
          </label>
          <Icon 
            icon="lucide:info" 
            className="text-default-400 text-sm" 
          />
        </div>
        <Input
          value={textContent}
          onValueChange={handleTextContentChange}
          placeholder="Enter text..."
          size="sm"
          variant="bordered"
          className="max-w-xs"
          disabled={disabled}
        />
      </div>

      {/* Height Slider */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            Height
          </label>
          <Icon 
            icon="lucide:info" 
            className="text-default-400 text-sm" 
          />
        </div>
        <div className="flex items-center gap-3 max-w-xs">
          <span className="text-xs text-default-500 min-w-[20px]">0</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="0"
              max="10"
              value={height}
              onChange={(e) => handleHeightChange(parseInt(e.target.value))}
              className="w-full h-2 bg-default-200 rounded-lg appearance-none cursor-pointer slider"
              disabled={disabled}
              style={{
                background: `linear-gradient(to right, hsl(var(--heroui-primary)) 0%, hsl(var(--heroui-primary)) ${(height / 10) * 100}%, hsl(var(--default-200)) ${(height / 10) * 100}%, hsl(var(--default-200)) 100%)`
              }}
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: hsl(var(--heroui-primary));
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .slider::-moz-range-thumb {
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: hsl(var(--heroui-primary));
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}</style>
          </div>
          <span className="text-xs text-default-500 min-w-[20px]">10</span>
        </div>
        <div className="text-xs text-default-400 text-center">
          Current: {height}
        </div>
      </div>

      {/* Dimension */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            Dimension
          </label>
          <Icon 
            icon="lucide:info" 
            className="text-default-400 text-sm" 
          />
        </div>
        <div className="flex bg-default-100 rounded-lg p-1 max-w-xs">
          {dimensionOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={dimension === option.value ? "solid" : "light"}
              color={dimension === option.value ? "primary" : "default"}
              onPress={() => handleDimensionChange(option.value)}
              className="flex-1 min-w-0"
              disabled={disabled}
              isIconOnly
            >
              <Icon icon={option.icon} className="text-sm" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
