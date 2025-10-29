import React, { useState } from 'react';
import { Input, Button, Tooltip, Slider } from '@heroui/react';
import { Icon } from '@iconify/react';

export const PropertyFilters = ({ 
  onFiltersChange,
  className = "",
  disabled = false 
}) => {
  const [height, setHeight] = useState(10);
  const [dimension, setDimension] = useState('all'); // 'all', '2d', '3d'

  const handleHeightChange = (value) => {
    setHeight(value);
    onFiltersChange?.({ height: value, dimension });
  };

  const handleDimensionChange = (value) => {
    setDimension(value);
    onFiltersChange?.({ height, dimension: value });
  };

  const dimensionOptions = [
    { value: 'all', icon: 'lucide:layers', label: 'All' },
    { value: '2d', icon: 'lucide:square', label: '2D' },
    { value: '3d', icon: 'lucide:box', label: '3D' }
  ];

  return (
    <div className={`space-y-4 ${className}`}>

      {/* Height Slider */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">
            Height
          </label>
          <Tooltip
            content="Adjust decoration height (0 = minimum, 10 = maximum)"
            placement="top"
            showArrow
          >
            <Icon 
              icon="lucide:info" 
              className="text-default-400 text-sm cursor-help" 
            />
          </Tooltip>
        </div>
        <div className="max-w-xs">
          {/* HeroUI Slider - fallback to custom if not available */}
          {typeof Slider !== 'undefined' ? (
            <Slider
              className="max-w-md"
              defaultValue={10}
              maxValue={10}
              minValue={0}
              step={1}
              value={height}
              onChange={(value) => handleHeightChange(Array.isArray(value) ? value[0] : value)}
              isDisabled={disabled}
              showSteps={true}
              showTooltip={true}
              color="primary"
              size="sm"
            />
          ) : (
            /* Custom Slider Fallback */
            <div className="space-y-2">
              <div className="relative h-3 bg-default-300 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${(height / 10) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={height}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                  disabled={disabled}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                />
                <div 
                  className="absolute top-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-primary transform -translate-y-1/2 transition-all duration-200 ease-out"
                  style={{ left: `calc(${(height / 10) * 100}% - 12px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
          )}
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
          {dimensionOptions.map((option) => {
            const getTooltipContent = () => {
              switch (option.value) {
                case 'all':
                  return 'Show all decorations (2D and 3D)';
                case '2d':
                  return 'Filter only 2D decorations (transversal and pole)';
                case '3d':
                  return 'Filter only 3D decorations (3D and custom)';
                default:
                  return option.label;
              }
            };

            return (
              <Tooltip
                key={option.value}
                content={getTooltipContent()}
                placement="top"
                showArrow
              >
                <Button
                  size="sm"
                  variant={dimension === option.value ? "solid" : "light"}
                  color={dimension === option.value ? "primary" : "default"}
                  onPress={() => handleDimensionChange(option.value)}
                  className="flex-1 min-w-0"
                  disabled={disabled}
                  isIconOnly={option.value !== 'all'}
                  aria-label={option.value !== 'all' ? option.label : undefined}
                >
                  {option.value === 'all' ? (
                    <span className="text-xs font-medium">{option.label}</span>
                  ) : (
                    <Icon icon={option.icon} className="text-sm" />
                  )}
                </Button>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};
