/* Authentication & authorization middleware.
   Ο έλεγχος των δικαιωμάτων γίνεται ΠΑΝΤΑ στον server — το κρύψιμο κουμπιών
   στον client δεν αρκεί. */

import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/user.js';

/** Δημιουργεί JWT για τον συνδεδεμένο χρήστη. */
export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

/** Απαιτεί valid token και φορτώνει τον χρήστη στο req.user. */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Απαιτείται σύνδεση (Authorization: Bearer <token>).' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    // Φορτώνουμε τον χρήστη από τη βάση, ώστε ο ρόλος να είναι πάντα ο τρέχων.
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Ο χρήστης δεν υπάρχει πλέον.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Μη έγκυρο ή ληγμένο token.' });
  }
}

/** Απαιτεί συγκεκριμένο ρόλο (π.χ. Admin). */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Απαιτείται σύνδεση.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Δεν έχες δικαίωμα για αυτή την ενέργεια.' });
    }
    return next();
  };
}
