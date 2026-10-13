import Brand from '../model/brand.model.js';
import Category from '../model/category.model.js';
import Product from '../model/product.model.js';
import { AppError } from './app-error.service.js';
import { recordInvoiceMovements, withMongoTransaction } from './stock.service.js';

const validateReferences = async ({ brand_id, category_id }) => {
  if (brand_id && !(await Brand.exists({ _id: brand_id }))) throw AppError(400, 'Selected brand was not found');
  if (category_id && !(await Category.exists({ _id: category_id }))) throw AppError(400, 'Selected category was not found');
};

export const serializeProduct = (product) => {
  const value = product.toObject ? product.toObject() : product;
  const brand = value.brand_id;
  const category = value.category_id;
  return {
    ...value,
    id: String(value._id),
    brand_id: brand ? String(brand._id || brand) : null,
    category_id: category ? String(category._id || category) : null,
    brands: brand?.name ? { name: brand.name } : null,
    categories: category?.name ? { name: category.name } : null,
  };
};

export const listProducts = async ({ search = '', category_id, lowStock } = {}) => {
  const filter = {};
  if (category_id) filter.category_id = category_id;
  if (lowStock === 'true') filter.$expr = { $lte: ['$stock', '$low_stock'] };
  if (String(search).trim()) {
    const escapedSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: escapedSearch, $options: 'i' } }, { sku: { $regex: escapedSearch, $options: 'i' } }];
  }
  const products = await Product.find(filter)
    .populate('brand_id', 'name')
    .populate('category_id', 'name')
    .sort({ created_at: -1 })
    .lean();
  return products.map(serializeProduct);
};

export const createProduct = async (data) => {
  await validateReferences(data);
  return withMongoTransaction(async (session) => {
    const product = await Product.create([data], { session }).then(([created]) => created);
    if (product.stock > 0) {
      await recordInvoiceMovements([{
        product_id: product._id,
        product_name: product.name,
        change: product.stock,
        note: 'Initial stock',
      }], session);
    }
    return serializeProduct(product);
  });
};

export const updateProduct = async (id, data) => {
  if (Object.hasOwn(data, 'stock')) throw AppError(400, 'Use stock adjustment to change inventory');
  await validateReferences(data);
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw AppError(404, 'Product not found');
  return serializeProduct(product);
};

export const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw AppError(404, 'Product not found');
};
