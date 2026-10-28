import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  size: { type: String, required: true, trim: true },
  color: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  cost_price: { type: Number, min: 0, default: null },
  low_stock: { type: Number, required: true, min: 0, default: 5 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
