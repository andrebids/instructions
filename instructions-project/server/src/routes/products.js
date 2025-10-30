import express from 'express';
import * as productController from '../controllers/productController.js';
import { uploadProductImagesWithLimits } from '../middleware/upload.js';

const router = express.Router();

// Rotas de produtos
router.get('/source-images', productController.getSourceImages); // Deve vir antes de /search
router.get('/search', productController.search); // Deve vir antes de /:id
router.get('/', productController.getAll);
router.get('/:id', productController.getById);

// Criar produto com upload de imagens
router.post('/', uploadProductImagesWithLimits, productController.create);

// Atualizar produto com upload opcional de imagens
router.put('/:id', uploadProductImagesWithLimits, productController.update);

// Deletar produto (soft delete)
router.delete('/:id', productController.deleteProduct);

export default router;

