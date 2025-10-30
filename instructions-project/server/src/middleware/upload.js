import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Diretório de destino para uploads de produtos
var uploadDir = path.resolve(process.cwd(), 'public/uploads/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de storage
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    var productId = req.body.productId || req.params.productId || 'temp';
    var timestamp = Date.now();
    var ext = path.extname(file.originalname);
    var baseName = path.basename(file.originalname, ext);
    var fieldName = file.fieldname;
    var fileName = productId + '_' + fieldName + '_' + timestamp + ext;
    cb(null, fileName);
  }
});

// Filtro de tipos de ficheiro permitidos
function fileFilter(req, file, cb) {
  var allowedImageTypes = /jpeg|jpg|png|webp/;
  var allowedVideoTypes = /webm|mp4/;
  var ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (file.fieldname === 'animation') {
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
}

// Configuração de limites
var limits = {
  fileSize: 10 * 1024 * 1024, // 10MB para imagens por padrão
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
  { name: 'thumbnail', maxCount: 1 },
]);

// Middleware customizado para aplicar limites diferentes por tipo
function uploadProductImagesWithLimits(req, res, next) {
  var imageLimit = 10 * 1024 * 1024; // 10MB para imagens
  var videoLimit = 50 * 1024 * 1024; // 50MB para vídeos
  
  var multerInstance = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
      var allowedImageTypes = /jpeg|jpg|png|webp/;
      var allowedVideoTypes = /webm|mp4/;
      var ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      
      if (file.fieldname === 'animation') {
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
    { name: 'thumbnail', maxCount: 1 },
  ]);
  
  uploadFields(req, res, function(err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Ficheiro muito grande. Máximo: 10MB para imagens, 50MB para vídeos' });
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
    
    next();
  });
}

export { uploadProductImages, uploadProductImagesWithLimits, uploadDir };

