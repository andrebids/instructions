import express from 'express';
import {
  getOrdersByProject,
  getOrderById,
  getOrCreateDraftOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  syncDecorations,
} from '../controllers/ordersController.js';

const router = express.Router();

// Rotas de orders
router.get('/project/:projectId', getOrdersByProject);
router.get('/project/:projectId/draft', getOrCreateDraftOrder);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

// Rotas de items
router.post('/:id/items', addOrderItem);
router.put('/:id/items/:itemId', updateOrderItem);
router.delete('/:id/items/:itemId', removeOrderItem);

// Rota para sincronizar decorações do AI Designer
router.post('/project/:projectId/sync-decorations', syncDecorations);

export default router;

