import { cancelInvoice, getInvoice, listInvoices, saveInvoice } from '../service/invoice.service.js';

export const getInvoices = async (req, res) => res.status(200).json({ data: await listInvoices() });

export const getInvoiceById = async (req, res) => res.status(200).json({ data: await getInvoice(req.params.id) });

export const postInvoice = async (req, res) => res.status(201).json({ data: await saveInvoice(req.body || {}) });

export const putInvoice = async (req, res) => res.status(200).json({ data: await saveInvoice(req.body || {}, req.params.id) });

export const postCancelInvoice = async (req, res) => res.status(200).json({
  data: await cancelInvoice(req.params.id, Boolean(req.body?.delete)),
});
