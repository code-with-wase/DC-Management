import { Router } from 'express';
import { getInvoiceById, getInvoices, postCancelInvoice, postInvoice, putInvoice } from '../controller/invoice.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/all', getInvoices);
router.post('/create', postInvoice);
router.get('/:id', getInvoiceById);
router.put('/:id/update', putInvoice);
router.post('/:id/cancel', postCancelInvoice);

export default router;
