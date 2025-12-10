import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

// Componente para exibir um item de attachment com preview de imagem
export const AttachmentItem = ({ file, index, onRemove, onEdit }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  // Aceitar qualquer mimetype que comece com "image/" para suportar todos os formatos de imagem
  const isImage = file.mimetype?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif|svg|ico)$/i) || file.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|heic|heif|svg|ico)$/i);
  const isAIGenerated = file.isAIGenerated;

  // Construir URL completa se necessário
  const imageUrl = React.useMemo(() => {
    // Se houver preview local (blob URL), usar primeiro
    if (file.previewUrl) {
      return file.previewUrl;
    }
    
    if (!file.url && !file.path) return null;

    // Preferir file.url se disponível, caso contrário usar file.path
    let url = file.url || file.path;

    // Detectar caminhos UNC do Windows (começam com \\)
    // Exemplo: \\192.168.2.22\Olimpo\.dev\web\thecore\coelho-1764760019198-615688862.webp
    if (url.startsWith('\\\\') || url.startsWith('//')) {
      // Extrair apenas o nome do arquivo do caminho UNC
      const filename = url.split(/[\\/]/).pop();
      if (filename) {
        // Construir URL HTTP usando o nome do arquivo
        return `/api/files/${filename}`;
      }
      console.warn('Could not extract filename from UNC path:', url);
      return null;
    }

    // Se a URL já é absoluta (começa com http://, https:// ou data:)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // SEMPRE usar caminho relativo para que o proxy do Vite funcione
        // Se o caminho começa com /api/files/, usar diretamente (será resolvido pelo proxy)
        if (pathname.startsWith('/api/files/')) {
          return pathname;
        }

        // Se o caminho começa com /api/, usar diretamente
        if (pathname.startsWith('/api/')) {
          return pathname;
        }

        // Se não começa com /api/, adicionar /api antes
        return `/api${pathname}`;
      } catch (e) {
        // Se não conseguir fazer parse da URL, tentar extrair o caminho manualmente
        const match = url.match(/\/api\/files\/[^\/\s]+/);
        if (match) {
          return match[0];
        }
        console.warn('Could not parse URL:', url, e);
        return url;
      }
    }

    // Se a URL já começa com /api/, usar diretamente (será resolvida pelo proxy do Vite)
    if (url.startsWith('/api/')) {
      return url;
    }

    // Se começa com /, é um caminho relativo ao servidor
    if (url.startsWith('/')) {
      // Se não começa com /api/, adicionar /api antes
      if (!url.startsWith('/api/')) {
        return `/api${url}`;
      }
      return url;
    }

    // Caso contrário, assumir que é um nome de arquivo e construir caminho completo
    return `/api/files/${url}`;
  }, [file.url, file.path, file.previewUrl]);

  const handleRemoveClick = React.useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🗑️ Remove button clicked for index:', index, 'File:', file.name);
    if (onRemove && typeof onRemove === 'function') {
      onRemove(index);
    } else {
      console.error('❌ onRemove is not a function:', onRemove);
    }
  }, [index, file.name, onRemove]);

  return (
    <div className="flex items-center justify-between p-2 bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-600/30 group">
      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
        {isImage ? (
          <div className="relative w-10 h-10 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {!imageError && imageUrl ? (
              <img
                src={imageUrl}
                alt={file.name}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  console.error('❌ Error loading image:', imageUrl, file);
                  setImageError(true);
                  setImageLoading(false);
                  e.target.style.display = 'none';
                }}
                style={{ display: imageLoading ? 'none' : 'block' }}
              />
            ) : null}
            {(imageError || !imageUrl) && (
              <div className={`w-full h-full flex items-center justify-center ${isAIGenerated ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-pink-100 dark:bg-pink-900/30'}`}>
                <Icon icon={isAIGenerated ? "lucide:sparkles" : "lucide:image"} className={`w-5 h-5 ${isAIGenerated ? 'text-purple-500' : 'text-pink-500'}`} />
              </div>
            )}
            {isAIGenerated && !imageError && imageUrl && (
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-[8px] px-1 py-0.5 rounded-bl-md font-bold">
                AI
              </div>
            )}
          </div>
        ) : (
          <div className={`p-1.5 bg-white dark:bg-gray-600 rounded-md ${isAIGenerated ? 'text-purple-500' : 'text-pink-500'} shadow-sm`}>
            <Icon icon={isAIGenerated ? "lucide:sparkles" : "lucide:file"} className="w-4 h-4" />
          </div>
        )}
        <span className="truncate text-xs font-medium flex-1">{file.name}</span>
      </div>
      <div className="flex items-center gap-1">
        {isAIGenerated && onEdit && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            color="primary"
            onPress={() => onEdit(index)}
            className="opacity-70 group-hover:opacity-100 transition-opacity h-6 w-6 min-w-6 flex-shrink-0"
            aria-label={`Edit AI generated image ${file.name}`}
          >
            <Icon icon="lucide:edit-2" className="w-3 h-3" />
          </Button>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          onPress={handleRemoveClick}
          className="opacity-70 group-hover:opacity-100 transition-opacity h-6 w-6 min-w-6 flex-shrink-0 z-10"
          aria-label={`Remove attachment ${file.name}`}
        >
          <Icon icon="lucide:x" className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

