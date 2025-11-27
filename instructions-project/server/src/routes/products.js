import express from 'express';
import * as productController from '../controllers/productController.js';
import { uploadProductImagesWithLimits } from '../middleware/upload.js';
import { requireEditorStockOrAdmin } from '../middleware/roles.js';

const router = express.Router();

// Rotas de produtos
router.get('/source-images', productController.getSourceImages); // Deve vir antes de /search
router.get('/trending', productController.getTrending); // Trending products (optimized)
router.get('/colors', productController.getAvailableColors); // Buscar cores disponíveis
router.get('/categories', productController.getCategories); // Buscar categorias disponíveis
router.get('/search', productController.search); // Deve vir antes de /:id
router.get('/', productController.getAll);
router.get('/:id/debug-media', productController.debugMedia);
router.get('/:id', productController.getById);

// Criar produto com upload de imagens (apenas admin e editor_stock)
router.post('/', requireEditorStockOrAdmin(), uploadProductImagesWithLimits, productController.create);

// Atualizar produto com upload opcional de imagens (apenas admin e editor_stock)
router.put('/:id', requireEditorStockOrAdmin(), uploadProductImagesWithLimits, productController.update);

// Arquivar produto (soft delete) (apenas admin e editor_stock)
router.patch('/:id/archive', requireEditorStockOrAdmin(), productController.archiveProduct);

// Desarquivar produto (apenas admin e editor_stock)
router.patch('/:id/unarchive', requireEditorStockOrAdmin(), productController.unarchiveProduct);

// Deletar produto permanentemente (hard delete) (apenas admin e editor_stock)
router.delete('/:id', requireEditorStockOrAdmin(), productController.deleteProduct);

export default router;

