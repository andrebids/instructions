import { useState, useEffect } from 'react';
import { productsAPI } from '../../../services/api';

function useSourceImages() {
  var [sourceImages, setSourceImages] = useState([]);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);

  useEffect(function() {
    function loadSourceImages() {
      setLoading(true);
      setError(null);
      
      productsAPI.getSourceImages()
        .then(function(products) {
          // Transformar produtos para formato esperado pelo canvas
          var formatted = [];
          for (var i = 0; i < products.length; i++) {
            var product = products[i];
            formatted.push({
              id: product.id,
              name: product.name || 'Produto sem nome',
              thumbnail: product.imagesDayUrl || null,
              nightVersion: product.imagesNightUrl || product.imagesDayUrl || null,
            });
          }
          setSourceImages(formatted);
          setLoading(false);
        })
        .catch(function(err) {
          console.error('Erro ao carregar Source Images:', err);
          setError(err.message || 'Erro ao carregar Source Images');
          setLoading(false);
          // Fallback para array vazio em caso de erro
          setSourceImages([]);
        });
    }
    
    loadSourceImages();
  }, []);

  return {
    sourceImages: sourceImages,
    loading: loading,
    error: error,
  };
}

export default useSourceImages;

