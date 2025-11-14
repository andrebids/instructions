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

  // Limpar stream de câmera ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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
    const fileObjects = fileArray.map(file => ({
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(fileObjects);
    setIsPreparing(false);
    setError(null);
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
      
      if (response.success && response.images) {
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
      console.error('Upload error:', err);
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
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-default-100">
                  <Icon icon="lucide:image" className="text-3xl text-primary flex-shrink-0" />
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
                  {fileObj.status === 'done' && <Icon icon="lucide:check-circle" className="text-2xl text-success flex-shrink-0" />}
                  {fileObj.status === 'uploading' && <Spinner size="sm" />}
                  {fileObj.status === 'error' && <Icon icon="lucide:x-circle" className="text-2xl text-danger flex-shrink-0" />}
                </div>
              ))}
            </div>
            
            {!uploading && files.length > 0 && (
              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  variant="light"
                  onPress={() => {
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

