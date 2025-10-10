import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
// TODO: Quando dnd-kit estiver instalado, adicionar:
// import { DndContext } from '@dnd-kit/core';
import { useDecorations } from './hooks/useDecorations';
import { useDecorationSearch } from './hooks/useDecorationSearch';
import { SearchBar } from './components/SearchBar';
import { CategoryMenu } from './components/CategoryMenu';
import { DecorationGrid } from './components/DecorationGrid';

export const DecorationLibrary = ({ 
  onDecorationSelect, 
  mode = "sidebar",
  className = "",
  enableSearch = true,
  initialCategory = null
}) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'decorations'
  
  // Load decorations data
  const { decorations, categories, isLoading, filterByCategory } = useDecorations();
  
  // Search hook
  const { searchTerm, setSearchTerm, filteredDecorations: searchResults } = useDecorationSearch(decorations);
  
  // Combine filters: category + search
  const finalDecorations = useMemo(() => {
    let result = decorations;
    
    // Apply category filter
    if (activeCategory) {
      result = filterByCategory(activeCategory);
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
    
    return result;
  }, [decorations, activeCategory, searchTerm, searchResults, filterByCategory]);
  
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
    <aside className={containerClasses}>
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
            >
              <Icon icon="lucide:arrow-left" className="text-lg" />
            </button>
          )}
        </div>
      </div>
      
      {/* Search Bar - always visible */}
      {enableSearch && (
        <SearchBar 
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={viewMode === 'categories' ? "Search all decorations..." : "Search by name or ref..."}
        />
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
            decorations={finalDecorations}
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
