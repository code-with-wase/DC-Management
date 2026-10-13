import Brand from '../model/brand.model.js';
import Category from '../model/category.model.js';
import Product from '../model/product.model.js';
import { AppError } from './app-error.service.js';
import { withMongoTransaction } from './stock.service.js';

const collectionFor = (kind) => {
  if (kind === 'brand') return Brand;
  if (kind === 'category') return Category;
  throw AppError(404, 'Catalog type not found');
};

const serializeEntry = (entry) => ({ ...entry, id: String(entry._id) });

export const listCatalog = async (kind) => (await collectionFor(kind).find().sort({ name: 1 }).lean()).map(serializeEntry);

export const createCatalogEntry = async (kind, name) => {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (!normalizedName) throw AppError(400, 'Name is required');
  return serializeEntry((await collectionFor(kind).create({ name: normalizedName })).toObject());
};

export const updateCatalogEntry = async (kind, id, name) => {
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (!normalizedName) throw AppError(400, 'Name is required');
  const entry = await collectionFor(kind).findByIdAndUpdate(id, { name: normalizedName }, { new: true, runValidators: true });
  if (!entry) throw AppError(404, `${kind} not found`);
  return serializeEntry(entry.toObject());
};

export const deleteCatalogEntry = async (kind, id) => withMongoTransaction(async (session) => {
  const Model = collectionFor(kind);
  const entry = await Model.findByIdAndDelete(id).session(session);
  if (!entry) throw AppError(404, `${kind} not found`);
  const field = kind === 'brand' ? 'brand_id' : 'category_id';
  await Product.updateMany({ [field]: entry._id }, { $set: { [field]: null } }, { session });
});
