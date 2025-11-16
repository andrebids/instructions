import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isSupabaseConfigured, uploadFile } from '../services/supabaseStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory for editor image uploads (fallback local)
const uploadDir = path.resolve(process.cwd(), 'public/uploads/editor');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage - usar memory storage se Supabase estiver configurado
const storage = isSupabaseConfigured() 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          console.log('📁 [EDITOR UPLOAD] Destination:', uploadDir);
        } catch (e) {
          console.error('❌ [EDITOR UPLOAD] Failed to create upload directory:', e?.message);
        }
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `editor_${timestamp}_${baseName}${ext}`;
        console.log('📝 [EDITOR UPLOAD] Saving file:', fileName);
        cb(null, fileName);
      }
    });

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedTypes.test(ext) && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
  },
});

const router = express.Router();

// POST /api/upload/editor-image - Upload image for editor
router.post('/editor-image', upload.single('image'), async function(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    let fileUrl;
    let filename = req.file.filename;

    // Se Supabase está configurado, fazer upload para Supabase
    if (isSupabaseConfigured()) {
      try {
        const timestamp = Date.now();
        const ext = path.extname(req.file.originalname);
        const baseName = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        filename = `editor_${timestamp}_${baseName}${ext}`;
        const filePath = `editor/${filename}`;

        const { url } = await uploadFile(req.file, 'editor', filePath, {
          contentType: req.file.mimetype
        });

        fileUrl = url;
      } catch (uploadError) {
        console.error('❌ [EDITOR UPLOAD] Erro ao fazer upload para Supabase:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao fazer upload para Supabase: ' + uploadError.message
        });
      }
    } else {
      // Fallback para URL local
      fileUrl = `/uploads/editor/${filename}`;
    }
    
    console.log('✅ [EDITOR UPLOAD] Image uploaded:', {
      filename: filename,
      size: req.file.size,
      url: fileUrl
    });

    res.json({
      success: true,
      url: fileUrl,
      filename: filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error('❌ [EDITOR UPLOAD] Error uploading image:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to upload image' 
    });
  }
});

export default router;

