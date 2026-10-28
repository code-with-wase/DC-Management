import Invoice from '../model/invoice.model.js';
import { AppError } from './app-error.service.js';

const weekStart = (date) => {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value;
};

export const getSalesReport = async ({ from, to, period = 'day' }) => {
  if (!['day', 'week', 'month'].includes(period)) throw AppError(400, 'Period must be day, week, or month');
  const start = from ? new Date(`${from}T00:00:00.000Z`) : new Date(Date.now() - 7 * 86400000);
  const end = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw AppError(400, 'Date range is invalid');
  }

  const [invoices, cancelledCount] = await Promise.all([
    Invoice.find({ status: 'paid', created_at: { $gte: start, $lte: end } }).sort({ created_at: 1 }).lean(),
    Invoice.countDocuments({ status: 'cancelled', created_at: { $gte: start, $lte: end } }),
  ]);
  const groups = new Map();
  const products = new Map();
  let costOfGoodsSold = 0;
  let untrackedCostQuantity = 0;

  for (const invoice of invoices) {
    const date = new Date(invoice.created_at);
    const key = period === 'day'
      ? date.toISOString().slice(0, 10)
      : period === 'week'
        ? weekStart(date).toISOString().slice(0, 10)
        : date.toISOString().slice(0, 7);
    const group = groups.get(key) || { period: key, count: 0, total: 0 };
    group.count += 1;
    group.total += invoice.total;
    groups.set(key, group);

    for (const item of invoice.invoice_items) {
      const product = products.get(item.name) || {
        name: item.name,
        quantity: 0,
        total: 0,
        costOfGoodsSold: 0,
        untrackedCostQuantity: 0,
      };
      product.quantity += item.quantity;
      product.total += item.quantity * item.price;
      if (Number.isFinite(item.cost_price) && item.cost_price >= 0) {
        const itemCost = item.quantity * item.cost_price;
        product.costOfGoodsSold += itemCost;
        costOfGoodsSold += itemCost;
      } else {
        product.untrackedCostQuantity += item.quantity;
        untrackedCostQuantity += item.quantity;
      }
      products.set(item.name, product);
    }
  }

  for (const product of products.values()) {
    product.grossProfit = product.untrackedCostQuantity ? null : product.total - product.costOfGoodsSold;
  }

  return {
    from: start.toISOString(),
    to: end.toISOString(),
    period,
    sales: invoices.reduce((total, invoice) => total + invoice.total, 0),
    costOfGoodsSold,
    grossProfit: untrackedCostQuantity ? null : invoices.reduce((total, invoice) => total + invoice.total, 0) - costOfGoodsSold,
    untrackedCostQuantity,
    paidInvoices: invoices.length,
    cancelledInvoices: cancelledCount,
    revenue: Array.from(groups.values()),
    products: Array.from(products.values()).sort((left, right) => right.total - left.total),
  };
};
