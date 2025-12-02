/**
 * Utilitário para resolver caminhos de forma consistente
 * Usa __dirname em vez de process.cwd() para garantir caminhos consistentes
 * independentemente de onde o servidor é iniciado
 * 
 * Suporta caminhos UNC (network shares) via variáveis de ambiente:
 * - UPLOADS_BASE_PATH: Caminho base para todos os uploads (ex: \\192.168.2.22\.dev\web\thecore)
 * - PRODUCTS_UPLOAD_PATH: Caminho específico para produtos (ex: \\192.168.2.22\.dev\web\thecore\products)
 * - PROJECTS_UPLOAD_PATH: Caminho específico para projetos
 * - EDITOR_UPLOAD_PATH: Caminho específico para editor
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Retorna o diretório base do servidor (onde está o package.json do servidor)
 * Exemplo: /path/to/instructions-project/server
 */
export function getServerBaseDir() {
  return path.resolve(__dirname, '../..');
}

/**
 * Retorna o caminho para o diretório public do servidor
 * Exemplo: /path/to/instructions-project/server/public
 */
export function getPublicDir() {
  return path.resolve(getServerBaseDir(), 'public');
}

/**
 * Retorna o caminho para o diretório de uploads
 * 
 * PRIORIDADE:
 * 1. Variável de ambiente UPLOADS_BASE_PATH (se definida)
 * 2. Caminho padrão de rede compartilhada (hardcoded)
 * 3. Caminho local padrão (fallback)
 * 
 * Exemplo: /path/to/instructions-project/server/public/uploads
 * ou: \\192.168.2.22\.dev\web\thecore (padrão de rede compartilhada)
 */
export function getUploadsDir() {
  // 1. Verificar se existe caminho base configurado via variável de ambiente (sobrescreve tudo)
  const envBasePath = process.env.UPLOADS_BASE_PATH;
  if (envBasePath) {
    const normalizedPath = envBasePath.replace(/\//g, '\\');
    if (fs.existsSync(normalizedPath)) {
      console.log(`📁 [PATHUTILS] Usando UPLOADS_BASE_PATH da variável de ambiente: ${normalizedPath}`);
      return normalizedPath;
    } else {
      console.warn(`⚠️ [PATHUTILS] UPLOADS_BASE_PATH configurado mas não existe: ${normalizedPath}`);
    }
  }

  // 2. Caminho padrão de rede compartilhada (hardcoded - sempre o mesmo para todos)
  const defaultNetworkPath = '\\\\192.168.2.22\\.dev\\web\\thecore';
  if (fs.existsSync(defaultNetworkPath)) {
    console.log(`📁 [PATHUTILS] Usando caminho padrão de rede compartilhada: ${defaultNetworkPath}`);
    return defaultNetworkPath;
  }

  // 3. Fallback: caminho padrão local
  const localPath = path.resolve(getPublicDir(), 'uploads');
  console.log(`📁 [PATHUTILS] Usando caminho local padrão: ${localPath}`);
  return localPath;
}

/**
 * Retorna o caminho para uploads de produtos
 * 
 * PRIORIDADE:
 * 1. Variável de ambiente PRODUCTS_UPLOAD_PATH (se definida)
 * 2. Caminho padrão de rede compartilhada para produtos (hardcoded)
 * 3. Caminho dentro do diretório de uploads base
 * 
 * Exemplo: /path/to/instructions-project/server/public/uploads/products
 * ou: \\192.168.2.22\.dev\web\thecore\products (padrão de rede compartilhada)
 */
export function getProductsUploadDir() {
  // 1. Verificar se existe caminho específico via variável de ambiente (sobrescreve tudo)
  const envProductsPath = process.env.PRODUCTS_UPLOAD_PATH;
  if (envProductsPath) {
    const normalizedPath = envProductsPath.replace(/\//g, '\\');
    if (fs.existsSync(normalizedPath)) {
      console.log(`📁 [PATHUTILS] Usando PRODUCTS_UPLOAD_PATH da variável de ambiente: ${normalizedPath}`);
      return normalizedPath;
    } else {
      console.warn(`⚠️ [PATHUTILS] PRODUCTS_UPLOAD_PATH configurado mas não existe: ${normalizedPath}`);
      console.warn(`⚠️ [PATHUTILS] Tentando criar diretório...`);
      try {
        fs.mkdirSync(normalizedPath, { recursive: true });
        console.log(`✅ [PATHUTILS] Diretório criado: ${normalizedPath}`);
        return normalizedPath;
      } catch (error) {
        console.error(`❌ [PATHUTILS] Erro ao criar diretório: ${error.message}`);
      }
    }
  }

  // 2. Caminho padrão de rede compartilhada para produtos (hardcoded - sempre o mesmo)
  const defaultNetworkProductsPath = '\\\\192.168.2.22\\.dev\\web\\thecore\\products';
  if (fs.existsSync(defaultNetworkProductsPath)) {
    console.log(`📁 [PATHUTILS] Usando caminho padrão de rede compartilhada para produtos: ${defaultNetworkProductsPath}`);
    return defaultNetworkProductsPath;
  }

  // 3. Fallback: produtos dentro do diretório de uploads base
  const dir = path.join(getUploadsDir(), 'products');
  const normalizedDir = dir.replace(/\//g, path.sep);

  // Garantir que o diretório existe
  if (!fs.existsSync(normalizedDir)) {
    try {
      fs.mkdirSync(normalizedDir, { recursive: true });
    } catch (error) {
      console.error(`❌ [PATHUTILS] Erro ao criar diretório de produtos: ${error.message}`);
    }
  }
  return normalizedDir;
}

/**
 * Retorna o caminho para uploads de projetos
 * 
 * PRIORIDADE:
 * 1. Variável de ambiente PROJECTS_UPLOAD_PATH (se definida - para casos especiais)
 * 2. Caminho padrão de rede compartilhada para projetos (hardcoded - sempre o mesmo)
 * 3. Caminho dentro do diretório de uploads base
 * 
 * @param {string} projectId - ID do projeto (opcional)
 * @param {string} subfolder - Subpasta (ex: 'day', 'night', 'preview')
 * @returns {string} Caminho completo
 */
export function getProjectsUploadDir(projectId = null, subfolder = null) {
  // 1. Verificar se existe caminho específico via variável de ambiente (sobrescreve tudo)
  const envProjectsPath = process.env.PROJECTS_UPLOAD_PATH;
  let base;

  if (envProjectsPath) {
    base = envProjectsPath.replace(/\//g, '\\');
    if (fs.existsSync(base)) {
      console.log(`📁 [PATHUTILS] Usando PROJECTS_UPLOAD_PATH da variável de ambiente: ${base}`);
    } else {
      console.warn(`⚠️ [PATHUTILS] PROJECTS_UPLOAD_PATH configurado mas não existe: ${base}`);
      try {
        fs.mkdirSync(base, { recursive: true });
        console.log(`✅ [PATHUTILS] Diretório criado: ${base}`);
      } catch (error) {
        console.error(`❌ [PATHUTILS] Erro ao criar diretório: ${error.message}`);
        base = null; // Vai para fallback
      }
    }
  }

  // 2. Caminho padrão de rede compartilhada para projetos (hardcoded - sempre o mesmo)
  if (!base) {
    const defaultNetworkProjectsPath = '\\\\192.168.2.22\\.dev\\web\\thecore\\projects';
    if (fs.existsSync(defaultNetworkProjectsPath)) {
      console.log(`📁 [PATHUTILS] Usando caminho padrão de rede compartilhada para projetos: ${defaultNetworkProjectsPath}`);
      base = defaultNetworkProjectsPath;
    } else {
      // 3. Fallback: projetos dentro do diretório de uploads base
      base = path.join(getUploadsDir(), 'projects');
    }
  }

  // Normalizar separadores
  base = base.replace(/\//g, path.sep);

  if (projectId) {
    const projectDir = path.join(base, projectId);
    if (subfolder) {
      const subDir = path.join(projectDir, subfolder);
      // Garantir que o diretório existe
      if (!fs.existsSync(subDir)) {
        try {
          fs.mkdirSync(subDir, { recursive: true });
        } catch (error) {
          console.error(`❌ [PATHUTILS] Erro ao criar diretório de projeto: ${error.message}`);
        }
      }
      return subDir;
    }
    // Garantir que o diretório existe
    if (!fs.existsSync(projectDir)) {
      try {
        fs.mkdirSync(projectDir, { recursive: true });
      } catch (error) {
        console.error(`❌ [PATHUTILS] Erro ao criar diretório de projeto: ${error.message}`);
      }
    }
    return projectDir;
  }

  // Garantir que o diretório base existe
  if (!fs.existsSync(base)) {
    try {
      fs.mkdirSync(base, { recursive: true });
    } catch (error) {
      console.error(`❌ [PATHUTILS] Erro ao criar diretório base de projetos: ${error.message}`);
    }
  }
  return base;
}

/**
 * Retorna o caminho para uploads do editor
 * Verifica primeiro se existe EDITOR_UPLOAD_PATH nas variáveis de ambiente
 * Exemplo: /path/to/instructions-project/server/public/uploads/editor
 * ou: \\192.168.2.22\.dev\web\thecore\editor (se EDITOR_UPLOAD_PATH estiver definido)
 */
export function getEditorUploadDir() {
  // Verificar se existe caminho específico para editor configurado via variável de ambiente
  const editorPath = process.env.EDITOR_UPLOAD_PATH;
  if (editorPath) {
    // Normalizar caminho UNC (Windows)
    const normalizedPath = editorPath.replace(/\//g, '\\');
    if (!fs.existsSync(normalizedPath)) {
      console.warn(`⚠️ [PATHUTILS] EDITOR_UPLOAD_PATH configurado mas não existe: ${normalizedPath}`);
      console.warn(`⚠️ [PATHUTILS] Tentando criar diretório...`);
      try {
        fs.mkdirSync(normalizedPath, { recursive: true });
        console.log(`✅ [PATHUTILS] Diretório criado: ${normalizedPath}`);
      } catch (error) {
        console.error(`❌ [PATHUTILS] Erro ao criar diretório: ${error.message}`);
        console.warn(`⚠️ [PATHUTILS] Usando caminho padrão local`);
      }
    } else {
      console.log(`📁 [PATHUTILS] Usando caminho de rede compartilhada para editor: ${normalizedPath}`);
      return normalizedPath;
    }
  }

  // Caminho padrão: editor dentro do diretório de uploads base
  const dir = path.join(getUploadsDir(), 'editor');
  // Normalizar separadores
  const normalizedDir = dir.replace(/\//g, path.sep);

  // Garantir que o diretório existe
  if (!fs.existsSync(normalizedDir)) {
    try {
      fs.mkdirSync(normalizedDir, { recursive: true });
    } catch (error) {
      console.error(`❌ [PATHUTILS] Erro ao criar diretório de editor: ${error.message}`);
    }
  }
  return normalizedDir;
}

/**
 * Resolve um caminho relativo a partir do diretório public
 * Suporta caminhos de produtos que podem estar em rede compartilhada
 * @param {string} relativePath - Caminho relativo (ex: '/uploads/products/image.jpg')
 * @returns {string} Caminho absoluto completo
 */
export function resolvePublicPath(relativePath) {
  // Se for caminho de produtos e existir PRODUCTS_UPLOAD_PATH configurado
  if (relativePath.startsWith('/uploads/products/') && process.env.PRODUCTS_UPLOAD_PATH) {
    const filename = path.basename(relativePath);
    const productsDir = getProductsUploadDir();
    return path.join(productsDir, filename);
  }

  // Se for caminho de projetos e existir PROJECTS_UPLOAD_PATH configurado
  if (relativePath.startsWith('/uploads/projects/') && process.env.PROJECTS_UPLOAD_PATH) {
    // Extrair projectId e subfolder do caminho
    const parts = relativePath.replace('/uploads/projects/', '').split('/');
    if (parts.length >= 2) {
      const projectId = parts[0];
      const subfolder = parts[1];
      const filename = parts[parts.length - 1];
      const projectDir = getProjectsUploadDir(projectId, subfolder);
      return path.join(projectDir, filename);
    }
  }

  // Caminho padrão: remover barra inicial e resolver a partir do public
  const normalized = relativePath.replace(/^\//, '');
  const resolved = path.resolve(getPublicDir(), normalized);
  // Normalizar separadores para Windows
  return resolved.replace(/\//g, path.sep);
}



