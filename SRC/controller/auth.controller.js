import {
  changePassword,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  signIn,
} from '../service/auth.service.js';
import { AppError } from '../service/app-error.service.js';

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw AppError(400, 'Email and password are required');
  const result = await signIn({ email, password });
  return res.status(200).json({ data: result });
};

export const currentUser = async (req, res) => res.status(200).json({ data: await getCurrentUser(req.user.id) });

export const logout = async (req, res) => res.status(200).json({ data: { message: 'Signed out' } });

export const updatePassword = async (req, res) => {
  await changePassword(req.user.id, req.body || {});
  return res.status(200).json({ data: { message: 'Password updated' } });
};

export const forgotPassword = async (req, res) => {
  await requestPasswordReset(req.body?.email);
  return res.status(200).json({
    data: { message: 'If an account exists for that email, a password reset link has been sent.' },
  });
};

export const resetForgottenPassword = async (req, res) => {
  await resetPassword(req.body || {});
  return res.status(200).json({ data: { message: 'Password reset successfully' } });
};
