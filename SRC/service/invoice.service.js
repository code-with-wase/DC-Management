import Counter from '../model/counter.model.js';
import Invoice from '../model/invoice.model.js';
import Product from '../model/product.model.js';
import { AppError } from './app-error.service.js';
import { recordInvoiceMovements, withMongoTransaction } from './stock.service.js';

const paymentMethods = new Set(['Cash', 'UPI', 'Card']);

export const serializeInvoice = (invoice) => {
  if (!invoice) return invoice;
  const value = invoice.toObject ? invoice.toObject() : invoice;
  return {
    ...value,
    id: String(value._id),
    invoice_items: value.invoice_items.map((item) => ({
      ...item,
      id: String(item._id),
      product_id: String(item.product_id),
    })),
  };
};

const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) throw AppError(400, 'Add at least one product');
  return items.map((item) => {
    const quantity = Number(item.quantity);
    const price = Number(item.price);
    if (!item.product_id || !Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(price) || price < 0) {
      throw AppError(400, 'Each invoice item needs a product, a positive whole quantity, and a valid price');
    }
    return { product_id: item.product_id, quantity, price };
  });
};

export const listInvoices = async () => (await Invoice.find().sort({ created_at: -1 }).lean()).map(serializeInvoice);

export const getInvoice = async (id) => {
  const invoice = await Invoice.findById(id).lean();
  if (!invoice) throw AppError(404, 'Invoice not found');
  return serializeInvoice(invoice);
};

export const saveInvoice = async (data, invoiceId = null) => {
  if (!paymentMethods.has(data.payment)) throw AppError(400, 'Payment must be Cash, UPI, or Card');
  const items = normalizeItems(data.items);
  const customer = typeof data.customer === 'string' && data.customer.trim()
    ? data.customer.trim()
    : 'Walk-in customer';

  return withMongoTransaction(async (session) => {
    const existing = invoiceId ? await Invoice.findById(invoiceId).session(session) : null;
    if (invoiceId && !existing) throw AppError(404, 'Invoice not found');
    if (existing?.status === 'cancelled') throw AppError(400, 'Cancelled invoices cannot be edited');

    const stockChanges = new Map();
    for (const item of existing?.invoice_items || []) {
      const key = String(item.product_id);
      const current = stockChanges.get(key) || { product_id: item.product_id, change: 0 };
      current.change += item.quantity;
      stockChanges.set(key, current);
    }

    const requestedByProduct = new Map();
    for (const item of items) {
      const key = String(item.product_id);
      const requested = requestedByProduct.get(key) || { ...item, quantity: 0 };
      requested.quantity += item.quantity;
      requestedByProduct.set(key, requested);
    }

    const normalizedItems = [];
    for (const [productId, requested] of requestedByProduct) {
      const product = await Product.findById(productId).session(session);
      if (!product) throw AppError(400, `Product ${productId} was not found`);
      const previousQuantity = stockChanges.get(productId)?.change || 0;
      const change = previousQuantity - requested.quantity;
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: Math.max(0, -change) } },
        { $inc: { stock: change } },
        { new: true, session, runValidators: true },
      );
      if (!updated) throw AppError(409, `Not enough stock for ${product.name}`);

      const previous = stockChanges.get(productId) || { product_id: product._id, change: 0 };
      stockChanges.set(productId, { ...previous, product_name: product.name, change });
      const original = items.find((item) => String(item.product_id) === productId);
      normalizedItems.push({
        product_id: product._id,
        name: product.name,
        quantity: requested.quantity,
        price: original.price,
        brand: '',
        size: product.size,
        color: product.color,
      });
    }

    const requestedIds = new Set(requestedByProduct.keys());
    for (const [productId, previous] of stockChanges) {
      if (requestedIds.has(productId)) continue;
      const product = await Product.findById(previous.product_id).session(session);
      if (!product) continue;
      await Product.updateOne({ _id: product._id }, { $inc: { stock: previous.change } }, { session, runValidators: true });
      stockChanges.set(productId, { ...previous, product_name: product.name });
    }

    const resolvedItems = await Promise.all(normalizedItems.map(async (item) => {
      const product = await Product.findById(item.product_id).populate('brand_id', 'name').session(session);
      item.brand = product?.brand_id?.name || '';
      return item;
    }));
    const total = resolvedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    let invoice;
    if (existing) {
      existing.customer = customer;
      existing.payment = data.payment;
      existing.total = total;
      existing.invoice_items = resolvedItems;
      invoice = await existing.save({ session });
    } else {
      const counter = await Counter.findByIdAndUpdate(
        'invoice',
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true, session },
      );
      [invoice] = await Invoice.create([{
        number: counter.sequence,
        customer,
        payment: data.payment,
        status: 'paid',
        total,
        invoice_items: resolvedItems,
      }], { session });
    }

    const movementList = Array.from(stockChanges.values())
      .filter((item) => item.change !== 0)
      .map((item) => ({ ...item, note: existing ? 'Invoice edited' : 'Invoice sale' }));
    await recordInvoiceMovements(movementList, session);
    return serializeInvoice(invoice);
  });
};

export const cancelInvoice = async (id, deleteInvoice = false) => withMongoTransaction(async (session) => {
  const invoice = await Invoice.findById(id).session(session);
  if (!invoice) throw AppError(404, 'Invoice not found');

  if (invoice.status !== 'cancelled') {
    const quantities = new Map();
    for (const item of invoice.invoice_items) {
      const key = String(item.product_id);
      const entry = quantities.get(key) || { product_id: item.product_id, quantity: 0, name: item.name };
      entry.quantity += item.quantity;
      quantities.set(key, entry);
    }
    for (const item of quantities.values()) {
      await Product.updateOne({ _id: item.product_id }, { $inc: { stock: item.quantity } }, { session, runValidators: true });
    }
    await recordInvoiceMovements(Array.from(quantities.values()).map((item) => ({
      product_id: item.product_id,
      product_name: item.name,
      change: item.quantity,
      note: `Invoice DC-${String(invoice.number).padStart(4, '0')} cancelled`,
    })), session);
    invoice.status = 'cancelled';
  }

  if (deleteInvoice) {
    await Invoice.deleteOne({ _id: invoice._id }, { session });
    return null;
  }
  await invoice.save({ session });
  return serializeInvoice(invoice);
});
