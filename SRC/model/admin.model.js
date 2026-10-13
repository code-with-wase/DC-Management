import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'staff'], default: 'admin', required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
