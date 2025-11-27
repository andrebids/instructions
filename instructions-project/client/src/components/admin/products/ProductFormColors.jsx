/**
 * ProductFormColors Component
 * LED color selection
 */

import React from 'react';
import { getColorHex } from '../../../utils/products';

export function ProductFormColors({ availableColors, selectedColors, onAddColor, onRemoveColor }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">LED Colors:</label>
      <div className="flex flex-wrap gap-3 p-4 border border-default-200 rounded-lg bg-default-50">
        {Object.keys(availableColors).length === 0 ? (
          <p className="text-sm text-default-500">No colors available in database</p>
        ) : (
          Object.keys(availableColors).map((colorName) => {
            const colorValue = availableColors[colorName];
            const isHex = colorValue && typeof colorValue === 'string' && colorValue.indexOf('#') === 0;
            const isGradient = colorValue && typeof colorValue === 'string' && colorValue.indexOf('linear-gradient') === 0;
            const isSelected = selectedColors.hasOwnProperty(colorName);
            const displayColor = isHex || isGradient ? colorValue : getColorHex(colorName);

            return (
              <button
                key={colorName}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onRemoveColor(colorName);
                  } else {
                    onAddColor(colorName);
                  }
                }}
                title={colorName}
                className={
                  isSelected
                    ? 'w-10 h-10 rounded-full border-4 border-primary-500 shadow-md hover:scale-110 transition-transform cursor-pointer overflow-hidden'
                    : 'w-10 h-10 rounded-full border-2 border-default-300 hover:border-primary-400 hover:scale-110 transition-transform cursor-pointer overflow-hidden'
                }
                style={isGradient ? { background: displayColor } : { backgroundColor: displayColor }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
