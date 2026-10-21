import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    // snapshot των δεδομένων τη στιγμή της παραγγελίας
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    qty: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    // Το σύνολο υπολογίζεται ΠΑΝΤΑ από τον server (από τις τιμές της βάσης).
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Σε επεξεργασία', 'Απεστάλη', 'Ολοκληρώθηκε', 'Ακυρώθηκε'],
      default: 'Σε επεξεργασία'
    },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
