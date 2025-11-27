/**
 * Utilitário profissional para resolver e validar caminhos de imagens
 * Funciona tanto em desenvolvimento quanto em produção
 * Suporta múltiplos locais de armazenamento (client/public, server/public)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve o caminho base do diretório client/public
 * Funciona em diferentes estruturas de projeto
 */
function getClientPublicPath() {
  const candidates = [
    path.resolve(__dirname, '../../client/public'),
    path.resolve(process.cwd(), '../client/public'),
    path.resolve(process.cwd(), 'client/public'),
    path.resolve(__dirname, '../../../client/public'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Resolve o caminho base do diretório server/public
 */
function getServerPublicPath() {
  const candidates = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(__dirname, '../../public'),
    path.resolve(__dirname, '../../../public'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Valida e resolve o caminho completo de uma imagem
 * Tenta múltiplos locais e variantes de nome
 * 
 * @param {string} imagePath - Caminho relativo da imagem (ex: /SHOP/TRENDING/NIGHT/IPL337_NIGHT.webp)
 * @param {string[]} variants - Variantes opcionais do nome do ficheiro para tentar
 * @returns {string|null} - Caminho validado ou null se não encontrado
 */
export function resolveImagePath(imagePath, variants = []) {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  // Normalizar o caminho (remover barra inicial se existir para trabalhar com path.join)
  const normalizedPath = imagePath.replace(/^\//, '');
  const dir = path.dirname(normalizedPath);
  const fileName = path.basename(normalizedPath);
  const ext = path.extname(fileName);
  const nameWithoutExt = path.basename(fileName, ext);

  // Base paths para procurar
  const basePaths = [];

  const clientPublic = getClientPublicPath();
  if (clientPublic) {
    basePaths.push(clientPublic);
  }

  const serverPublic = getServerPublicPath();
  if (serverPublic) {
    basePaths.push(serverPublic);
  }

  if (basePaths.length === 0) {
    console.warn('⚠️ [ImageResolver] Nenhum diretório public encontrado');
    return null;
  }

  // Lista de variantes para tentar (nome original + variantes fornecidas + variantes comuns)
  const nameVariants = [
    fileName, // Nome original primeiro
    ...variants,
  ];

  // Se o nome termina com _NIGHT, tentar também sem o sufixo
  if (nameWithoutExt.endsWith('_NIGHT')) {
    const nameWithoutNight = nameWithoutExt.replace(/_NIGHT$/, '');
    nameVariants.push(nameWithoutNight + ext);
  } else {
    // Se não termina com _NIGHT, tentar com sufixo _NIGHT
    nameVariants.push(nameWithoutExt + '_NIGHT' + ext);
  }

  // Tentar cada combinação de base path + variante
  for (const basePath of basePaths) {
    for (const variant of nameVariants) {
      const fullPath = path.join(basePath, dir, variant);

      if (fs.existsSync(fullPath)) {
        // Retornar caminho relativo começando com /
        const relativePath = path.posix.join('/', dir, variant).replace(/\\/g, '/');
        return relativePath;
      }
    }
  }

  return null;
}

/**
 * Valida o formato de um caminho de imagem (sem verificar existência física)
 * Filtra apenas imagens temporárias que são conhecidas por serem problemáticas
 * 
 * @param {string} imagePath - Caminho da imagem
 * @returns {string|null} - Caminho se válido, null se for temporário ou inválido
 */
function validateImagePathFormat(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  // Validar formato básico: deve começar com / e ter extensão válida
  if (!imagePath.startsWith('/')) {
    return null;
  }

  // IMPORTANTE: Permitir arquivos WebP com prefixo temp_ porque são arquivos convertidos válidos
  // O processImageToWebP converte para WebP mas mantém o prefixo temp_ no nome
  // Exemplo: /uploads/products/temp_dayImage_1761908607230.webp é um arquivo válido
  const isWebP = imagePath.toLowerCase().endsWith('.webp');
  const hasTemp = imagePath.includes('temp_');

  if (hasTemp && !isWebP) {
    // Filtrar apenas arquivos temporários que NÃO são WebP
    // Estes são uploads em progresso que nunca foram convertidos
    return null;
  }

  // Retornar o caminho original se passar na validação de formato
  return imagePath;
}

/**
 * Valida múltiplos caminhos de imagem APENAS POR FORMATO (sem verificar filesystem)
 * Útil para APIs onde queremos confiar na base de dados, não no estado do filesystem
 * Filtra apenas imagens temporárias problemáticas
 * 
 * @param {Object} imagePaths - Objeto com {imagesNightUrl, imagesDayUrl, thumbnailUrl}
 * @returns {Object} - Objeto com caminhos validados por formato
 */
export function validateProductImagesFormat(imagePaths) {
  const result = {
    imagesNightUrl: null,
    imagesDayUrl: null,
    thumbnailUrl: null,
  };

  if (imagePaths.imagesNightUrl) {
    result.imagesNightUrl = validateImagePathFormat(imagePaths.imagesNightUrl);
  }

  if (imagePaths.imagesDayUrl) {
    result.imagesDayUrl = validateImagePathFormat(imagePaths.imagesDayUrl);
  }

  if (imagePaths.thumbnailUrl) {
    result.thumbnailUrl = validateImagePathFormat(imagePaths.thumbnailUrl);
  }

  // Se não há thumbnail mas há day image, usar day como thumbnail
  if (!result.thumbnailUrl && result.imagesDayUrl) {
    result.thumbnailUrl = result.imagesDayUrl;
  }

  // Se não há thumbnail nem day image, usar night image como thumbnail
  // Isso garante que produtos com apenas imagem night válida tenham um thumbnail
  if (!result.thumbnailUrl && result.imagesNightUrl) {
    result.thumbnailUrl = result.imagesNightUrl;
  }

  return result;
}

/**
 * Valida múltiplos caminhos de imagem e retorna apenas os válidos
 * VERIFICA EXISTÊNCIA FÍSICA NO FILESYSTEM - use apenas em scripts de inserção/validação
 * Para APIs, use validateProductImagesFormat() que confia na base de dados
 * 
 * @param {Object} imagePaths - Objeto com {night, day, thumbnail}
 * @returns {Object} - Objeto com apenas os caminhos válidos
 */
export function validateProductImages(imagePaths) {
  const result = {
    imagesNightUrl: null,
    imagesDayUrl: null,
    thumbnailUrl: null,
  };

  if (imagePaths.imagesNightUrl) {
    result.imagesNightUrl = resolveImagePath(imagePaths.imagesNightUrl);
  }

  if (imagePaths.imagesDayUrl) {
    result.imagesDayUrl = resolveImagePath(imagePaths.imagesDayUrl);
  }

  if (imagePaths.thumbnailUrl) {
    result.thumbnailUrl = resolveImagePath(imagePaths.thumbnailUrl);
  }

  // Se não há thumbnail mas há day image, usar day como thumbnail
  if (!result.thumbnailUrl && result.imagesDayUrl) {
    result.thumbnailUrl = result.imagesDayUrl;
  }

  // Se não há thumbnail nem day image, usar night image como thumbnail
  // Isso garante que produtos com apenas imagem night válida tenham um thumbnail
  if (!result.thumbnailUrl && result.imagesNightUrl) {
    result.thumbnailUrl = result.imagesNightUrl;
  }

  return result;
}

/**
 * Verifica se uma imagem existe (apenas verificação, sem resolver caminhos)
 * 
 * @param {string} imagePath - Caminho relativo da imagem
 * @returns {boolean} - true se a imagem existe
 */
export function imageExists(imagePath) {
  return resolveImagePath(imagePath) !== null;
}

