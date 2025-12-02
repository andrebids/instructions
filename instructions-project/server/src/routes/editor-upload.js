import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEditorUploadDir } from '../utils/pathUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory for editor image uploads
// Usa pathUtils para garantir caminho consistente independentemente de onde o servidor é iniciado
const uploadDir = getEditorUploadDir();

// Configure storage - sempre usar armazenamento local
const storage = multer.diskStorage({
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
router.post('/editor-image', upload.single('image'), function(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    const filename = req.file.filename;
    const fileUrl = `/uploads/editor/${filename}`;
    
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

