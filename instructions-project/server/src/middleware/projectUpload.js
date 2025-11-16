import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, uploadFile } from '../services/supabaseStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware de upload para imagens de projeto
 * Suporta tanto Multer (local) quanto Supabase Storage
 * Salva imagens em /public/uploads/projects/{projectId}/day/ (local) ou Supabase Storage
 */
export function createProjectImageUpload(projectId) {
  // Se Supabase está configurado, usar memory storage para depois fazer upload
  if (isSupabaseConfigured()) {
    const storage = multer.memoryStorage();
    
    const fileFilter = (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      
      if (allowedTypes.test(ext) && file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas ficheiros de imagem (jpg, jpeg, png, webp) são permitidos'));
      }
    };

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max por imagem
      },
    }).array('images', 10);
  }

  // Fallback para Multer local (comportamento original)
  // Criar diretório específico do projeto para imagens de dia
  const projectUploadDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day`);
  if (!fs.existsSync(projectUploadDir)) {
    fs.mkdirSync(projectUploadDir, { recursive: true });
  }

  // Criar também a pasta night para preparar estrutura futura
  const projectNightDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/night`);
  if (!fs.existsSync(projectNightDir)) {
    fs.mkdirSync(projectNightDir, { recursive: true });
    console.log('📁 [PROJECT UPLOAD] Pasta night criada:', projectNightDir);
  }

  // Configuração de storage específica para projetos
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        if (!fs.existsSync(projectUploadDir)) {
          fs.mkdirSync(projectUploadDir, { recursive: true });
        }
        console.log('📁 [PROJECT UPLOAD] Destino:', projectUploadDir);
      } catch (e) {
        console.error('❌ [PROJECT UPLOAD] Falha ao criar diretório:', e?.message);
      }
      cb(null, projectUploadDir);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `img_${timestamp}_${baseName}${ext}`;
      console.log('📝 [PROJECT UPLOAD] Salvando arquivo:', fileName);
      cb(null, fileName);
    }
  });

  // Filtro de tipos de arquivo permitidos
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    if (allowedTypes.test(ext) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros de imagem (jpg, jpeg, png, webp) são permitidos'));
    }
  };

  // Configurar multer para múltiplos arquivos
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB max por imagem
    },
  }).array('images', 10); // Aceita até 10 imagens por vez
}

/**
 * Middleware de upload para imagens de noite
 * Suporta tanto Multer (local) quanto Supabase Storage
 * Salva imagens em /public/uploads/projects/{projectId}/night/ (local) ou Supabase Storage
 */
export function createProjectNightImageUpload(projectId) {
  // Se Supabase está configurado, usar memory storage
  if (isSupabaseConfigured()) {
    const storage = multer.memoryStorage();
    
    const fileFilter = (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      
      if (allowedTypes.test(ext) && file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas ficheiros de imagem (jpg, jpeg, png, webp) são permitidos'));
      }
    };

    return multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB max
      },
    }).single('nightImage');
  }

  // Fallback para Multer local (comportamento original)
  // Criar diretório específico do projeto para imagens de noite
  const projectNightDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/night`);
  if (!fs.existsSync(projectNightDir)) {
    fs.mkdirSync(projectNightDir, { recursive: true });
  }

  // Configuração de storage específica para imagens de noite
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      try {
        if (!fs.existsSync(projectNightDir)) {
          fs.mkdirSync(projectNightDir, { recursive: true });
        }
        console.log('📁 [NIGHT UPLOAD] Destino:', projectNightDir);
      } catch (e) {
        console.error('❌ [NIGHT UPLOAD] Falha ao criar diretório:', e?.message);
      }
      cb(null, projectNightDir);
    },
    filename: function (req, file, cb) {
      // Usar o mesmo nome da imagem de dia se fornecido, senão gerar novo nome
      const originalFilename = req.body.dayImageFilename || file.originalname;
      const timestamp = Date.now();
      const ext = path.extname(originalFilename);
      const baseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `img_${timestamp}_${baseName}${ext}`;
      console.log('📝 [NIGHT UPLOAD] Salvando arquivo:', fileName);
      cb(null, fileName);
    }
  });

  // Filtro de tipos de arquivo permitidos
  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    if (allowedTypes.test(ext) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros de imagem (jpg, jpeg, png, webp) são permitidos'));
    }
  };

  // Configurar multer para um único arquivo
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 15 * 1024 * 1024, // 15MB max
    },
  }).single('nightImage');
}

/**
 * Middleware dinâmico que cria upload de imagem de noite baseado no projectId da rota
 * Suporta Supabase Storage se configurado
 */
export async function projectNightImageUploadMiddleware(req, res, next) {
  const projectId = req.params.id || req.body.projectId || 'temp';
  
  // Criar middleware de upload específico para este projeto
  const upload = createProjectNightImageUpload(projectId);
  
  upload(req, res, async function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            success: false,
            error: 'Ficheiro muito grande. Máximo: 15MB por imagem' 
          });
        }
        return res.status(400).json({ 
          success: false,
          error: err.message 
        });
      }
      return res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }

    // Se Supabase está configurado e há arquivo, fazer upload para Supabase
    if (isSupabaseConfigured() && req.file) {
      try {
        const timestamp = Date.now();
        const ext = path.extname(req.file.originalname);
        const baseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `img_${timestamp}_${baseName}${ext}`;
        const filePath = `projects/${projectId}/night/${fileName}`;

        const { url } = await uploadFile(req.file, 'projects', filePath, {
          contentType: req.file.mimetype
        });

        // Atualizar req.file com informações do Supabase
        req.file.filename = fileName;
        req.file.url = url;
        req.file.supabasePath = filePath;
      } catch (uploadError) {
        console.error('❌ [NIGHT UPLOAD] Erro ao fazer upload para Supabase:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao fazer upload para Supabase: ' + uploadError.message
        });
      }
    }

    next();
  });
}

/**
 * Middleware dinâmico que cria upload baseado no projectId da rota
 * Suporta Supabase Storage se configurado
 */
export async function projectImageUploadMiddleware(req, res, next) {
  const projectId = req.params.id || req.body.projectId || 'temp';
  
  // Criar middleware de upload específico para este projeto
  const upload = createProjectImageUpload(projectId);
  
  upload(req, res, async function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            success: false,
            error: 'Ficheiro muito grande. Máximo: 15MB por imagem' 
          });
        }
        return res.status(400).json({ 
          success: false,
          error: err.message 
        });
      }
      return res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }

    // Se Supabase está configurado e há arquivos, fazer upload para Supabase
    if (isSupabaseConfigured() && req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
          const fileName = `img_${timestamp}_${baseName}${ext}`;
          const filePath = `projects/${projectId}/day/${fileName}`;

          const { url } = await uploadFile(file, 'projects', filePath, {
            contentType: file.mimetype
          });

          // Atualizar file com informações do Supabase
          file.filename = fileName;
          file.url = url;
          file.supabasePath = filePath;
        }
      } catch (uploadError) {
        console.error('❌ [PROJECT UPLOAD] Erro ao fazer upload para Supabase:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao fazer upload para Supabase: ' + uploadError.message
        });
      }
    }

    next();
  });
}

