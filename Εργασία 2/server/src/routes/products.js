/* Προϊόντα: GET (public) και POST/PUT/DELETE (μόνο Admin). */

import { Router } from 'express';
import mongoose from 'mongoose';
import { Product } from '../models/product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const productsRouter = Router();

/** Μη έγκυρο ObjectId = ο πόρος δεν υπάρχει -> 404 (όχι 500). */
function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

/**
 * GET /api/products
 * ?search=...  ?category=...  ?sort=price|-price|name  ?page=1&limit=10
 * Η αναζήτηση/ο φίλτρο/η ταξινόμηση μπορούν να γίνουν και στον client,
 * αλλά ο server τα υποστηρίζει κι αυτός (χρήσιμο για σελιδοποίηση).
 */
productsRouter.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '', sort = '', page, limit } = req.query;

    const filter = {};
    if (search) {
      filter.name = { $regex: String(search).trim(), $options: 'i' };
    }
    if (category && category !== 'all') {
      filter.category = category;
    }

    const sortOptions = {
      'price': { price: 1 },
      '-price': { price: -1 },
      'name': { name: 1 },
      '-name': { name: -1 }
    };

    let query = Product.find(filter);
    if (sortOptions[sort]) {
      query = query.sort(sortOptions[sort]);
    } else {
      query = query.sort({ name: 1 });
    }

    // Σελιδοποίηση (bonus) — μόνο όταν ζητηθεί ρητά ?page=
    if (page) {
      const pageNumber = Math.max(1, Number(page) || 1);
      const pageSize = Math.min(50, Math.max(1, Number(limit) || 10));
      const total = await Product.countDocuments(filter);
      const products = await query
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);
      return res.status(200).json({
        products,
        page: pageNumber,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      });
    }

    const products = await query;
    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
});

/** GET /api/products/:id */
productsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Το προϊόν δεν βρέθηκε.' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Το προϊόν δεν βρέθηκε.' });
    }
    return res.status(200).json({ product });  } catch (error) {
    return next(error);
  }
});

/** POST /api/products — μόνο Admin (201) */
productsRouter.post('/', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const { name, category, price, available = true, description = '' } = req.body ?? {};

    if (!name || !category || price === undefined || price === null || price === '') {
      return res.status(400).json({ message: 'Συμπληρώστε όνομα, κατηγορία και τιμή.' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'Η τιμή πρέπει να είναι μη αρνητικός αριθμός.' });
    }

    const product = await Product.create({
      name: String(name).trim(),
      category: String(category).trim(),
      price: numericPrice,
      available: Boolean(available),
      description: String(description).trim()
    });

    return res.status(201).json({ product });
  } catch (error) {
    return next(error);
  }
});

/** PUT /api/products/:id — μόνο Admin */
productsRouter.put('/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Το προϊόν δεν βρέθηκε.' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Το προϊόν δεν βρέθηκε.' });
    }

    const { name, category, price, available, description } = req.body ?? {};

    if (name !== undefined) product.name = String(name).trim();
    if (category !== undefined) product.category = String(category).trim();
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: 'Η τιμή πρέπει να είναι μη αρνητικός αριθμός.' });
      }
      product.price = numericPrice;
    }
    if (available !== undefined) product.available = Boolean(available);
    if (description !== undefined) product.description = String(description).trim();

    await product.save();
    return res.status(200).json({ product });
  } catch (error) {
    return next(error);
  }
});

/** DELETE /api/products/:id — μόνο Admin */
productsRouter.delete('/:id', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Το προϊόν δεν βρέθηκε.' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Το προϊόν δεν βρέθηκε.' });
    }
    return res.status(200).json({ message: 'Το προϊόν διαγράφηκε.', product });
  } catch (error) {
    return next(error);
  }
});
