/* Entry point: σύνδεση στη MongoDB και εκκίνηση του HTTP server. */

import mongoose from 'mongoose';
import { config } from './config/env.js';
import { createApp } from './app.js';

async function main() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log(`[db] Σύνδεση OK: ${config.mongoUri}`);

    const app = createApp();
    app.listen(config.port, () => {
      console.log(`[server] Ο API ακούει στο http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('[db] Αποτυχία σύνδεσης στη MongoDB:', error.message);
    process.exit(1);
  }
}

main();
