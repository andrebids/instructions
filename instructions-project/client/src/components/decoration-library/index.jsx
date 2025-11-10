import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
// TODO: Quando dnd-kit estiver instalado, adicionar:
// import { DndContext } from '@dnd-kit/core';
import { useDecorations } from './hooks/useDecorations';
import { useDecorationSearch } from './hooks/useDecorationSearch';
import { SearchBar } from './components/SearchBar';
import { CategoryMenu } from './components/CategoryMenu';
import { DecorationGrid } from './components/DecorationGrid';
import { DecorationFiltersCompact } from './components/DecorationFiltersCompact';
import filterDecorations from './utils/filterDecorations';

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
    heightMin: 0,
    heightMax: 0,
    color: []
  });
  
  // Carregar dados (sem dependência de filtros)
  const { decorations, categories, isLoading, hasMore, setPage, filterByCategory } = useDecorations();
  
  // Search hook
  const { searchTerm, setSearchTerm, filteredDecorations: searchResults } = useDecorationSearch(decorations);
  
  // Filtragem client-side igual ao /shop/trending
  const finalDecorations = useMemo(() => {
    console.log('[LIB] Aplicando filtros', { filters, activeCategory, searchTerm, totalDecorations: decorations.length });
    var result = filterDecorations(decorations, filters, activeCategory, searchTerm);
    console.log('[LIB] Resultado filtrado', { count: result.length, colors: filters && filters.color });
    return result;
  }, [decorations, filters, activeCategory, searchTerm]);
  
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
    ? `border-l border-divider bg-content1/30 flex flex-col flex-shrink-0 h-full overflow-y-auto ${className}`
    : mode === "drawer"
    ? `bg-content1 flex flex-col h-full overflow-y-auto ${className}`
    : `bg-content1 rounded-lg border border-divider h-full overflow-y-auto ${className}`;
  
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
      
      {/* Compact Filters - visível na visão de decorações */}
      {enableFilters && (viewMode === 'decorations' || searchTerm) && (
        <div className="p-3 md:p-4 border-b border-divider">
          <DecorationFiltersCompact
            value={filters}
            decorations={decorations}
            onChange={function(f){
              console.log('[LIB] onChange filters from UI', f);
              setFilters(f);
            }}
            disabled={disabled}
            isInCategory={Boolean(activeCategory) && !searchTerm}
          />
        </div>
      )}
      
      {/* Back to categories closer to selectors (filters/grid) */}
      {(viewMode === 'decorations' || searchTerm) && (
        <div className="px-3 md:px-4 pt-3 pb-2 border-b border-divider">
          <button
            onClick={handleBackToCategories}
            className="flex items-center gap-2 text-default-500 hover:text-default-700 transition-colors"
            title="Back to categories"
            disabled={disabled}
          >
            <Icon icon="lucide:arrow-left" className="text-lg" />
            <span className="text-sm">Back to categories</span>
          </button>
        </div>
      )}

      {/* Content based on view mode and search */}
      <div className="flex-1">
        {viewMode === 'categories' && !searchTerm ? (
          <CategoryMenu
            categories={categories}
            onCategorySelect={handleCategorySelect}
          />
        ) : (
          <DecorationGrid 
            decorations={finalDecorations.map(function(d){
              // Priorizar versão de noite na biblioteca; se não houver, cair para dia e depois thumbnail
              var resolved = Object.assign({}, d);
              resolved.imageUrl = d.imageUrlNight || d.imageUrlDay || d.thumbnailUrl;
              return resolved;
            })}
            isLoading={isLoading}
            onSelect={onDecorationSelect}
          />
        )}
        {/* Paginação simples */}
        {(!isLoading && hasMore && viewMode === 'decorations') && (
          <div className="p-3 border-t border-divider">
            <button
              className="w-full text-sm py-1.5 rounded-md bg-default-100 hover:bg-default-200"
              onClick={function(){ setPage(function(p){ return p + 1; }); }}
              disabled={disabled}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </aside>
    // TODO: Close DndContext when installed
    // </DndContext>
  );
};
