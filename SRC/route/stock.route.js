import { Router } from 'express';
import { getStockMovements, postStockAdjustment } from '../controller/stock.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/movements', getStockMovements);
router.post('/adjust', postStockAdjustment);

export default router;
