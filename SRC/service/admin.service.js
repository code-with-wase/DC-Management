import bcrypt from 'bcryptjs';
import Admin from '../model/admin.model.js';
import { AppError } from './app-error.service.js';

export const listAdmins = async () => (await Admin.find()
  .select('_id email role created_at')
  .sort({ created_at: 1 })
  .lean())
  .map((admin) => ({ ...admin, id: String(admin._id) }));

export const createAdmin = async ({ email, password }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (typeof password !== 'string' || password.length < 10) {
    throw AppError(400, 'Password must be at least 10 characters');
  }
  if (!normalizedEmail) throw AppError(400, 'Email is required');
  if (await Admin.exists({ email: normalizedEmail })) throw AppError(409, 'An admin with this email already exists');

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await Admin.create({ email: normalizedEmail, password: hashedPassword, role: 'admin' });
  return { id: admin.id, email: admin.email, role: admin.role, created_at: admin.created_at };
};
