import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware de upload para imagens de projeto
 * Salva imagens em /public/uploads/projects/{projectId}/day/
 */
export function createProjectImageUpload(projectId) {
  // Criar diretório específico do projeto
  const projectUploadDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day`);
  if (!fs.existsSync(projectUploadDir)) {
    fs.mkdirSync(projectUploadDir, { recursive: true });
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
 * Middleware dinâmico que cria upload baseado no projectId da rota
 */
export function projectImageUploadMiddleware(req, res, next) {
  const projectId = req.params.id || req.body.projectId || 'temp';
  
  // Criar middleware de upload específico para este projeto
  const upload = createProjectImageUpload(projectId);
  
  upload(req, res, function(err) {
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
    next();
  });
}

