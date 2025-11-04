import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Progress, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";

/**
 * Componente Modal de Upload
 * Simula upload de imagens com progresso
 * @param {Object} props
 * @param {Function} props.onUploadComplete - Callback quando upload completo
 */
export const UploadModal = ({ onUploadComplete }) => {
  const [isPreparing, setIsPreparing] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([
    { name: 'source 1.jpeg', size: '2.4 MB', progress: 0, status: 'pending' },
    { name: 'source 2.jpeg', size: '1.8 MB', progress: 0, status: 'pending' },
    { name: 'source 3.jpeg', size: '0.9 MB', progress: 0, status: 'pending' },
  ]);
  const callbackCalledRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsPreparing(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPreparing) return;

    let fileIndex = 0;
    const intervals = [];

    const uploadNextFile = () => {
      if (fileIndex >= files.length) {
        return;
      }

      setFiles(prev => {
        const newFiles = [...prev];
        if (newFiles[fileIndex]) {
          newFiles[fileIndex].status = 'uploading';
        }
        return newFiles;
      });

      // 2 segundos por arquivo: incrementar 5% a cada 100ms (20 * 100ms = 2000ms)
      const interval = setInterval(() => {
        setFiles(prev => {
          const newFiles = [...prev];
          const currentFile = newFiles[fileIndex];

          // Verificar se currentFile existe antes de aceder às suas propriedades
          if (currentFile && currentFile.progress < 100) {
            currentFile.progress += 5;
            return newFiles;
          } else if (currentFile) {
            clearInterval(interval);
            currentFile.status = 'done';
            fileIndex++;
            // Chamar uploadNextFile no próximo tick para evitar problemas de estado
            setTimeout(uploadNextFile, 50);
            return newFiles;
          }
          return newFiles;
        });
      }, 100);
      intervals.push(interval);
    };

    uploadNextFile();

    return () => intervals.forEach(clearInterval);
  }, [isPreparing, files.length]);

  // Verificar quando todos os arquivos estão completos
  useEffect(() => {
    if (isPreparing) return;
    
    const allDone = files.every(file => file.status === 'done');
    if (allDone && files.length > 0 && onUploadComplete && !callbackCalledRef.current) {
      callbackCalledRef.current = true;
      const timer = setTimeout(() => {
        onUploadComplete();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [files, isPreparing, onUploadComplete]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    // Simular recepção de arquivos (fake)
    if (isPreparing) {
      setIsPreparing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Card className="p-8 text-center max-w-lg w-full m-4 transition-all duration-300">
        {isPreparing ? (
          <>
            <h2 className="text-xl font-semibold mb-4">Upload Background Image</h2>
            <div 
              className={`border-2 border-dashed rounded-lg p-12 bg-default-50 transition-all duration-200 ${
                dragOver 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                  : 'border-default-300'
              }`}
            >
              <Icon icon="lucide:upload-cloud" className={`text-5xl mx-auto mb-4 transition-colors ${
                dragOver ? 'text-primary' : 'text-default-500'
              }`} />
              <p className={`mb-2 transition-colors ${
                dragOver ? 'text-primary font-medium' : 'text-default-600'
              }`}>
                {dragOver ? 'Drop your images here' : 'Drag and drop your images here'}
              </p>
              <p className="text-default-500 text-sm mb-4">or</p>
              <Button 
                color="primary" 
                variant="ghost"
                aria-label="Select Files"
              >
                Select Files
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Uploading Files...</h2>
            <div className="p-4 bg-default-50 rounded-lg space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-default-100">
                  <Icon icon="lucide:image" className="text-3xl text-primary flex-shrink-0" />
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-medium truncate text-sm">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={file.progress} size="sm" className="flex-1" />
                      <span className="text-xs text-default-500 w-10 text-right">{file.progress}%</span>
                    </div>
                  </div>
                  {file.status === 'done' && <Icon icon="lucide:check-circle" className="text-2xl text-success flex-shrink-0" />}
                  {file.status === 'uploading' && <Spinner size="sm" />}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

