/**
 * Serviço de upload de imagens para projetos
 */
import fs from 'fs';
import path from 'path';
import { Project } from '../models/index.js';
import { logUpload, logDebug, logError } from '../utils/projectLogger.js';
import { getProjectsUploadDir, getPublicDir, getUploadsDir } from '../utils/pathUtils.js';

/**
 * Processa arquivos uploadados e retorna informações das imagens
 * Usa apenas armazenamento local
 */
export function processUploadedFiles(files, projectId, cartouche = null) {
  return files.map((file, index) => {
    const imageId = `img-${Date.now()}-${index}`;
    // Usar URL local
    const imageUrl = `/uploads/projects/${projectId}/day/${file.filename}`;
    
    // Verificar se arquivo foi realmente salvo
    // Usa pathUtils para garantir caminho consistente
    const dayDir = getProjectsUploadDir(projectId, 'day');
    const filePath = path.join(dayDir, file.filename);
    const fileExists = fs.existsSync(filePath);
    
    // Verificar também o caminho completo do multer (file.path)
    const multerPath = file.path;
    const multerPathExists = multerPath ? fs.existsSync(multerPath) : false;
    
    const fileInfo = {
      filename: file.filename,
      originalname: file.originalname,
      multerPath: multerPath,
      multerPathExists: multerPathExists,
      expectedPath: filePath,
      expectedPathExists: fileExists,
      size: file.size,
      url: imageUrl,
      serverBaseDir: getPublicDir()
    };
    
    logUpload('Arquivo:', fileInfo);
    
    // Armazenar informações para retornar na resposta (para debug no cliente)
    file._uploadDebug = fileInfo;
    
    if (!fileExists && !multerPathExists) {
      logError('Arquivo não encontrado após upload!');
      logError('   Multer path:', multerPath);
      logError('   Expected path:', filePath);
      logError('   Server base dir:', getPublicDir());
      logError('   File object:', JSON.stringify({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        destination: file.destination
      }, null, 2));
      
      // Tentar listar o diretório para debug
      const dirPath = getProjectsUploadDir(projectId, 'day');
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        logDebug('   Arquivos no diretório:', files);
      } else {
        logError('   Diretório não existe:', dirPath);
        // Tentar criar o diretório
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          logUpload('   ✅ Diretório criado:', dirPath);
        } catch (e) {
          logError('   ❌ Erro ao criar diretório:', e.message);
        }
      }
    } else if (multerPathExists && !fileExists) {
      // Arquivo está em local diferente do esperado - usar o caminho do multer
      logUpload('⚠️ Arquivo salvo em local diferente do esperado');
      logUpload('   Multer path (existe):', multerPath);
      logUpload('   Expected path (não existe):', filePath);
      logUpload('   Usando caminho do multer para URL');
      
      // Ajustar URL para usar o caminho relativo do multer
      const publicDir = getPublicDir();
      const relativePath = multerPath.replace(publicDir, '');
      const adjustedUrl = relativePath.replace(/\\/g, '/'); // Normalizar separadores
      return {
        id: imageId,
        name: file.originalname,
        originalUrl: adjustedUrl,
        thumbnail: adjustedUrl,
        dayVersion: adjustedUrl,
        nightVersion: null,
        conversionStatus: 'pending',
        uploadedAt: new Date().toISOString(),
        cartouche: cartouche ? JSON.parse(cartouche) : null,
        _debug: { multerPath, expectedPath: filePath }
      };
    }
    
    return {
      id: imageId,
      name: file.originalname,
      originalUrl: imageUrl,
      thumbnail: imageUrl, // Por enquanto usar a mesma URL, pode gerar thumbnail depois
      dayVersion: imageUrl,
      nightVersion: null, // Será preenchido após conversão via API
      conversionStatus: 'pending',
      uploadedAt: new Date().toISOString(),
      // Metadados do cartouche (se fornecidos no body)
      cartouche: cartouche ? JSON.parse(cartouche) : null
    };
  });
}

/**
 * Coleta informações de debug do upload
 */
export function collectUploadDebugInfo(files, projectId) {
  const dayDir = getProjectsUploadDir(projectId, 'day');
  const uploadDebugInfo = files.map((f) => {
    const expectedPath = path.join(dayDir, f.filename);
    const fileDebug = f._uploadDebug || {
      filename: f.filename,
      originalname: f.originalname,
      multerPath: f.path,
      multerPathExists: f.path ? fs.existsSync(f.path) : false,
      expectedPath: expectedPath,
      expectedPathExists: fs.existsSync(expectedPath),
      size: f.size,
      url: `/uploads/projects/${projectId}/day/${f.filename}`,
      serverBaseDir: getPublicDir()
    };
    return fileDebug;
  });

  // Incluir informações de debug na resposta (sempre incluir para diagnóstico)
  const projectDayDir = getProjectsUploadDir(projectId, 'day');
  const publicDir = getPublicDir();
  const uploadsDir = getUploadsDir();
  const debugInfo = {
    uploadDebug: uploadDebugInfo,
    serverBaseDir: publicDir,
    publicDir: publicDir,
    publicDirExists: fs.existsSync(publicDir),
    uploadsDir: uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir),
    projectDayDir: projectDayDir,
    projectDayDirExists: fs.existsSync(projectDayDir),
    filesInDayDir: fs.existsSync(projectDayDir) 
      ? fs.readdirSync(projectDayDir)
      : [],
    filesCount: files ? files.length : 0
  };

  logDebug('Debug info preparado:', {
    uploadDebugCount: debugInfo.uploadDebug.length,
    filesInDayDir: debugInfo.filesInDayDir.length,
    projectDayDirExists: debugInfo.projectDayDirExists
  });

  return debugInfo;
}

/**
 * Valida e processa upload de imagens
 */
export async function handleImageUpload(projectId, files, cartouche = null) {
  // Verificar se projeto existe
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  // Processar arquivos
  const uploadedImages = processUploadedFiles(files, projectId, cartouche);
  
  logUpload('Imagens uploadadas:', uploadedImages.length, 'para projeto:', projectId);

  // Coletar informações de debug
  const debugInfo = collectUploadDebugInfo(files, projectId);

  return {
    images: uploadedImages,
    debug: debugInfo
  };
}

/**
 * Debug: verifica arquivos de imagens de um projeto
 */
export function debugProjectImageFiles(projectId) {
  const dayDir = getProjectsUploadDir(projectId, 'day');
  const nightDir = getProjectsUploadDir(projectId, 'night');
  const publicDir = getPublicDir();
  const uploadsDir = getUploadsDir();
  
  const dayFiles = fs.existsSync(dayDir) ? fs.readdirSync(dayDir).map(f => {
    const filePath = path.join(dayDir, f);
    const stats = fs.statSync(filePath);
    return {
      name: f,
      size: stats.size,
      modified: stats.mtime,
      url: `/uploads/projects/${projectId}/day/${f}`,
      apiUrl: `/api/uploads/projects/${projectId}/day/${f}`
    };
  }) : [];
  const nightFiles = fs.existsSync(nightDir) ? fs.readdirSync(nightDir) : [];
  
  return {
    projectId,
    serverBaseDir: publicDir,
    dayDir,
    dayDirExists: fs.existsSync(dayDir),
    dayFiles,
    nightDir,
    nightDirExists: fs.existsSync(nightDir),
    nightFiles,
    staticPublic: publicDir,
    staticPublicExists: fs.existsSync(publicDir),
    uploadsDir,
    uploadsDirExists: fs.existsSync(uploadsDir),
    env: process.env.NODE_ENV || 'development'
  };
}

