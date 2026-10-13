import { getSalesReport } from '../service/report.service.js';

export const getReport = async (req, res) => res.status(200).json({ data: await getSalesReport(req.query) });
