import { Router } from 'express';
import { getShop } from '../controller/shop.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/data', getShop);

export default router;
