import express from 'express';
import rateLimit from 'express-rate-limit';
import * as projectController from '../controllers/projectController.js';
import { projectImageUploadMiddleware, projectNightImageUploadMiddleware } from '../middleware/projectUpload.js';
import { requireAdmin } from '../middleware/roles.js';

const router = express.Router();

// Rate limiting específico para atualizações de projetos (prevenir spam)
const updateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // máximo 30 requisições por minuto por IP
  message: 'Muitas atualizações. Por favor, aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
  // Usar keyGenerator para obter IP real mesmo com trust proxy
  // Isso ajuda a evitar bypass do rate limiting
  keyGenerator: (req) => {
    // Priorizar socket.remoteAddress que é mais confiável que req.ip quando trust proxy está ativo
    return req.socket.remoteAddress || req.ip || 'unknown';
  },
});

// Rate limiting mais restritivo para atualizações de description (notas)
// Criar o limiter uma vez na inicialização, não em cada request
const notesUpdateRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 atualizações de notas por minuto por IP
  message: 'Muitas atualizações de notas. Por favor, aguarde um momento.',
  standardHeaders: true,
  legacyHeaders: false,
  // Usar keyGenerator para obter IP real mesmo com trust proxy
  // Isso ajuda a evitar bypass do rate limiting
  keyGenerator: (req) => {
    // Priorizar socket.remoteAddress que é mais confiável que req.ip quando trust proxy está ativo
    return req.socket.remoteAddress || req.ip || 'unknown';
  },
  // Só aplicar rate limit se for atualização de description
  skip: (req) => {
    return !(req.method === 'PUT' && req.body.description !== undefined);
  },
});

// Rotas de projetos
// IMPORTANTE: Rotas específicas devem vir ANTES das rotas genéricas com parâmetros
router.get('/stats', requireAdmin(), projectController.getStats); // Deve vir antes de /:id (apenas admin)
router.get('/search', projectController.search); // Pesquisa de projetos - DEVE VIR ANTES de /:id
router.post('/:id/images/upload', projectImageUploadMiddleware, projectController.uploadImages); // Upload de imagens - DEVE VIR ANTES de /:id
router.post('/:id/images/:imageId/night', projectNightImageUploadMiddleware, projectController.receiveNightImage); // Receber imagem de noite convertida
router.post('/:id/images/:imageId/night/failed', projectController.markConversionFailed); // Marcar conversão como falhada

// Rota de debug para verificar arquivos (sempre disponível para diagnóstico)
router.get('/:id/images/debug', projectController.debugProjectImages);

// Rotas de observações
router.get('/:id/observations', projectController.getObservations);
router.post('/:id/observations', projectController.addObservation);
router.delete('/:id/observations/:observationId', projectController.deleteObservation);

// Rota de resultados (imagens de logos)
router.get('/:id/results', projectController.getResults);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
// Aplicar rate limiting nas atualizações
router.put('/:id', updateRateLimiter, notesUpdateRateLimiter, projectController.update);
router.delete('/:id', projectController.deleteProject);
router.patch('/:id/status', projectController.updateStatus);
router.patch('/:id/favorite', projectController.toggleFavorite);
router.patch('/:id/canvas', projectController.updateCanvas); // Nova rota para atualizar canvas
router.patch('/:id/add-random-designer', projectController.addRandomDesigner); // Adicionar designer aleatório

export default router;

