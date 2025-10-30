import express from 'express';
import * as projectController from '../controllers/projectController.js';

const router = express.Router();

// Rotas de projetos
router.get('/stats', projectController.getStats); // Deve vir antes de /:id
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.deleteProject);
router.patch('/:id/status', projectController.updateStatus);
router.patch('/:id/favorite', projectController.toggleFavorite);
router.patch('/:id/canvas', projectController.updateCanvas); // Nova rota para atualizar canvas

export default router;

