import { createCatalogEntry, deleteCatalogEntry, listCatalog, updateCatalogEntry } from '../service/catalog.service.js';

export const getCatalog = (kind) => async (req, res) => res.status(200).json({ data: await listCatalog(kind) });

export const postCatalogEntry = (kind) => async (req, res) => {
  const entry = await createCatalogEntry(kind, req.body?.name);
  return res.status(201).json({ data: entry });
};

export const patchCatalogEntry = (kind) => async (req, res) => {
  const entry = await updateCatalogEntry(kind, req.params.id, req.body?.name);
  return res.status(200).json({ data: entry });
};

export const removeCatalogEntry = (kind) => async (req, res) => {
  await deleteCatalogEntry(kind, req.params.id);
  return res.status(200).json({ data: { message: `${kind} deleted` } });
};
