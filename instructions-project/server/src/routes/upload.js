import express from 'express';
import { uploadProductImagesWithLimits } from '../middleware/upload.js';

const router = express.Router();

// POST /api/upload/product-images - Upload de imagens de produto
router.post('/product-images', uploadProductImagesWithLimits, function(req, res) {
  try {
    var files = req.files || {};
    var uploadedFiles = {};
    
    if (files.dayImage && files.dayImage[0]) {
      uploadedFiles.dayImage = {
        url: '/uploads/products/' + files.dayImage[0].filename,
        filename: files.dayImage[0].filename,
        size: files.dayImage[0].size,
      };
    }
    
    if (files.nightImage && files.nightImage[0]) {
      uploadedFiles.nightImage = {
        url: '/uploads/products/' + files.nightImage[0].filename,
        filename: files.nightImage[0].filename,
        size: files.nightImage[0].size,
      };
    }
    
    if (files.animation && files.animation[0]) {
      uploadedFiles.animation = {
        url: '/uploads/products/' + files.animation[0].filename,
        filename: files.animation[0].filename,
        size: files.animation[0].size,
      };
    }
    
    if (files.thumbnail && files.thumbnail[0]) {
      uploadedFiles.thumbnail = {
        url: '/uploads/products/' + files.thumbnail[0].filename,
        filename: files.thumbnail[0].filename,
        size: files.thumbnail[0].size,
      };
    }
    
    if (files.colorImages && files.colorImages.length > 0) {
      uploadedFiles.colorImages = [];
      for (var i = 0; i < files.colorImages.length; i++) {
        var colorFile = files.colorImages[i];
        uploadedFiles.colorImages.push({
          url: '/uploads/products/' + colorFile.filename,
          filename: colorFile.filename,
          size: colorFile.size,
          fieldname: colorFile.fieldname,
        });
      }
    }
    
    res.json({
      success: true,
      files: uploadedFiles,
      message: 'Imagens enviadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagens:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

