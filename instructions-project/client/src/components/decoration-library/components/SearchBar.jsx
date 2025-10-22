import React from 'react';
import { Input, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';

export const SearchBar = ({ value, onChange, placeholder = "Search all decorations...", disabled = false }) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="p-3 border-b border-divider">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-foreground">
          Search
        </label>
        <Tooltip
          content={
            <div className="space-y-2">
              <div>
                <div className="font-medium">Filename Search:</div>
                <div className="text-sm">Find images by their reference name</div>
              </div>
              <div>
                <div className="font-medium">AI Search:</div>
                <div className="text-sm">Use natural language to find images based on their visual content</div>
              </div>
            </div>
          }
          placement="top"
          showArrow
        >
          <Icon 
            icon="lucide:info" 
            className="text-default-400 text-sm cursor-help" 
          />
        </Tooltip>
      </div>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        startContent={<Icon icon="lucide:search" className="text-default-400" />}
        endContent={value && !disabled && (
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
        disabled={disabled}
        classNames={{
          input: "text-sm",
          inputWrapper: "bg-default-50"
        }}
        aria-label="Search decorations by name, reference or visual content"
      />
    </div>
  );
};
