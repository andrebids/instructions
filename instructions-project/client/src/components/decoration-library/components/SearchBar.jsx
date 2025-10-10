import React from 'react';
import { Input } from '@heroui/react';
import { Icon } from '@iconify/react';

export const SearchBar = ({ value, onChange, placeholder = "Type to search..." }) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="p-3 border-b border-divider">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        startContent={<Icon icon="lucide:search" className="text-default-400" />}
        endContent={value && (
          <button 
            onClick={handleClear}
            className="text-default-400 hover:text-default-600 transition-colors"
            aria-label="Clear search"
          >
            <Icon icon="lucide:x" />
          </button>
        )}
        variant="bordered"
        size="sm"
        classNames={{
          input: "text-sm",
          inputWrapper: "bg-default-50"
        }}
        aria-label="Search decorations by name or reference"
      />
    </div>
  );
};
