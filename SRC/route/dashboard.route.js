import { Router } from 'express';
import { getDashboard } from '../controller/dashboard.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/overview', getDashboard);

export default router;
