import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../model/admin.model.js';
import { AppError } from './app-error.service.js';

export const signIn = async ({ email, password }) => {
  const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
  if (!admin || !(await bcrypt.compare(String(password), admin.password))) {
    throw AppError(401, 'Invalid login credentials');
  }

  const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return { token, user: { id: admin.id, email: admin.email, role: admin.role } };
};

export const getCurrentUser = async (userId) => {
  const admin = await Admin.findById(userId).select('_id email role created_at');
  if (!admin) throw AppError(404, 'Account not found');
  return { id: admin.id, email: admin.email, role: admin.role, created_at: admin.created_at };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (typeof newPassword !== 'string' || newPassword.length < 10) {
    throw AppError(400, 'New password must be at least 10 characters');
  }

  const admin = await Admin.findById(userId).select('+password');
  if (!admin || !(await bcrypt.compare(String(currentPassword), admin.password))) {
    throw AppError(401, 'Current password is incorrect');
  }

  admin.password = await bcrypt.hash(newPassword, 12);
  await admin.save();
};
