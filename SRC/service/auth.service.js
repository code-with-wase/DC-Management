import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import Admin from '../model/admin.model.js';
import { AppError } from './app-error.service.js';
import { getPasswordResetEmailConfig, sendPasswordResetEmail } from './email.service.js';

const resetTokenExpiryMs = 15 * 60 * 1000;

const hashResetToken = (token) => createHash('sha256').update(token).digest('hex');

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
  admin.password_reset_token = undefined;
  admin.password_reset_expires = undefined;
  await admin.save();
};

export const requestPasswordReset = async (email) => {
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw AppError(400, 'A valid email is required');
  }

  const emailConfig = getPasswordResetEmailConfig();
  const resetToken = randomBytes(32).toString('hex');
  const hashedToken = hashResetToken(resetToken);
  const expiresAt = new Date(Date.now() + resetTokenExpiryMs);
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await Admin.findOneAndUpdate(
    { email: normalizedEmail },
    { $set: { password_reset_token: hashedToken, password_reset_expires: expiresAt } },
    { new: true },
  );

  if (admin) {
    try {
      await sendPasswordResetEmail({ email: admin.email, token: resetToken, ...emailConfig });
    } catch (error) {
      await Admin.updateOne(
        { _id: admin._id, password_reset_token: hashedToken },
        { $unset: { password_reset_token: 1, password_reset_expires: 1 } },
      );
      throw error;
    }
  }
};

export const resetPassword = async ({ email, token, newPassword }) => {
  if (typeof email !== 'string' || !email.trim() || typeof token !== 'string' || !token) {
    throw AppError(400, 'Email and reset token are required');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 10) {
    throw AppError(400, 'New password must be at least 10 characters');
  }

  const password = await bcrypt.hash(newPassword, 12);
  const admin = await Admin.findOneAndUpdate(
    {
      email: email.trim().toLowerCase(),
      password_reset_token: hashResetToken(token),
      password_reset_expires: { $gt: new Date() },
    },
    {
      $set: { password },
      $unset: { password_reset_token: 1, password_reset_expires: 1 },
    },
    { new: true },
  );

  if (!admin) throw AppError(400, 'Password reset token is invalid or expired');
};
