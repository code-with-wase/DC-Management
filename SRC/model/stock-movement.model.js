import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  product_name: { type: String, required: true, trim: true },
  change: { type: Number, required: true },
  note: { type: String, required: true, trim: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', stockMovementSchema);

export default StockMovement;
