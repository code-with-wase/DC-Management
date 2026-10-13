import { Router } from 'express';
import { getCatalog, patchCatalogEntry, postCatalogEntry, removeCatalogEntry } from '../controller/catalog.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/all', getCatalog('brand'));
router.post('/create', postCatalogEntry('brand'));
router.patch('/:id/update', patchCatalogEntry('brand'));
router.delete('/:id/delete', removeCatalogEntry('brand'));

export default router;
