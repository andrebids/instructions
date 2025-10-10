import { useState, useEffect } from 'react';

export const useDecorationSearch = (decorations, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  const filteredDecorations = decorations.filter(dec => {
    if (!debouncedTerm) return true;
    const term = debouncedTerm.toLowerCase();
    const matchesName = dec.name.toLowerCase().includes(term);
    const matchesRef = dec.ref.toLowerCase().includes(term);
    const matchesTags = dec.tags?.some(tag => tag.toLowerCase().includes(term)) || false;
    
    return matchesName || matchesRef || matchesTags;
  });
  
  return { 
    searchTerm, 
    setSearchTerm, 
    filteredDecorations,
    isSearching: debouncedTerm !== searchTerm
  };
};
