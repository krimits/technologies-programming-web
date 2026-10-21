/* Application configuration.
   Every secret is read from the environment (.env) — nothing sensitive is hard-coded. */

import 'dotenv/config';

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eshop',
  jwtSecret: required('JWT_SECRET', 'dev-only-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10
};

if (config.jwtSecret === 'dev-only-secret') {
  console.warn('[config] Προειδοποίηση: χρησιμοποιείται προσωρινό JWT_SECRET. Ορίστε το στο .env.');
}
