// Função para converter imagem para WebP
const convertImageToWebP = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let objectUrl = null;

    // Timeout para evitar espera infinita
    const timeout = setTimeout(() => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Image conversion timeout'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        // Configurar canvas com as dimensões da imagem
        canvas.width = img.width;
        canvas.height = img.height;

        // Desenhar imagem no canvas
        ctx.drawImage(img, 0, 0);

        // Converter para WebP
        canvas.toBlob(
          (blob) => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          },
          'image/webp',
          0.9 // Qualidade (0-1)
        );
      } catch (error) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for conversion'));
    };

    // Carregar imagem
    objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
};

// Função para converter imagem para WebP e criar preview
export const createImagePreview = async (file) => {
  // Detectar se é imagem - aceitar qualquer mimetype que comece com "image/"
  const mimetype = file.type || '';
  const isImageFile = mimetype.startsWith('image/');
  
  if (!isImageFile) {
    return null;
  }

  try {
    // Tentar criar preview direto primeiro (mais rápido para formatos suportados)
    const directPreview = URL.createObjectURL(file);
    
    // Verificar se a imagem pode ser carregada
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        // Timeout após 5 segundos - usar preview direto mesmo assim
        URL.revokeObjectURL(directPreview);
        resolve(URL.createObjectURL(file));
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        // Se carregou com sucesso, usar preview direto
        resolve(directPreview);
      };
      
      img.onerror = async () => {
        clearTimeout(timeout);
        // Se falhou ao carregar, tentar converter para WebP
        URL.revokeObjectURL(directPreview);
        try {
          const webpBlob = await convertImageToWebP(file);
          const webpUrl = URL.createObjectURL(webpBlob);
          resolve(webpUrl);
        } catch (error) {
          console.warn('Could not convert image to WebP:', error);
          // Se conversão falhar, retornar null (não mostrar preview)
          resolve(null);
        }
      };
      
      img.src = directPreview;
    });
  } catch (error) {
    console.warn('Error creating image preview:', error);
    // Fallback: tentar criar preview direto
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      return null;
    }
  }
};




