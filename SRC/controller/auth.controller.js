import {
  changePassword,
  getCurrentUser,
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
