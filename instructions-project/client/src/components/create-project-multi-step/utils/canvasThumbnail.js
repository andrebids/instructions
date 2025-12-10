/**
 * Gera um thumbnail do canvas com decorações para uma imagem específica
 * Usa canvas HTML5 para renderizar a imagem de fundo e decorações
 * @param {Object} params
 * @param {Object} params.canvasImage - Imagem de fundo do canvas
 * @param {Array} params.decorations - Array de decorações para esta imagem
 * @param {number} params.width - Largura do thumbnail (padrão: 200)
 * @param {number} params.height - Altura do thumbnail (padrão: 150)
 * @returns {Promise<string>} DataURL da imagem renderizada
 */
export async function generateCanvasThumbnail({ canvasImage, decorations = [], width = 200, height = 150 }) {
  return new Promise((resolve, reject) => {
    try {
      // Criar um canvas temporário
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Calcular escala para ajustar ao tamanho do thumbnail
      const scaleX = width / (canvasImage.width || 1200);
      const scaleY = height / (canvasImage.height || 600);
      const scale = Math.min(scaleX, scaleY);

      // Desenhar imagem de fundo
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      bgImage.onload = () => {
        const scaledWidth = (canvasImage.width || 1200) * scale;
        const scaledHeight = (canvasImage.height || 600) * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;

        ctx.drawImage(bgImage, offsetX, offsetY, scaledWidth, scaledHeight);

        // Desenhar decorações
        let decorationsLoaded = 0;
        const totalDecorations = decorations.length;

        if (totalDecorations === 0) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        decorations.forEach((decoration) => {
          const decImage = new Image();
          decImage.crossOrigin = 'anonymous';
          decImage.onload = () => {
            const decX = offsetX + (decoration.x * scale);
            const decY = offsetY + (decoration.y * scale);
            const decWidth = decoration.width * scale;
            const decHeight = decoration.height * scale;

            ctx.save();
            ctx.translate(decX + decWidth / 2, decY + decHeight / 2);
            ctx.rotate((decoration.rotation || 0) * Math.PI / 180);
            ctx.drawImage(decImage, -decWidth / 2, -decHeight / 2, decWidth, decHeight);
            ctx.restore();

            decorationsLoaded++;
            if (decorationsLoaded === totalDecorations) {
              resolve(canvas.toDataURL('image/png'));
            }
          };
          decImage.onerror = () => {
            decorationsLoaded++;
            if (decorationsLoaded === totalDecorations) {
              resolve(canvas.toDataURL('image/png'));
            }
          };
          decImage.src = decoration.src || decoration.dayUrl || decoration.nightUrl || '';
        });
      };
      bgImage.onerror = () => {
        // Se não conseguir carregar a imagem, retornar canvas vazio
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      bgImage.src = canvasImage.src || canvasImage.dayVersion || canvasImage.originalUrl || '';
    } catch (error) {
      console.error('❌ Erro ao gerar thumbnail:', error);
      reject(error);
    }
  });
}

/**
 * Gera thumbnails para todas as imagens do projeto
 * @param {Object} params
 * @param {Array} params.uploadedImages - Lista de imagens uploadadas
 * @param {Array} params.canvasImages - Imagens no canvas
 * @param {Object} params.decorationsByImage - Decorações por imagem: { imageId: [...] }
 * @returns {Promise<Object>} Objeto com thumbnails: { imageId: dataURL }
 */
export async function generateAllThumbnails({ uploadedImages, canvasImages, decorationsByImage = {} }) {
  const thumbnails = {};
  
  for (const image of uploadedImages) {
    // Encontrar canvasImage correspondente
    const canvasImage = canvasImages.find(ci => ci.id === image.id || ci.sourceImageId === image.id);
    const decorations = decorationsByImage[image.id] || [];

    if (canvasImage) {
      try {
        const thumbnail = await generateCanvasThumbnail({
          canvasImage: {
            ...canvasImage,
            src: image.dayVersion || image.originalUrl || image.thumbnail,
            width: canvasImage.width || 1200,
            height: canvasImage.height || 600
          },
          decorations
        });
        thumbnails[image.id] = thumbnail;
      } catch (error) {
        console.warn(`⚠️ Erro ao gerar thumbnail para imagem ${image.id}:`, error);
        // Usar thumbnail original como fallback
        thumbnails[image.id] = image.thumbnail || image.dayVersion || image.originalUrl || '';
      }
    } else {
      // Se não há canvasImage, usar thumbnail original
      thumbnails[image.id] = image.thumbnail || image.dayVersion || image.originalUrl || '';
    }
  }

  return thumbnails;
}

