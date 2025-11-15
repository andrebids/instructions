import React, { useState, useRef, useEffect } from "react";
import { Card, Button, Progress, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { projectsAPI } from "../../../services/api";

/**
 * Componente Modal de Upload
 * Upload real de imagens com suporte a câmera e arquivos
 * @param {Object} props
 * @param {Function} props.onUploadComplete - Callback quando upload completo, recebe array de imagens
 * @param {string} props.projectId - ID do projeto para associar as imagens
 */
export const UploadModal = ({ onUploadComplete, projectId }) => {
  const [isPreparing, setIsPreparing] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const callbackCalledRef = useRef(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const previewUrlsRef = useRef([]);

  // Limpar stream de câmera e URLs de preview ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Limpar todas as URLs de preview
      previewUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Função para capturar foto da câmera
  const captureFromCamera = async () => {
    try {
      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Câmera traseira no mobile
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  // Função para tirar foto
  const takePicture = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFilesSelected([file]);
      }
    }, 'image/jpeg', 0.9);
    
    // Parar stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Função para lidar com seleção de arquivos
  const handleFilesSelected = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const fileObjects = fileArray.map(file => {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl); // Rastrear URL para limpeza
      return {
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending',
        previewUrl // Criar URL de preview para thumbnail
      };
    });
    
    setFiles(fileObjects);
    setIsPreparing(false);
    setError(null);
  };

  // Função para remover uma imagem específica
  const handleRemoveFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      // Limpar URL de preview para evitar memory leak
      if (newFiles[index].previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl);
        // Remover da ref também
        previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== newFiles[index].previewUrl);
      }
      newFiles.splice(index, 1);
      // Se não houver mais arquivos, voltar para o estado inicial
      if (newFiles.length === 0) {
        setIsPreparing(true);
      }
      return newFiles;
    });
  };

  // Função para fazer upload real
  const handleUpload = async () => {
    if (!projectId) {
      setError('Project ID not provided');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const fileList = files.map(f => f.file);
      const response = await projectsAPI.uploadImages(projectId, fileList);
      
      // Log informações de debug do servidor (sempre mostrar)
      console.log('📁 [UPLOAD DEBUG] ===== INFORMAÇÕES DO SERVIDOR =====');
      console.log('📁 [UPLOAD DEBUG] Resposta completa:', response);
      
      if (response.debug) {
        console.log('📁 [UPLOAD DEBUG] Informações de debug:', response.debug);
        
        // Log de cada arquivo
        if (response.debug.uploadDebug && response.debug.uploadDebug.length > 0) {
          response.debug.uploadDebug.forEach((fileDebug, index) => {
            console.log(`\n📄 [UPLOAD DEBUG] Arquivo ${index + 1}:`, {
              filename: fileDebug.filename,
              originalname: fileDebug.originalname,
              multerPath: fileDebug.multerPath,
              multerPathExists: fileDebug.multerPathExists,
              expectedPath: fileDebug.expectedPath,
              expectedPathExists: fileDebug.expectedPathExists,
              size: fileDebug.size,
              url: fileDebug.url,
              cwd: fileDebug.cwd
            });
            
            if (!fileDebug.multerPathExists && !fileDebug.expectedPathExists) {
              console.error('❌ [UPLOAD DEBUG] Arquivo NÃO encontrado após upload!');
              console.error('   Multer path:', fileDebug.multerPath);
              console.error('   Expected path:', fileDebug.expectedPath);
            } else if (fileDebug.multerPathExists && !fileDebug.expectedPathExists) {
              console.warn('⚠️ [UPLOAD DEBUG] Arquivo salvo em local diferente do esperado');
              console.warn('   Multer path (existe):', fileDebug.multerPath);
              console.warn('   Expected path (não existe):', fileDebug.expectedPath);
            } else {
              console.log('✅ [UPLOAD DEBUG] Arquivo salvo corretamente');
            }
          });
        } else {
          console.warn('⚠️ [UPLOAD DEBUG] Nenhuma informação de debug de arquivo disponível');
        }
        
        // Log de diretórios
        console.log('\n📂 [UPLOAD DEBUG] Diretórios:', {
          cwd: response.debug.cwd,
          publicDir: response.debug.publicDir,
          publicDirExists: response.debug.publicDirExists,
          uploadsDir: response.debug.uploadsDir,
          uploadsDirExists: response.debug.uploadsDirExists,
          projectDayDir: response.debug.projectDayDir,
          projectDayDirExists: response.debug.projectDayDirExists,
          filesInDayDir: response.debug.filesInDayDir
        });
        
        // Verificar se arquivos estão no diretório
        if (response.debug.filesInDayDir && response.debug.filesInDayDir.length > 0) {
          console.log('✅ [UPLOAD DEBUG] Arquivos encontrados no diretório day:', response.debug.filesInDayDir);
        } else {
          console.error('❌ [UPLOAD DEBUG] Nenhum arquivo encontrado no diretório day!');
        }
      } else {
        console.warn('⚠️ [UPLOAD DEBUG] Nenhuma informação de debug disponível na resposta');
      }
      
      console.log('📁 [UPLOAD DEBUG] ===== FIM DAS INFORMAÇÕES =====\n');
      
      if (response.success && response.images) {
        console.log('✅ [UPLOAD] Upload concluído:', {
          imagesCount: response.images.length,
          projectId: response.projectId,
          images: response.images.map(img => ({
            id: img.id,
            name: img.name,
            url: img.originalUrl || img.dayVersion || img.thumbnail
          }))
        });
        
        // Atualizar progresso para 100%
        setFiles(prev => prev.map(f => ({ ...f, progress: 100, status: 'done' })));
        
        // Chamar callback com as imagens processadas
        if (onUploadComplete && !callbackCalledRef.current) {
          callbackCalledRef.current = true;
          setTimeout(() => {
            onUploadComplete(response.images);
          }, 500);
        }
      } else {
        throw new Error(response.error || 'Upload error');
      }
    } catch (err) {
      console.error('❌ [UPLOAD] Erro no upload:', err);
      setError(err.message || 'Error uploading images');
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    } finally {
      setUploading(false);
    }
  };

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
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFilesSelected(selectedFiles);
    }
  };

  const handleCameraInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFilesSelected(selectedFiles);
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
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraInputChange}
                  className="hidden"
                />
                <Button 
                  color="primary" 
                  variant="ghost"
                  onPress={() => fileInputRef.current?.click()}
                  aria-label="Select Files"
                  startContent={<Icon icon="lucide:folder" />}
                >
                  Select Files
                </Button>
                <Button 
                  color="secondary" 
                  variant="ghost"
                  onPress={() => cameraInputRef.current?.click()}
                  aria-label="Take Photo"
                  startContent={<Icon icon="lucide:camera" />}
                >
                  Take Photo
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">
              {uploading ? 'Uploading Images...' : 'Selected Images'}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                {error}
              </div>
            )}
            
            <div className="p-4 bg-default-50 rounded-lg space-y-3 max-h-96 overflow-y-auto">
              {files.map((fileObj, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-default-100 relative">
                  {/* Thumbnail da imagem */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-default-200 border border-default-300">
                    {fileObj.previewUrl ? (
                      <img 
                        src={fileObj.previewUrl} 
                        alt={fileObj.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon icon="lucide:image" className="text-2xl text-default-400 w-full h-full flex items-center justify-center" />
                    )}
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-medium truncate text-sm">{fileObj.name}</p>
                    <p className="text-xs text-default-500">
                      {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {uploading && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={fileObj.progress} size="sm" className="flex-1" />
                        <span className="text-xs text-default-500 w-10 text-right">{fileObj.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {fileObj.status === 'done' && <Icon icon="lucide:check-circle" className="text-2xl text-success" />}
                    {fileObj.status === 'uploading' && <Spinner size="sm" />}
                    {fileObj.status === 'error' && (
                      <Icon 
                        icon="lucide:x-circle" 
                        className="text-2xl text-danger" 
                        title="Erro no upload"
                      />
                    )}
                    {/* Botão X para remover imagem - sempre visível quando não está fazendo upload */}
                    {!uploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="p-1.5 rounded-full hover:bg-danger-100 active:bg-danger-200 text-danger-500 hover:text-danger-700 transition-colors focus:outline-none focus:ring-2 focus:ring-danger-300"
                        aria-label="Remover imagem"
                        type="button"
                        title="Remover imagem"
                      >
                        <Icon icon="lucide:x" className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {!uploading && files.length > 0 && (
              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  variant="light"
                  onPress={() => {
                    // Limpar todas as URLs de preview
                    files.forEach(fileObj => {
                      if (fileObj.previewUrl) {
                        URL.revokeObjectURL(fileObj.previewUrl);
                      }
                    });
                    previewUrlsRef.current = [];
                    setFiles([]);
                    setIsPreparing(true);
                    setError(null);
                    callbackCalledRef.current = false;
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpload}
                  isDisabled={!projectId}
                  startContent={<Icon icon="lucide:upload" />}
                >
                  Upload {files.length} Image{files.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

