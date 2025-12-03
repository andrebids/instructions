import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getProductsUploadDir } from '../utils/pathUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de destino para uploads de produtos
// Usa pathUtils para garantir caminho consistente independentemente de onde o servidor é iniciado
var uploadDir = getProductsUploadDir();

// Configuração de storage
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 [UPLOAD] Destino definido:', uploadDir);
    } catch (e) {
      console.error('❌ [UPLOAD] Falha ao garantir diretório de upload:', e?.message);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    var timestamp = Date.now();
    var ext = path.extname(file.originalname);
    var baseName = path.basename(file.originalname, ext);
    // Sanitizar nome: remover caracteres especiais, manter apenas letras, números, hífens e underscores
    var sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    // Se o nome sanitizado ficar vazio, usar um nome padrão baseado no fieldname
    if (!sanitizedName || sanitizedName.length === 0) {
      sanitizedName = file.fieldname || 'file';
    }
    var fileName = sanitizedName + '-' + timestamp + ext;
    try {
      console.log('📝 [UPLOAD] Gerando nome de arquivo:', {
        field: file.fieldname,
        original: file.originalname,
        sanitized: sanitizedName,
        mime: file.mimetype,
        size: file.size,
        savedAs: fileName,
      });
    } catch(_) {}
    cb(null, fileName);
  }
});

// Filtro de tipos de ficheiro permitidos
function fileFilter(req, file, cb) {
  var allowedImageTypes = /jpeg|jpg|png|webp/;
  var allowedVideoTypes = /webm|mp4/;
  var ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (file.fieldname === 'animation' || file.fieldname === 'animationSimulation') {
    if (allowedVideoTypes.test(ext)) {
      console.log('✅ [UPLOAD] Vídeo aceite:', file.originalname);
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros de vídeo (webm, mp4) são permitidos para animação'));
    }
  } else {
    if (allowedImageTypes.test(ext)) {
      console.log('✅ [UPLOAD] Imagem aceite:', file.originalname);
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros de imagem (jpg, jpeg, png, webp) são permitidos'));
    }
  }
}

// Configuração de limites
var limits = {
  fileSize: 15 * 1024 * 1024, // 15MB para imagens por padrão
};

// Middleware para upload de imagens de produto
var uploadProductImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).fields([
  { name: 'dayImage', maxCount: 1 },
  { name: 'nightImage', maxCount: 1 },
  { name: 'animation', maxCount: 1 },
  { name: 'animationSimulation', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Middleware customizado para aplicar limites diferentes por tipo
function uploadProductImagesWithLimits(req, res, next) {
  var imageLimit = 15 * 1024 * 1024; // 15MB para imagens
  var videoLimit = 50 * 1024 * 1024; // 50MB para vídeos
  
  var multerInstance = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
      var allowedImageTypes = /jpeg|jpg|png|webp/;
      var allowedVideoTypes = /webm|mp4/;
      var ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      
      if (file.fieldname === 'animation' || file.fieldname === 'animationSimulation') {
        if (allowedVideoTypes.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas ficheiros de vídeo (webm, mp4) são permitidos para animação'));
        }
      } else {
        if (allowedImageTypes.test(ext)) {
          cb(null, true);
        } else {
          cb(new Error('Apenas ficheiros de imagem (jpg, jpeg, png, webp) são permitidos'));
        }
      }
    },
    limits: {
      fileSize: imageLimit,
    },
  });
  
  var uploadFields = multerInstance.fields([
    { name: 'dayImage', maxCount: 1 },
    { name: 'nightImage', maxCount: 1 },
    { name: 'animation', maxCount: 1 },
    { name: 'animationSimulation', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]);
  
  uploadFields(req, res, function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Ficheiro muito grande. Máximo: 15MB para imagens, 50MB para vídeos' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    
    // Verificar tamanho de vídeos manualmente
    if (req.files && req.files.animation && req.files.animation[0]) {
      if (req.files.animation[0].size > videoLimit) {
        return res.status(400).json({ error: 'Vídeo muito grande. Máximo: 50MB' });
      }
    }
    
    if (req.files && req.files.animationSimulation && req.files.animationSimulation[0]) {
      if (req.files.animationSimulation[0].size > videoLimit) {
        return res.status(400).json({ error: 'Vídeo de simulação muito grande. Máximo: 50MB' });
      }
    }
    
    next();
  });
}

export { uploadProductImages, uploadProductImagesWithLimits, uploadDir };

