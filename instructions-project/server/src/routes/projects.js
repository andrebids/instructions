import express from 'express';
import rateLimit from 'express-rate-limit';
import * as projectController from '../controllers/projectController.js';
import { projectImageUploadMiddleware } from '../middleware/projectUpload.js';

const router = express.Router();

// Rate limiting específico para atualizações de projetos (prevenir spam)
const updateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requisições por minuto por IP
  message: 'Muitas atualizações. Por favor, aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting mais restritivo para atualizações de description (notas)
// Middleware customizado que só aplica rate limit se for atualização de description
const notesUpdateRateLimiter = (req, res, next) => {
  // Só aplicar rate limit se for atualização de description
  if (req.method === 'PUT' && req.body.description !== undefined) {
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 20, // máximo 20 atualizações de notas por minuto por IP
      message: 'Muitas atualizações de notas. Por favor, aguarde um momento.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    return limiter(req, res, next);
  }
  // Se não for atualização de description, passar direto
  next();
};

// Rotas de projetos
router.get('/stats', projectController.getStats); // Deve vir antes de /:id
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
// Aplicar rate limiting nas atualizações
router.put('/:id', updateRateLimiter, notesUpdateRateLimiter, projectController.update);
router.delete('/:id', projectController.deleteProject);
router.patch('/:id/status', projectController.updateStatus);
router.patch('/:id/favorite', projectController.toggleFavorite);
router.patch('/:id/canvas', projectController.updateCanvas); // Nova rota para atualizar canvas
router.post('/:id/images/upload', projectImageUploadMiddleware, projectController.uploadImages); // Upload de imagens para projeto

export default router;

