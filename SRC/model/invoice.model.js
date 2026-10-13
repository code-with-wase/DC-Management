import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  brand: { type: String, default: '' },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  customer: { type: String, required: true, trim: true, default: 'Walk-in customer' },
  payment: { type: String, enum: ['Cash', 'UPI', 'Card'], required: true },
  status: { type: String, enum: ['paid', 'cancelled'], default: 'paid', required: true },
  total: { type: Number, required: true, min: 0 },
  invoice_items: { type: [invoiceItemSchema], default: [] },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

export default Invoice;
