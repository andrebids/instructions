import { useState, useEffect } from 'react';
import decorationsData from '../data/decorations.json';

export const useDecorations = () => {
  const [decorations, setDecorations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setDecorations(decorationsData.decorations);
    setCategories(decorationsData.categories);
    setIsLoading(false);
  }, []);
  
  const filterByCategory = (categoryId) => {
    if (!categoryId) return decorations;
    return decorations.filter(d => d.category === categoryId);
  };
  
  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat.id === categoryId);
  };
  
  const getDecorationById = (decorationId) => {
    return decorations.find(dec => dec.id === decorationId);
  };
  
  return { 
    decorations, 
    categories, 
    isLoading, 
    filterByCategory,
    getCategoryById,
    getDecorationById
  };
};
