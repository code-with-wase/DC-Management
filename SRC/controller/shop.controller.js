import { getShopData } from '../service/shop.service.js';

export const getShop = async (req, res) => res.status(200).json({ data: await getShopData() });
