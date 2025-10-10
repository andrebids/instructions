import React from 'react';
import { Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { DecorationItem } from './DecorationItem';

export const DecorationGrid = ({ decorations, isLoading, onSelect }) => {

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Spinner size="md" />
        <p className="mt-2 text-sm text-default-500">Loading decorations...</p>
      </div>
    );
  }

  if (decorations.length === 0) {
    return (
      <div className="p-8 text-center">
        <Icon icon="lucide:package-x" className="text-4xl text-default-400 mx-auto mb-3" />
        <p className="text-default-500 text-sm">No decorations found</p>
        <p className="text-default-400 text-xs mt-1">
          Try a different category or search term
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-default-500">
          {decorations.length} decoration{decorations.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-1.5 md:gap-2">
        {decorations.map((decoration) => (
          <DecorationItem 
            key={decoration.id} 
            decoration={decoration}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};
