/* Script αρχικοποίησης της βάσης: npm run seed
   Γεμίζει τη βάση με τουλάχιστον 10 προϊόντα, έναν Admin και έναν User.

   Τα προϊόντα διαβάζονται από αρχείο JSON με τη μορφή της «Εξαγωγής JSON» της
   Εργασίας 1 (κλειδί products του localStorage). Έτσι τα δεδομένα της Εργασίας 1
   μεταφέρονται στη MongoDB:
     npm run seed                      -> data/products.json (ίδια με τα αρχικά της Ε1)
     npm run seed -- <αρχείο.json>     -> π.χ. το products.json που κατέβασε η Ε1 */

import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config/env.js';
import { User } from './models/user.js';
import { Product } from './models/product.js';
import { Order } from './models/order.js';

const DEFAULT_PRODUCTS_FILE = new URL('../data/products.json', import.meta.url);

/** Διαβάζει τα προϊόντα και κρατά μόνο τα πεδία του σχήματος
 *  (το id της Εργασίας 1 αγνοείται: η MongoDB δίνει δικό της _id). */
async function loadProducts(file) {
  const records = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(records)) {
    throw new Error('Το αρχείο προϊόντων πρέπει να περιέχει πίνακα JSON.');
  }
  return records.map(({ name, category, price, available = true }) => ({ name, category, price, available }));
}

async function main() {
  const products = await loadProducts(process.argv[2] ?? DEFAULT_PRODUCTS_FILE);

  await mongoose.connect(config.mongoUri);
  console.log('[seed] Σύνδεση OK');

  // Καθαρισμός ώστε το seed να είναι idempotent (μπορεί να εκτελείτε πολλές φορές).
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);

  const hashedAdmin = await bcrypt.hash('Admin123!', config.bcryptRounds);
  const hashedUser = await bcrypt.hash('User123!', config.bcryptRounds);

  const admin = await User.create({
    firstName: 'ΑΔΑΜ',
    lastName: 'ΔΙΑΧΕΙΡΙΣΤΗΣ',
    email: 'admin@aueb.gr',
    password: hashedAdmin,
    role: 'Admin'
  });

  const user = await User.create({
    firstName: 'ΜΑΡΙΑ',
    lastName: 'ΧΡΗΣΤΗ',
    email: 'user@aueb.gr',
    password: hashedUser,
    role: 'User'
  });

  // Το insertMany εφαρμόζει τους κανόνες του σχήματος (required, min) σε κάθε προϊόν.
  const created = await Product.insertMany(products);

  console.log(`[seed] ${created.length} προϊόντα, Admin: ${admin.email}, User: ${user.email}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('[seed] Αποτυχία:', error);
  process.exit(1);
});
