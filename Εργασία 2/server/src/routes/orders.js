/* Παραγγελίες: το καλάθι και το ιστορικό.
   ΚΡΙΣΙΜΟ: ο client στέλνει ΜΟΝΟ productId + qty.
   Ο server βρίσκει τις τιμές στη βάση και υπολογίζει το σύνολο. */

import { Router } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/order.js';
import { Product } from '../models/product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateOrderItems } from '../utils/validators.js';

export const ordersRouter = Router();

/** GET /api/orders — ο User βλέπει μόνο τις δικές του, ο Admin όλες. */
ordersRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { user: req.user._id };
    const orders = await Order.find(filter).sort({ date: -1 }).populate('user', 'firstName lastName email');
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/orders — δημιουργεί παραγγελία.
 * 201 σε επιτυχία, 400 σε μη έγκυρα δεδομένα, 401 χωρίς σύνδεση.
 */
ordersRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items } = req.body ?? {};

    const validation = validateOrderItems(items);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // 1. Φορτώνουμε τα προϊόντα από τη βάση (οι τιμές του client αγνοούνται).
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'Ένα ή περισσότερα προϊόντα δεν υπάρχουν.' });
    }

    // 2. Φτιάχνουμε τα items με τις τιμές της βάσης και υπολογίζουμε το σύνολο.
    const orderItems = [];
    let total = 0;
    items.forEach((item) => {
      const product = products.find((p) => String(p._id) === String(item.productId));
      const qty = Number(item.qty);
      const lineTotal = product.price * qty;
      total += lineTotal;
      orderItems.push({ name: product.name, price: product.price, qty });
    });

    // 3. Αποθηκεύουμε την παραγγελία.
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total: Math.round(total * 100) / 100,
      date: new Date()
    });

    return res.status(201).json({ order });
  } catch (error) {
    return next(error);
  }
});

/** PUT /api/orders/:id/status — μόνο Admin (bonus: κατάσταση παραγγελίας). */
ordersRouter.put('/:id/status', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    const allowed = ['Σε επεξεργασία', 'Απεστάλη', 'Ολοκληρώθηκε', 'Ακυρώθηκε'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Μη έγκυρη κατάσταση παραγγελίας.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Η παραγγελία δεν βρέθηκε.' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Η παραγγελία δεν βρέθηκε.' });
    }
    return res.status(200).json({ order });
  } catch (error) {
    return next(error);
  }
});
