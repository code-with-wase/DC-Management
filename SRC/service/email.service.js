import nodemailer from 'nodemailer';
import { AppError } from './app-error.service.js';

export const getPasswordResetEmailConfig = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    throw AppError(503, 'Password reset email is not configured');
  }

  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw AppError(503, 'Password reset email SMTP port is invalid');
  }

  let resetUrl;
  try {
    resetUrl = new URL(process.env.RESET_PASSWORD_URL || 'http://localhost:5173/reset-password');
  } catch {
    throw AppError(503, 'RESET_PASSWORD_URL is invalid');
  }
  if (process.env.NODE_ENV === 'production' && resetUrl.protocol !== 'https:') {
    throw AppError(503, 'RESET_PASSWORD_URL must use HTTPS in production');
  }

  return {
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    }),
    resetUrl,
  };
};

export const sendPasswordResetEmail = async ({ email, token, transport, resetUrl }) => {
  resetUrl.searchParams.set('email', email);
  resetUrl.searchParams.set('token', token);

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Reset your DC Management password',
    text: `A password reset was requested for your account. Use this link within 15 minutes: ${resetUrl.href}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>A password reset was requested for your DC Management account.</p><p><a href="${resetUrl.href}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
  });
};
