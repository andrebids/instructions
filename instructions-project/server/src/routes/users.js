import express from 'express';
import * as userController from '../controllers/userController.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Todas as rotas requerem role admin
router.use(requireAdmin());

// Rotas de utilizadores
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.post('/invite', userController.sendInvitation);
router.put('/:id/role', userController.updateRole);
router.delete('/:id', userController.deleteUser);

export default router;

