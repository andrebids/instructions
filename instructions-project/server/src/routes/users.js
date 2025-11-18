import express from 'express';
import * as userController from '../controllers/userController.js';
import * as profileController from '../controllers/profileController.js';
import { requireAdmin } from '../middleware/roles.js';
import { requireAuth } from '../middleware/auth.js';
import { getAuth } from '../middleware/auth.js';

const router = express.Router();

// Debug: Log de todas as requisições para /api/users
router.use(async (req, res, next) => {
  const auth = await getAuth(req);
  console.log(`📋 [Users Route] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    userId: auth?.userId || 'not authenticated',
    fullPath: req.originalUrl
  });
  next();
});

// Rotas de perfil (não requerem admin, apenas autenticação)
router.put('/profile', requireAuth(), profileController.updateProfile);
router.post('/profile/avatar', requireAuth(), profileController.uploadAvatar, profileController.uploadAvatarImage);

// Todas as outras rotas requerem role admin
router.use(requireAdmin());

// Rotas de utilizadores
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.post('/invite', userController.sendInvitation);
router.put('/:id/role', userController.updateRole);
router.delete('/:id', userController.deleteUser);

export default router;

