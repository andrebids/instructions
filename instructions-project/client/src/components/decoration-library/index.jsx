import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
// TODO: Quando dnd-kit estiver instalado, adicionar:
// import { DndContext } from '@dnd-kit/core';
import { useDecorations } from './hooks/useDecorations';
import { useDecorationSearch } from './hooks/useDecorationSearch';
import { SearchBar } from './components/SearchBar';
import { CategoryMenu } from './components/CategoryMenu';
import { DecorationGrid } from './components/DecorationGrid';
import { PropertyFilters } from './components/PropertyFilters';

export const DecorationLibrary = ({ 
  onDecorationSelect, 
  mode = "sidebar",
  className = "",
  enableSearch = true,
  enableFilters = true,
  initialCategory = null,
  disabled = false,
  isDayMode = true
}) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'decorations'
  const [filters, setFilters] = useState({
    height: 10,
    dimension: 'all'
  });
  
  // Load decorations data
  const { decorations, categories, isLoading, filterByCategory } = useDecorations();
  
  // Search hook
  const { searchTerm, setSearchTerm, filteredDecorations: searchResults } = useDecorationSearch(decorations);
  
  // Combine filters: category + search + property filters
  const finalDecorations = useMemo(() => {
    let result = decorations;
    
    // Apply category filter
    if (activeCategory) {
      const filtered = filterByCategory(activeCategory);
      console.log('[LIB] filter category', activeCategory, '->', filtered.length);
      result = filtered;
    }
    
    // Apply search filter if active
    if (searchTerm && searchResults.length > 0) {
      // If search is active, use only search results
      // but limit to selected category
      if (activeCategory) {
        result = searchResults.filter(dec => dec.category === activeCategory);
      } else {
        result = searchResults;
      }
    }
    
    // Apply property filters
    if (enableFilters) {
      result = result.filter(decoration => {
        // Filter by dimension type (2D vs 3D)
        if (filters.dimension !== 'all') {
          if (filters.dimension === '2d') {
            // Filter for 2D decorations (transversal and pole categories)
            if (!['transversal', 'pole'].includes(decoration.category)) return false;
          } else if (filters.dimension === '3d') {
            // Filter for 3D decorations (3d and custom categories)
            if (!['3d', 'custom'].includes(decoration.category)) return false;
          }
        }
        
        return true;
      });
    }
    
    return result;
  }, [decorations, activeCategory, searchTerm, searchResults, filterByCategory, filters, enableFilters]);
  
  const handleCategorySelect = (categoryId) => {
    console.log('📂 [DecorationLibrary] Selecting category:', categoryId);
    setActiveCategory(categoryId);
    setViewMode('decorations');
  };

  const handleBackToCategories = () => {
    console.log('🔙 [DecorationLibrary] Going back to categories');
    setViewMode('categories');
    setActiveCategory(null);
    setSearchTerm(''); // Clear search when going back
  };
  
  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };
  
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // TODO: Quando dnd-kit estiver instalado, adicionar:
  // const handleDragEnd = (event) => {
  //   console.log('🎯 [DecorationLibrary] Drag ended:', event.active.data);
  //   if (event.over && onDecorationSelect) {
  //     onDecorationSelect(event.active.data.current);
  //   }
  // };
  
  const containerClasses = mode === "sidebar" 
    ? `border-l border-divider bg-content1/30 flex flex-col flex-shrink-0 ${className}`
    : `bg-content1 rounded-lg border border-divider ${className}`;
  
  return (
    // TODO: Quando dnd-kit estiver instalado, adicionar DndContext:
    // <DndContext onDragEnd={handleDragEnd}>
    <aside className={`${containerClasses} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-divider">
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-semibold">
            {viewMode === 'categories' && !searchTerm ? 'Categories' : 'Decorations'}
          </h3>
          {(viewMode === 'decorations' || searchTerm) && (
            <button
              onClick={handleBackToCategories}
              className="text-default-500 hover:text-default-700 transition-colors"
              title="Back to categories"
              disabled={disabled}
            >
              <Icon icon="lucide:arrow-left" className="text-lg" />
            </button>
          )}
        </div>
        {disabled && (
          <p className="text-xs text-warning mt-2">
            ⚠️ Select a background image first
          </p>
        )}
      </div>
      
      {/* Search Bar - always visible */}
      {enableSearch && (
        <SearchBar 
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={viewMode === 'categories' ? "Search all decorations..." : "Search by name or ref..."}
          disabled={disabled}
        />
      )}
      
      {/* Property Filters - visible when in decorations view */}
      {enableFilters && (viewMode === 'decorations' || searchTerm) && (
        <div className="p-3 md:p-4 border-b border-divider">
          <PropertyFilters
            onFiltersChange={handleFiltersChange}
            disabled={disabled}
          />
        </div>
      )}
      
      {/* Content based on view mode and search */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'categories' && !searchTerm ? (
          <CategoryMenu
            categories={categories}
            onCategorySelect={handleCategorySelect}
          />
        ) : (
          <DecorationGrid 
            decorations={finalDecorations.map(function(d){
              // Resolver a URL exibida conforme o modo, mas manter ambas
              var resolved = Object.assign({}, d);
              resolved.imageUrl = isDayMode ? (d.imageUrlDay || d.thumbnailUrl) : (d.imageUrlNight || d.imageUrlDay || d.thumbnailUrl);
              return resolved;
            })}
            isLoading={isLoading}
            onSelect={onDecorationSelect}
          />
        )}
      </div>
    </aside>
    // TODO: Close DndContext when installed
    // </DndContext>
  );
};
