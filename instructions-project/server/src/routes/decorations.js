import express from 'express';
import * as decorationController from '../controllers/decorationController.js';

const router = express.Router();

// Rotas de decorações
router.get('/search', decorationController.search); // Deve vir antes de /:id
router.get('/categories', decorationController.getCategories);
router.get('/', decorationController.getAll);
router.get('/:id', decorationController.getById);

export default router;

