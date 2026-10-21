/* POST /api/auth/register  &  POST /api/auth/login */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';
import { validateRegistration } from '../utils/validators.js';

export const authRouter = Router();

/** GET /api/auth/me — επιστρέφει τον συνδεδεμένο χρήστη (για την επαναφόρτωση της σελίδας). */
authRouter.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user.toPublicJSON() });
});

/**
 * Εγγραφή: ίδιοι κανόνες φόρμας με την Εργασία 1.
 * 201 Created σε επιτυχία, 400 σε μη έγκυρα δεδομένα ή duplicate email.
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmation } = req.body ?? {};

    const { valid, errors } = validateRegistration({
      firstName,
      lastName,
      email,
      password,
      confirmation
    });

    if (!valid) {
      return res.status(400).json({ message: 'Μη έγκυρα δεδομένα εγγραφής.', details: errors });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        message: 'Το email χρησιμοποιείται ήδη.',
        details: { email: 'Το email χρησιμοποιείται ήδη. Επιλέξτε άλλο.' }
      });
    }

    // hash με bcrypt — ποτέ plaintext
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'User'
    });

    return res.status(201).json({ user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
});

/**
 * Σύνδεση: επιστρέφει JWT + τα στοιχεία του χρήστη (χωρίς password).
 * 401 σε λάθος credentials.
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Συμπληρώστε email και κωδικό.' });
    }

    // +password: το password έχει select:false στο schema
    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Λάθος email ή κωδικός.' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Λάθος email ή κωδικός.' });
    }

    return res.status(200).json({ token: signToken(user), user: user.toPublicJSON() });
  } catch (error) {
    return next(error);
  }
});
