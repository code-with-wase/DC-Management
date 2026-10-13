import { createAdmin, listAdmins } from '../service/admin.service.js';

export const getAdmins = async (req, res) => res.status(200).json({ data: await listAdmins() });

export const postAdmin = async (req, res) => res.status(201).json({ data: await createAdmin(req.body || {}) });
