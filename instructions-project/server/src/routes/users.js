import express from 'express';
import * as userController from '../controllers/userController.js';
import { requireAdmin } from '../middleware/roles.js';
import { getAuth } from '@clerk/express';

const router = express.Router();

// Debug: Log de todas as requisições para /api/users
router.use((req, res, next) => {
  const auth = getAuth(req);
  console.log(`📋 [Users Route] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    userId: auth?.userId || 'not authenticated',
    fullPath: req.originalUrl
  });
  next();
});

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

