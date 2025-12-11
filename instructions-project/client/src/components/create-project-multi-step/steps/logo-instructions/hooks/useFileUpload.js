import React from "react";
import { createImagePreview } from "../utils/imageUtils";

// Hook para gerenciar upload de arquivos
export const useFileUpload = ({
  currentLogo,
  logoDetails,
  savedLogos,
  onInputChange,
  formData,
}) => {
  const handleFileUpload = React.useCallback(async (newFiles) => {
    if (!newFiles || newFiles.length === 0) return;
    
    console.log('📤 Uploading files to server...', newFiles);

    // Criar previews locais imediatamente e adicionar aos attachments
    const existingFiles = currentLogo.attachmentFiles || [];
    
    // Criar previews para todos os arquivos (assíncrono)
    const tempFilesPromises = newFiles.map(async (file) => {
      // Detectar mimetype do arquivo - aceitar qualquer imagem
      const mimetype = file.type || '';
      const isImageFile = mimetype.startsWith('image/');
      
      // Criar preview para imagens
      const previewUrl = isImageFile ? await createImagePreview(file) : null;
      
      return {
        name: file.name,
        filename: file.name,
        size: file.size,
        mimetype: mimetype,
        previewUrl: previewUrl,
        _isUploading: true, // Flag para indicar que está fazendo upload
        _fileObject: file, // Guardar referência ao objeto File original
      };
    });

    const tempFiles = await Promise.all(tempFilesPromises);

    // Adicionar arquivos temporários com preview local imediatamente
    const allFilesWithPreview = [...existingFiles, ...tempFiles];
    const updatedCurrentLogoWithPreview = {
      ...currentLogo,
      attachmentFiles: allFilesWithPreview,
    };
    const updatedLogoDetailsWithPreview = {
      ...logoDetails,
      currentLogo: updatedCurrentLogoWithPreview,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetailsWithPreview);

    // Upload each file to the server
    const uploadPromises = newFiles.map(async (file, index) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const apiBase = (import.meta?.env?.VITE_API_URL || '').replace(/\/api$/, '') || '';
          const response = await fetch(`${apiBase}/api/files/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText} `);
          }

          const result = await response.json();
          console.log('✅ File uploaded:', result.file);

          // Return file metadata to store in attachments, mantendo a preview local
          const tempFile = tempFiles[index];
          return {
            name: result.file.originalName,
            filename: result.file.filename,
            path: result.file.path,
            url: result.file.url,
            size: result.file.size,
            mimetype: result.file.mimetype,
            previewUrl: tempFile.previewUrl, // Manter preview local
          };
        } catch (error) {
          console.error('❌ Error uploading file:', file.name, error);
          // Remover preview local em caso de erro
          const tempFile = tempFiles[index];
          if (tempFile?.previewUrl) {
            URL.revokeObjectURL(tempFile.previewUrl);
          }
          return null;
        }
      });

      // Wait for all uploads to complete
      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(f => f !== null);

      if (successfulUploads.length > 0) {
        // Remover arquivos temporários e adicionar os com metadados do servidor
        const filesWithoutTemp = existingFiles.filter(f => !f._isUploading);
        const allFiles = [...filesWithoutTemp, ...successfulUploads];

        // Save file metadata to currentLogo
        const updatedCurrentLogo = {
          ...currentLogo,
          attachmentFiles: allFiles,
        };
        const updatedLogoDetails = {
          ...logoDetails,
          currentLogo: updatedCurrentLogo,
          logos: savedLogos,
        };
        onInputChange("logoDetails", updatedLogoDetails);
        console.log('✅ Files uploaded and metadata saved to currentLogo:', successfulUploads);
      } else {
        // Se nenhum upload foi bem-sucedido, remover os arquivos temporários
        const filesWithoutTemp = existingFiles.filter(f => !f._isUploading);
        const updatedCurrentLogo = {
          ...currentLogo,
          attachmentFiles: filesWithoutTemp,
        };
        const updatedLogoDetails = {
          ...logoDetails,
          currentLogo: updatedCurrentLogo,
          logos: savedLogos,
        };
        onInputChange("logoDetails", updatedLogoDetails);
      }
  }, [currentLogo, logoDetails, savedLogos, onInputChange]);

  const handleRemoveAttachment = React.useCallback((indexToRemove, fileToRemove) => {
    
    // Obter valores mais recentes diretamente de formData
    const latestLogoDetails = formData.logoDetails || {};
    const rawCurrentLogo = latestLogoDetails.currentLogo || latestLogoDetails;
    const currentLogoToUpdate = {
      ...rawCurrentLogo,
      isModification: rawCurrentLogo.isModification === true ? true : false
    };
    const savedLogosToUpdate = latestLogoDetails.logos || [];
    
    // Obter attachments atuais
    const currentAttachments = [...(currentLogoToUpdate.attachmentFiles || [])];
    // Se o index for inválido, tentar encontrar pelo nome/preview/url
    let resolvedIndex = indexToRemove;
    if (resolvedIndex === undefined || resolvedIndex < 0 || resolvedIndex >= currentAttachments.length) {
      if (fileToRemove) {
        resolvedIndex = currentAttachments.findIndex((f) =>
          (fileToRemove.name && f.name === fileToRemove.name) ||
          (fileToRemove.url && f.url === fileToRemove.url) ||
          (fileToRemove.path && f.path === fileToRemove.path) ||
          (fileToRemove.previewUrl && f.previewUrl === fileToRemove.previewUrl)
        );
      }
    }
    if (resolvedIndex === undefined || resolvedIndex < 0 || resolvedIndex >= currentAttachments.length) {
      return;
    }
    
    // Verificar se o índice é válido
    if (indexToRemove < 0 || indexToRemove >= currentAttachments.length) {
      console.error('❌ Invalid attachment index:', indexToRemove, 'Total attachments:', currentAttachments.length);
      return;
    }
    
    // Limpar preview URL se existir antes de remover
    const attachmentToRemove = currentAttachments[resolvedIndex];
    if (attachmentToRemove?.previewUrl) {
      console.log('🗑️ Revoking preview URL for:', attachmentToRemove.name);
      URL.revokeObjectURL(attachmentToRemove.previewUrl);
    }
    
    // Criar novo array sem o attachment removido
    const newAttachments = currentAttachments.filter((_, i) => i !== resolvedIndex);

    // Criar novo currentLogo com attachments atualizados
    const updatedCurrentLogo = {
      ...currentLogoToUpdate,
      attachmentFiles: newAttachments,
    };
    
    // Criar novo logoDetails
    const updatedLogoDetails = {
      ...latestLogoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogosToUpdate,
    };
    
    console.log('💾 Updating logoDetails with new attachments');
    onInputChange("logoDetails", updatedLogoDetails);
  }, [formData, onInputChange]);

  return {
    handleFileUpload,
    handleRemoveAttachment,
  };
};

