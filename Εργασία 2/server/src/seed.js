/* Script αρχικοποίησης της βάσης: npm run seed
   Γεμίζει τη βάση με τουλάχιστον 10 προϊόντα, έναν Admin και έναν User. */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config/env.js';
import { User } from './models/user.js';
import { Product } from './models/product.js';
import { Order } from './models/order.js';

const products = [
  { name: 'Προσωπικός Υπολογιστής', category: 'Ηλεκτρονικά', price: 899.9, description: 'Με επεξεργαστή 8 πυρήνων.' },
  { name: 'Οθόνη 27"', category: 'Ηλεκτρονικά', price: 279.5, description: 'Full HD, 75 Hz.' },
  { name: 'Πληκτρολόγιο RGB', category: 'Ηλεκτρονικά', price: 49.9, description: 'Μηχανικό με RGB φωτισμό.' },
  { name: 'Ασύρματο ποντίκι', category: 'Ηλεκτρονικά', price: 24.5, description: 'Εργονομικό, Bluetooth.' },
  { name: 'Βιβλίο: JavaScript', category: 'Βιβλία', price: 32.0, description: 'Οδηγός για σύγχρονη JavaScript.' },
  { name: 'Βιβλίο: React', category: 'Βιβλία', price: 38.5, description: 'Από τα βασικά στα hooks.' },
  { name: 'Βιβλίο: Βάση δεδομένων', category: 'Βιβλία', price: 29.0, description: 'Σχεδιασμός σχημάτων και ερωτήματα.' },
  { name: 'Τσάντα από καντόν', category: 'Τσάντες', price: 45.0, description: 'Φιτζάκι καφέ, χειροποίητο.' },
  { name: 'Παλτό δερμάτινο', category: 'Αξεσουάρ', price: 59.0, description: 'Αυθεντικό δέρμα.' },
  { name: 'Φανός LED', category: 'Αξεσουάρ', price: 18.5, description: 'Με 3 επίπεδα φωτισμού.' },
  { name: 'Ελληνικό λεξικό', category: 'Βιβλία', price: 19.9, description: 'Μπλε εξώφυλλο.' },
  { name: 'Μπλε μπλουζάκι', category: 'Ένδυση', price: 22.0, description: '100% βαμβάκι, όλα τα μεγέθη.' }
];

async function main() {
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

  const created = await Product.insertMany(
    products.map((product, index) => ({ ...product, available: index % 5 !== 4 }))
  );

  console.log(`[seed] ${created.length} προϊόντα, Admin: ${admin.email}, User: ${user.email}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('[seed] Αποτυχία:', error);
  process.exit(1);
});
