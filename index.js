import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import connectDB from './SRC/db/db.js';
import { errorHandler, notFoundHandler } from './SRC/middleware/error.middleware.js';
import authRoutes from './SRC/route/auth.route.js';
import adminRoutes from './SRC/route/admin.route.js';
import brandRoutes from './SRC/route/brand.route.js';
import categoryRoutes from './SRC/route/category.route.js';
import dashboardRoutes from './SRC/route/dashboard.route.js';
import invoiceRoutes from './SRC/route/invoice.route.js';
import productRoutes from './SRC/route/product.route.js';
import reportRoutes from './SRC/route/report.route.js';
import shopRoutes from './SRC/route/shop.route.js';
import stockRoutes from './SRC/route/stock.route.js';

const app = express();
const port = Number(process.env.PORT) || 5000;
let initializationPromise;

const initializeApplication = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'replace-with-a-long-random-secret') {
    throw new Error('Set JWT_SECRET to a unique, long random value before starting the API');
  }
  if (!initializationPromise) {
    initializationPromise = connectDB().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }
  return initializationPromise;
};

const ensureDatabase = async (req, res, next) => {
  try {
    await initializeApplication();
    return next();
  } catch (error) {
    return next(error);
  }
};

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use(ensureDatabase);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/brand', brandRoutes);
app.use('/category', categoryRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/invoice', invoiceRoutes);
app.use('/product', productRoutes);
app.use('/report', reportRoutes);
app.use('/shop', shopRoutes);
app.use('/stock', stockRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (process.env.VERCEL !== '1' && isMainModule) {
  initializeApplication().then(() => app.listen(port, () => {
    console.info(`DC Management API listening on port ${port}`);
  })).catch((error) => {
    console.error('Server startup failed:', error);
    process.exitCode = 1;
  });
}

export default app;
