import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
    description: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

export const Product = mongoose.model('Product', productSchema);
