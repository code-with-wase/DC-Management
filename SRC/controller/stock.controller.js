import { adjustStock, listStockMovements } from '../service/stock.service.js';
import { AppError } from '../service/app-error.service.js';

export const postStockAdjustment = async (req, res) => {
  const { product_id, change, note } = req.body || {};
  if (!product_id || change === undefined) throw AppError(400, 'Product and quantity change are required');
  return res.status(200).json({ data: await adjustStock({ product_id, change: Number(change), note }) });
};

export const getStockMovements = async (req, res) => res.status(200).json({ data: await listStockMovements(req.query.limit) });
