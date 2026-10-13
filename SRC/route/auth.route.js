import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  currentUser,
  forgotPassword,
  login,
  logout,
  resetForgottenPassword,
  updatePassword,
} from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
const passwordResetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });

router.post('/login', loginLimit, login);
router.post('/password/forgot', passwordResetLimit, forgotPassword);
router.post('/password/reset', passwordResetLimit, resetForgottenPassword);
router.get('/me', authenticate, currentUser);
router.post('/logout', authenticate, logout);
router.patch('/password/update', authenticate, updatePassword);

export default router;
