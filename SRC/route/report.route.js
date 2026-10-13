import { Router } from 'express';
import { getReport } from '../controller/report.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/sales', getReport);

export default router;
