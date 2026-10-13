import { Router } from 'express';
import { getCatalog, patchCatalogEntry, postCatalogEntry, removeCatalogEntry } from '../controller/catalog.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/all', getCatalog('category'));
router.post('/create', postCatalogEntry('category'));
router.patch('/:id/update', patchCatalogEntry('category'));
router.delete('/:id/delete', removeCatalogEntry('category'));

export default router;
