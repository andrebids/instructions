/**
 * Serviço de gestão de imagens de projetos (conversão night/day)
 */
import { Project } from '../models/index.js';
import { logNightConversion, logError } from '../utils/projectLogger.js';

/**
 * Atualiza nightVersion de uma imagem no array uploadedImages
 * @param {string} projectId - ID do projeto
 * @param {string} imageId - ID da imagem
 * @param {string} nightImageUrl - URL da imagem de noite
 * @param {string} status - Status da conversão ('completed' ou 'failed')
 * @returns {Object} - Imagem atualizada
 */
export async function updateImageNightVersion(projectId, imageId, nightImageUrl, status = 'completed') {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const uploadedImages = project.uploadedImages || [];
  const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
  
  if (imageIndex === -1) {
    throw new Error('Imagem não encontrada no projeto');
  }

  // Atualizar imagem no array
  uploadedImages[imageIndex] = {
    ...uploadedImages[imageIndex],
    nightVersion: nightImageUrl || uploadedImages[imageIndex].nightVersion,
    conversionStatus: status
  };

  // Atualizar projeto
  project.uploadedImages = uploadedImages;
  await project.save();

  logNightConversion(`Atualizado para imagem ${imageId}: status=${status}`);
  return uploadedImages[imageIndex];
}

/**
 * Recebe imagem de noite convertida
 */
export async function receiveNightImage(projectId, imageId, nightImageUrl) {
  if (!projectId || !imageId) {
    throw new Error('Project ID e Image ID são obrigatórios');
  }

  // Verificar se projeto existe
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  // Se não há URL fornecida, retornar erro
  if (!nightImageUrl) {
    throw new Error('Imagem de noite ou URL deve ser fornecida');
  }

  // Atualizar nightVersion no projeto
  const updatedImage = await updateImageNightVersion(projectId, imageId, nightImageUrl, 'completed');

  return {
    nightVersion: updatedImage.nightVersion,
    conversionStatus: updatedImage.conversionStatus
  };
}

/**
 * Marca conversão como falhada
 */
export async function markConversionFailed(projectId, imageId, errorMessage = null) {
  if (!projectId || !imageId) {
    throw new Error('Project ID e Image ID são obrigatórios');
  }

  // Verificar se projeto existe
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  // Atualizar status para 'failed'
  const updatedImage = await updateImageNightVersion(projectId, imageId, null, 'failed');

  logNightConversion(`Conversão falhada para imagem: ${imageId}`, errorMessage || '');

  return {
    conversionStatus: updatedImage.conversionStatus,
    error: errorMessage || 'Conversão dia/noite não disponível no momento'
  };
}

