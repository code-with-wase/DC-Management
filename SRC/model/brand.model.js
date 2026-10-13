import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

brandSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const Brand = mongoose.models.Brand || mongoose.model('Brand', brandSchema);

export default Brand;
