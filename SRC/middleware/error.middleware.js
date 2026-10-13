import mongoose from 'mongoose';
import { AppError } from '../service/app-error.service.js';

export const notFoundHandler = (req, res, next) => next(AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(', ');
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid resource identifier';
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    message = `${field} already exists`;
  }

  if (statusCode >= 500) console.error(error);
  return res.status(statusCode).json({ error: { message } });
};
