import React, { useState, useMemo } from 'react';
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
  
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
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
      <div className="p-3 md:p-4 border-b border-divider text-center">
        <h3 className="text-base md:text-lg font-semibold">Decorations</h3>
      </div>
      
      {/* Search Bar */}
      {enableSearch && (
        <SearchBar 
          value={searchTerm}
          onChange={handleSearchChange}
        />
      )}
      
      {/* Category Menu */}
      <CategoryMenu
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />
      
      {/* Decorations Grid */}
      <div className="flex-1 overflow-y-auto">
        <DecorationGrid 
          decorations={finalDecorations}
          isLoading={isLoading}
          onSelect={onDecorationSelect}
        />
      </div>
    </aside>
    // TODO: Close DndContext when installed
    // </DndContext>
  );
};
