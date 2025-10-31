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
            var item = {
              id: product.id,
              name: product.name || 'Produto sem nome',
              thumbnail: product.imagesDayUrl || null,
              nightVersion: product.imagesNightUrl || product.imagesDayUrl || null
            };
            formatted.push(item);
          }
          // Filtrar para usar APENAS imagens do dia de /demo-images/sourceday
          var allowed = [];
          for (var j = 0; j < formatted.length; j++) {
            var it = formatted[j];
            var thumb = it && it.thumbnail ? String(it.thumbnail) : '';
            if (thumb.indexOf('/demo-images/sourceday/') === 0) {
              // Sanitizar nightVersion para manter apenas /demo-images/sourcenight
              var night = it.nightVersion ? String(it.nightVersion) : null;
              if (night && night.indexOf('/demo-images/sourcenight/') !== 0) {
                // Se não pertencer à pasta desejada, descartar nightVersion
                night = null;
              }
              allowed.push({
                id: it.id,
                name: it.name,
                thumbnail: thumb,
                nightVersion: night
              });
            }
          }
          setSourceImages(allowed);
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

