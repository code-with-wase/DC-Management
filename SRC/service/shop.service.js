import Brand from '../model/brand.model.js';
import Category from '../model/category.model.js';
import Invoice from '../model/invoice.model.js';
import Product from '../model/product.model.js';
import { serializeInvoice } from './invoice.service.js';
import { serializeProduct } from './product.service.js';
import { listStockMovements } from './stock.service.js';

export const getShopData = async () => {
  const [products, brands, categories, invoices, movements] = await Promise.all([
    Product.find().populate('brand_id', 'name').populate('category_id', 'name').sort({ created_at: -1 }).lean(),
    Brand.find().sort({ name: 1 }).lean(),
    Category.find().sort({ name: 1 }).lean(),
    Invoice.find().sort({ created_at: -1 }).lean(),
    listStockMovements(100),
  ]);

  return {
    products: products.map(serializeProduct),
    brands: brands.map((brand) => ({ ...brand, id: String(brand._id) })),
    categories: categories.map((category) => ({ ...category, id: String(category._id) })),
    invoices: invoices.map(serializeInvoice),
    movements: movements.map((movement) => ({
      ...movement,
      id: String(movement._id),
      product_id: movement.product_id ? String(movement.product_id) : null,
    })),
  };
};

export const getDashboardData = async () => {
  const currentTime = new Date();
  const today = new Date(Date.UTC(currentTime.getUTCFullYear(), currentTime.getUTCMonth(), currentTime.getUTCDate()));
  const [productCount, stockSummary, invoiceCount, paidInvoiceCount, lowStockProducts, todaySales, recentInvoices] = await Promise.all([
    Product.countDocuments(),
    Product.aggregate([{ $group: { _id: null, units: { $sum: '$stock' } } }]),
    Invoice.countDocuments(),
    Invoice.countDocuments({ status: 'paid' }),
    Product.find({ $expr: { $lte: ['$stock', '$low_stock'] } }).sort({ stock: 1 }).lean(),
    Invoice.aggregate([
      { $match: { status: 'paid', created_at: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.find().sort({ created_at: -1 }).limit(5).lean(),
  ]);

  return {
    todaySales: todaySales[0]?.total || 0,
    totalProducts: productCount,
    unitsInStock: stockSummary[0]?.units || 0,
    totalInvoices: invoiceCount,
    paidInvoices: paidInvoiceCount,
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.map(serializeProduct),
    recentInvoices: recentInvoices.map(serializeInvoice),
  };
};
