import { createProduct, deleteProduct, listProducts, updateProduct } from '../service/product.service.js';

export const getProducts = async (req, res) => res.status(200).json({ data: await listProducts(req.query) });

export const postProduct = async (req, res) => res.status(201).json({ data: await createProduct(req.body || {}) });

export const patchProduct = async (req, res) => res.status(200).json({ data: await updateProduct(req.params.id, req.body || {}) });

export const removeProduct = async (req, res) => {
  await deleteProduct(req.params.id);
  return res.status(200).json({ data: { message: 'Product deleted' } });
};
