import { getDashboardData } from '../service/shop.service.js';

export const getDashboard = async (req, res) => res.status(200).json({ data: await getDashboardData() });
