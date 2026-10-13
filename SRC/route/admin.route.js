import { Router } from 'express';
import { getAdmins, postAdmin } from '../controller/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/all', getAdmins);
router.post('/create', postAdmin);

export default router; 
