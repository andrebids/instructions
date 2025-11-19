import express from 'express';
import * as userController from '../controllers/userController.js';
import * as profileController from '../controllers/profileController.js';
import { requireAdmin } from '../middleware/roles.js';
import { requireAuth } from '../middleware/auth.js';
import { getAuth } from '../middleware/auth.js';
import { passwordUpdateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Debug: Log de todas as requisições para /api/users
router.use(async (req, res, next) => {
  const auth = await getAuth(req);
  console.log(`📋 [Users Route] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.body ? {
      ...req.body,
      password: req.body.password ? `[${req.body.password.length} caracteres]` : undefined
    } : req.body,
    userId: auth?.userId || 'not authenticated',
    userRole: auth?.role || 'not authenticated',
    fullPath: req.originalUrl,
    headers: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      'content-type': req.headers['content-type']
    }
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
router.post('/:id/avatar', profileController.uploadAvatar, userController.uploadUserAvatar);
// Rotas de atualização (específicas primeiro)
router.put('/:id/password', passwordUpdateLimiter, userController.updatePassword);

router.put('/:id/email', userController.updateEmail);
router.put('/:id/profile', userController.updateProfile);
router.put('/:id/role', userController.updateRole);
// IMPORTANTE: A rota PUT /:id deve vir ANTES do DELETE /:id para evitar conflitos
router.put('/:id', userController.update); // Atualização geral (deve vir por último)
router.delete('/:id', userController.deleteUser);

export default router;

