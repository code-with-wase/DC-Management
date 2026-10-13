import { Router } from 'express';
import { getProducts, patchProduct, postProduct, removeProduct } from '../controller/product.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/all', getProducts);
router.post('/create', postProduct);
router.patch('/:id/update', patchProduct);
router.delete('/:id/delete', removeProduct);

export default router;
