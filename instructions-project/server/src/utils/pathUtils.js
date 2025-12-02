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
  // Debug: verificar todas as variáveis de ambiente relacionadas
  console.log(`🔍 [PATHUTILS DEBUG] Verificando variáveis de ambiente:`);
  console.log(`   PRODUCTS_UPLOAD_PATH: ${process.env.PRODUCTS_UPLOAD_PATH || '(não definida)'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || '(não definida)'}`);
  console.log(`   Platform: ${process.platform}`);
  
  // 1. Verificar se existe caminho específico via variável de ambiente (sobrescreve tudo)
  const envProductsPath = process.env.PRODUCTS_UPLOAD_PATH;
  if (envProductsPath) {
    // Detectar se estamos dentro do Docker (verificando se /app existe)
    const isDocker = fs.existsSync('/app');
    
    // Normalizar caminho: se for caminho Windows UNC, manter; se for caminho Linux/Docker, usar como está
    // IMPORTANTE: Dentro do Docker, caminhos UNC são convertidos para o caminho montado equivalente
    let normalizedPath;
    if (process.platform === 'win32' && !isDocker) {
      // Windows (não Docker): manter caminhos UNC como estão
      normalizedPath = envProductsPath.replace(/\//g, '\\');
    } else {
      // Linux/Docker: se for caminho UNC, converter para caminho montado equivalente
      // Verificar se contém o caminho UNC específico (com ou sem barras duplas)
      console.log(`🔍 [PATHUTILS] Analisando caminho: ${envProductsPath}`);
      const uncPathPattern = /192\.168\.2\.22[\\\/]Olimpo[\\\/]\.dev[\\\/]web[\\\/]thecore[\\\/]products/i;
      const matchesUnc = uncPathPattern.test(envProductsPath);
      console.log(`🔍 [PATHUTILS] Caminho UNC detectado: ${matchesUnc}`);
      
      if (matchesUnc) {
        // Dentro do Docker, o caminho UNC está montado em /app/server/public/uploads
        normalizedPath = '/app/server/public/uploads/products';
        console.log(`🔄 [PATHUTILS] Convertendo caminho UNC para caminho Docker montado: ${normalizedPath}`);
        
        // Verificar se o diretório existe e listar conteúdo
        if (fs.existsSync(normalizedPath)) {
          try {
            const allFiles = fs.readdirSync(normalizedPath);
            const imageFiles = allFiles.filter(f => 
              !f.startsWith('temp_') && 
              (f.toLowerCase().endsWith('.webp') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'))
            );
            console.log(`📁 [PATHUTILS] Total de arquivos: ${allFiles.length}, Imagens (não temp): ${imageFiles.length}`);
            if (imageFiles.length > 0) {
              console.log(`📁 [PATHUTILS] Primeiras imagens reais: ${imageFiles.slice(0, 10).join(', ')}`);
            }
          } catch (e) {
            console.warn(`⚠️ [PATHUTILS] Erro ao listar arquivos: ${e.message}`);
          }
        }
      } else if (envProductsPath.startsWith('\\\\') || envProductsPath.startsWith('//')) {
        // Outro caminho UNC: tentar usar como está (pode não funcionar no Docker)
        normalizedPath = envProductsPath.replace(/\\/g, '/');
      } else {
        // Caminho normal (Linux/Docker): usar como está, apenas normalizar separadores
        normalizedPath = envProductsPath.replace(/\\/g, '/');
        // Se já é um caminho absoluto válido, usar diretamente
        if (!normalizedPath.startsWith('/')) {
          // Se não começa com /, pode ser relativo - não fazer nada por enquanto
        }
      }
    }
    
    console.log(`🔍 [PATHUTILS] PRODUCTS_UPLOAD_PATH encontrado na variável de ambiente: ${envProductsPath}`);
    console.log(`🔍 [PATHUTILS] Caminho normalizado: ${normalizedPath}`);
    console.log(`🔍 [PATHUTILS] Docker detectado: ${isDocker}`);
    
    if (fs.existsSync(normalizedPath)) {
      console.log(`✅ [PATHUTILS] Usando PRODUCTS_UPLOAD_PATH da variável de ambiente: ${normalizedPath}`);
      try {
        const files = fs.readdirSync(normalizedPath);
        const imageFiles = files.filter(f => 
          !f.startsWith('temp_') && 
          (f.toLowerCase().endsWith('.webp') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpeg'))
        );
        const tempFiles = files.filter(f => f.startsWith('temp_'));
        const dirs = files.filter(f => {
          try {
            return fs.statSync(path.join(normalizedPath, f)).isDirectory();
          } catch {
            return false;
          }
        });
        
        console.log(`📁 [PATHUTILS] Encontrados ${files.length} arquivos no diretório configurado`);
        console.log(`📁 [PATHUTILS]   - Imagens reais (não temp): ${imageFiles.length}`);
        console.log(`📁 [PATHUTILS]   - Arquivos temporários: ${tempFiles.length}`);
        console.log(`📁 [PATHUTILS]   - Subdiretórios: ${dirs.length}`);
        
        if (imageFiles.length > 0) {
          console.log(`📁 [PATHUTILS] Primeiras 10 imagens reais: ${imageFiles.slice(0, 10).join(', ')}`);
        } else {
          console.warn(`⚠️ [PATHUTILS] NENHUMA IMAGEM REAL ENCONTRADA! Apenas arquivos temporários.`);
          if (dirs.length > 0) {
            console.log(`📁 [PATHUTILS] Subdiretórios encontrados: ${dirs.join(', ')}`);
            // Verificar conteúdo dos subdiretórios
            for (const dir of dirs.slice(0, 3)) {
              try {
                const subFiles = fs.readdirSync(path.join(normalizedPath, dir));
                const subImages = subFiles.filter(f => 
                  !f.startsWith('temp_') && 
                  (f.toLowerCase().endsWith('.webp') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png'))
                );
                if (subImages.length > 0) {
                  console.log(`📁 [PATHUTILS]   Subdiretório "${dir}" tem ${subImages.length} imagens: ${subImages.slice(0, 5).join(', ')}`);
                }
              } catch (e) {
                // Ignorar erros ao listar subdiretórios
              }
            }
          }
          
          // Verificar também o diretório pai para ver se há outras pastas
          const parentDir = path.dirname(normalizedPath);
          if (fs.existsSync(parentDir)) {
            try {
              const parentFiles = fs.readdirSync(parentDir);
              const parentDirs = parentFiles.filter(f => {
                try {
                  return fs.statSync(path.join(parentDir, f)).isDirectory();
                } catch {
                  return false;
                }
              });
              console.log(`📁 [PATHUTILS] Diretório pai "${parentDir}" tem ${parentDirs.length} subdiretórios: ${parentDirs.join(', ')}`);
            } catch (e) {
              // Ignorar erros
            }
          }
        }
      } catch (listError) {
        console.warn(`⚠️ [PATHUTILS] Erro ao listar arquivos: ${listError.message}`);
      }
      return normalizedPath;
    } else {
      console.warn(`⚠️ [PATHUTILS] PRODUCTS_UPLOAD_PATH configurado mas não existe: ${normalizedPath}`);
      // Tentar o caminho Docker equivalente se estivermos no Docker
      const dockerPath = '/app/server/public/uploads/products';
      if (isDocker && fs.existsSync(dockerPath)) {
        console.log(`✅ [PATHUTILS] Usando caminho Docker equivalente: ${dockerPath}`);
        return dockerPath;
      }
      console.warn(`⚠️ [PATHUTILS] Tentando criar diretório...`);
      try {
        fs.mkdirSync(normalizedPath, { recursive: true });
        console.log(`✅ [PATHUTILS] Diretório criado: ${normalizedPath}`);
        return normalizedPath;
      } catch (error) {
        console.error(`❌ [PATHUTILS] Erro ao criar diretório: ${error.message}`);
        console.error(`❌ [PATHUTILS] Stack: ${error.stack}`);
      }
    }
  }

  // 2. Verificar caminho padrão de rede compartilhada para produtos (hardcoded - sempre o mesmo)
  // PRIORIDADE: Verificar primeiro o caminho com "Olimpo" que o usuário especificou
  const preferredNetworkPath = '\\\\192.168.2.22\\Olimpo\\.dev\\web\\thecore\\products';
  const defaultNetworkProductsPath = '\\\\192.168.2.22\\.dev\\web\\thecore\\products';
  
  // Verificar caminho preferido primeiro (com "Olimpo")
  if (process.platform === 'win32' && fs.existsSync(preferredNetworkPath)) {
    console.log(`✅ [PATHUTILS] Usando caminho preferido de rede compartilhada para produtos: ${preferredNetworkPath}`);
    try {
      const files = fs.readdirSync(preferredNetworkPath);
      console.log(`📁 [PATHUTILS] Encontrados ${files.length} arquivos no diretório`);
      if (files.length > 0) {
        console.log(`📁 [PATHUTILS] Primeiros 5 arquivos: ${files.slice(0, 5).join(', ')}`);
      }
    } catch (listError) {
      console.warn(`⚠️ [PATHUTILS] Erro ao listar arquivos: ${listError.message}`);
    }
    return preferredNetworkPath;
  }
  
  // Verificar caminho alternativo (sem "Olimpo")
  if (process.platform === 'win32' && fs.existsSync(defaultNetworkProductsPath)) {
    console.log(`✅ [PATHUTILS] Usando caminho padrão de rede compartilhada para produtos: ${defaultNetworkProductsPath}`);
    try {
      const files = fs.readdirSync(defaultNetworkProductsPath);
      console.log(`📁 [PATHUTILS] Encontrados ${files.length} arquivos no diretório`);
      if (files.length > 0) {
        console.log(`📁 [PATHUTILS] Primeiros 5 arquivos: ${files.slice(0, 5).join(', ')}`);
      }
    } catch (listError) {
      console.warn(`⚠️ [PATHUTILS] Erro ao listar arquivos: ${listError.message}`);
    }
    return defaultNetworkProductsPath;
  }

  // 3. Verificar se estamos dentro do Docker (caminho montado em /app/server/public/uploads)
  // O Docker monta \\192.168.2.22\Olimpo\.dev\web\thecore em /app/server/public/uploads
  // Então produtos devem estar em /app/server/public/uploads/products
  const dockerProductsPath = '/app/server/public/uploads/products';
  if (fs.existsSync(dockerProductsPath)) {
    console.log(`✅ [PATHUTILS] Detectado Docker - usando caminho montado: ${dockerProductsPath}`);
    try {
      const files = fs.readdirSync(dockerProductsPath);
      const imageFiles = files.filter(f => 
        !f.startsWith('temp_') && 
        (f.toLowerCase().endsWith('.webp') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpeg'))
      );
      const tempFiles = files.filter(f => f.startsWith('temp_'));
      const dirs = files.filter(f => {
        try {
          return fs.statSync(path.join(dockerProductsPath, f)).isDirectory();
        } catch {
          return false;
        }
      });
      
      console.log(`📁 [PATHUTILS] Encontrados ${files.length} arquivos no diretório Docker`);
      console.log(`📁 [PATHUTILS]   - Imagens reais (não temp): ${imageFiles.length}`);
      console.log(`📁 [PATHUTILS]   - Arquivos temporários: ${tempFiles.length}`);
      console.log(`📁 [PATHUTILS]   - Subdiretórios: ${dirs.length}`);
      
      if (imageFiles.length > 0) {
        console.log(`📁 [PATHUTILS] Primeiras 10 imagens reais: ${imageFiles.slice(0, 10).join(', ')}`);
      } else {
        console.warn(`⚠️ [PATHUTILS] NENHUMA IMAGEM REAL ENCONTRADA no diretório Docker!`);
        console.warn(`⚠️ [PATHUTILS] Apenas arquivos temporários encontrados.`);
        if (dirs.length > 0) {
          console.log(`📁 [PATHUTILS] Subdiretórios encontrados: ${dirs.join(', ')}`);
        }
        
        // Verificar também o diretório pai
        const parentDir = '/app/server/public/uploads';
        if (fs.existsSync(parentDir)) {
          try {
            const parentFiles = fs.readdirSync(parentDir);
            const parentDirs = parentFiles.filter(f => {
              try {
                return fs.statSync(path.join(parentDir, f)).isDirectory();
              } catch {
                return false;
              }
            });
            console.log(`📁 [PATHUTILS] Diretório pai "${parentDir}" tem ${parentDirs.length} subdiretórios: ${parentDirs.join(', ')}`);
          } catch (e) {
            // Ignorar erros
          }
        }
      }
    } catch (listError) {
      console.warn(`⚠️ [PATHUTILS] Erro ao listar arquivos no Docker: ${listError.message}`);
    }
    return dockerProductsPath;
  }

  // 4. Fallback: produtos dentro do diretório de uploads base
  const dir = path.join(getUploadsDir(), 'products');
  const normalizedDir = dir.replace(/\//g, path.sep);
  console.log(`🔍 [PATHUTILS] Usando fallback: ${normalizedDir}`);

  // Garantir que o diretório existe
  if (!fs.existsSync(normalizedDir)) {
    try {
      fs.mkdirSync(normalizedDir, { recursive: true });
      console.log(`✅ [PATHUTILS] Diretório de fallback criado: ${normalizedDir}`);
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
  // Se for caminho de produtos, SEMPRE usar getProductsUploadDir()
  // (não apenas quando PRODUCTS_UPLOAD_PATH está configurado)
  // Isso garante que produtos em rede compartilhada sejam encontrados
  if (relativePath.startsWith('/uploads/products/')) {
    // Preservar estrutura de subdiretórios após remover o prefixo
    // Exemplo: /uploads/products/SHOP/TRENDING/NIGHT/image.webp
    //          -> SHOP/TRENDING/NIGHT/image.webp
    const subPath = relativePath.replace(/^\/uploads\/products\//, '');
    const productsDir = getProductsUploadDir();
    const resolvedPath = path.join(productsDir, subPath);
    // Normalizar separadores para Windows
    return resolvedPath.replace(/\//g, path.sep);
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



