import mongoose from 'mongoose';
import Product from '../model/product.model.js';
import StockMovement from '../model/stock-movement.model.js';
import { AppError } from './app-error.service.js';

export const adjustStock = async ({ product_id, change, note }) => {
  if (!Number.isInteger(change) || change === 0) throw AppError(400, 'Enter a non-zero whole-number quantity change');
  return withMongoTransaction(async (session) => {
    const product = await Product.findOneAndUpdate(
      { _id: product_id, stock: { $gte: Math.max(0, -change) } },
      { $inc: { stock: change } },
      { new: true, session, runValidators: true },
    );
    if (!product) {
      const exists = await Product.exists({ _id: product_id }).session(session);
      if (!exists) throw AppError(404, 'Product not found');
      throw AppError(400, 'Stock cannot go below zero');
    }

    await StockMovement.create([{
      product_id: product._id,
      product_name: product.name,
      change,
      note: typeof note === 'string' && note.trim() ? note.trim() : 'Manual adjustment',
    }], { session });
    return product;
  });
};

export const listStockMovements = async (limit = 100) => StockMovement.find()
  .sort({ created_at: -1 })
  .limit(Math.min(Math.max(Number(limit) || 100, 1), 500))
  .lean();

export const recordInvoiceMovements = async (changes, session) => {
  const movements = changes
    .filter((change) => change.change !== 0)
    .map((change) => ({
      product_id: change.product_id,
      product_name: change.product_name,
      change: change.change,
      note: change.note,
    }));
  if (movements.length) await StockMovement.insertMany(movements, session ? { session } : {});
};

export const withMongoTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    const transactionUnsupported = error.code === 20
      && /transaction numbers are only allowed|transactions are not supported/i.test(error.message);
    if (transactionUnsupported) return operation(null);
    throw error;
  } finally {
    await session.endSession();
  }
};
