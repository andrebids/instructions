import express from 'express';
import * as productController from '../controllers/productController.js';
import { uploadProductImagesWithLimits } from '../middleware/upload.js';

const router = express.Router();

// Rotas de produtos
router.get('/source-images', productController.getSourceImages); // Deve vir antes de /search
router.get('/colors', productController.getAvailableColors); // Buscar cores disponíveis
router.get('/search', productController.search); // Deve vir antes de /:id
router.get('/', productController.getAll);
router.get('/:id/debug-media', productController.debugMedia);
router.get('/:id', productController.getById);

// Criar produto com upload de imagens
router.post('/', uploadProductImagesWithLimits, productController.create);

// Atualizar produto com upload opcional de imagens
router.put('/:id', uploadProductImagesWithLimits, productController.update);

// Arquivar produto (soft delete)
router.patch('/:id/archive', productController.archiveProduct);

// Desarquivar produto
router.patch('/:id/unarchive', productController.unarchiveProduct);

// Deletar produto permanentemente (hard delete)
router.delete('/:id', productController.deleteProduct);

export default router;

