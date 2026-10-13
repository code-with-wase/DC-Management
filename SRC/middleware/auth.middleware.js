import jwt from 'jsonwebtoken';
import Admin from '../model/admin.model.js';
import { AppError } from '../service/app-error.service.js';

export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) return next(AppError(401, 'Authentication required'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.sub).select('_id email role');
    if (!admin) return next(AppError(401, 'Account no longer exists'));
    req.user = { id: admin.id, email: admin.email, role: admin.role };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(AppError(401, 'Invalid or expired access token'));
    }
    return next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(AppError(403, 'Administrator access required'));
  return next();
};
