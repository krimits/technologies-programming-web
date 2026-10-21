/* Integration tests του REST API (node:test + supertest + mongodb-memory-server).
   npm test */

import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createApp } from '../src/app.js';
import { User } from '../src/models/user.js';
import { Product } from '../src/models/product.js';
import { Order } from '../src/models/order.js';

let mongod;
let app;

/* ---- βοηθητικά ---- */

async function createUser({ firstName = 'ΜΑΡΙΑ', lastName = 'ΧΡΗΣΤΗ', email = 'user@aueb.gr', role = 'User', password = 'User123!' } = {}) {
  const hashed = await bcrypt.hash(password, 10);
  return User.create({ firstName, lastName, email, password: hashed, role });
}

async function login(app, email, password = 'User123!') {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  return response.body.token;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);
});

/* ---- Ακαδημαϊκή ακεραιότητα ---- */

test('οι κωδικοί αποθηκεύονται hashed και ποτέ δεν επιστρέφονται', async () => {
  await createUser({ email: 'maria@aueb.gr' });

  const stored = await User.findOne({ email: 'maria@aueb.gr' }).select('+password');
  assert.notEqual(stored.password, 'User123!');
  assert.match(stored.password, /^\$2[aby]\$/);

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria@aueb.gr', password: 'User123!' });

  assert.equal(loginResponse.status, 200);
  assert.equal(loginResponse.body.user.password, undefined);
  assert.ok(loginResponse.body.token);

  const listResponse = await request(app).get('/api/products');
  assert.equal(JSON.stringify(listResponse.body).includes('$2a$'), false);
});

/* ---- Εγγραφή / σύνδεση ---- */

test('εγγραφή: 201 και χωρίς password στην απάντηση', async () => {
  const response = await request(app).post('/api/auth/register').send({
    firstName: 'ΓΕΩΡΓΙΟΣ',
    lastName: 'ΠΑΠΑΔΟΠΟΥΛΟΥ',
    email: 'georgios@aueb.gr',
    password: '123A$6789',
    confirmation: '123A$6789'
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, 'georgios@aueb.gr');
  assert.equal(response.body.user.role, 'User');
  assert.equal(response.body.user.password, undefined);
});

test('εγγραφή με μη έγκυρο όνομα (πεζά ελληνικά) → 400', async () => {
  const response = await request(app).post('/api/auth/register').send({
    firstName: 'γεώργιος',
    lastName: 'ΠΑΠΑΔΟΠΟΥΛΟΥ',
    email: 'g@aueb.gr',
    password: '123A$6789',
    confirmation: '123A$6789'
  });

  assert.equal(response.status, 400);
  assert.ok(response.body.details.firstName);
});

test('εγγραφή με τόνο στο όνομα → 400', async () => {
  const response = await request(app).post('/api/auth/register').send({
    firstName: 'ΓΙΏΡΓΟΣ',
    lastName: 'ΠΑΠΑΔΟΠΟΥΛΟΥ',
    email: 'g2@aueb.gr',
    password: '123A$6789',
    confirmation: '123A$6789'
  });

  assert.equal(response.status, 400);
});

test('εγγραφή με ασθενή κωδικό → 400', async () => {
  const response = await request(app).post('/api/auth/register').send({
    firstName: 'ΓΕΩΡΓΙΟΣ',
    lastName: 'ΠΑΠΑΔΟΠΟΥΛΟΥ',
    email: 'g3@aueb.gr',
    password: 'abc',
    confirmation: 'abc'
  });

  assert.equal(response.status, 400);
  assert.ok(response.body.details.password);
});

test('duplicate email → 400', async () => {
  await createUser({ email: 'dupe@aueb.gr' });

  const response = await request(app).post('/api/auth/register').send({
    firstName: 'ΑΝΝΑ',
    lastName: 'ΜΑΡΙΑ',
    email: 'DUPE@aueb.gr',
    password: '123A$6789',
    confirmation: '123A$6789'
  });

  assert.equal(response.status, 400);
  assert.match(response.body.message, /χρησιμοποιείται ήδη/);
});

test('σύνδεση με λάθος κωδικό → 401', async () => {
  await createUser({ email: 'maria@aueb.gr' });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria@aueb.gr', password: 'ΛάθοςΚωδικός1!' });

  assert.equal(response.status, 401);
});

/* ---- Προϊόντα & ρόλοι ---- */

test('GET /api/products είναι public', async () => {
  await Product.create({ name: 'Βιβλίο', category: 'Βιβλία', price: 10 });
  const response = await request(app).get('/api/products');
  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 1);
});

test('POST /api/products χωρίς token → 401', async () => {
  const response = await request(app).post('/api/products').send({ name: 'X', category: 'Y', price: 1 });
  assert.equal(response.status, 401);
});

test('POST /api/products με User → 403', async () => {
  await createUser({ email: 'user@aueb.gr', role: 'User' });
  const token = await login(app, 'user@aueb.gr');

  const response = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'X', category: 'Y', price: 1 });

  assert.equal(response.status, 403);
});

test('POST /api/products με Admin → 201', async () => {
  await createUser({ email: 'admin@aueb.gr', role: 'Admin' });
  const token = await login(app, 'admin@aueb.gr');

  const response = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Βιβλίο React', category: 'Βιβλία', price: 38.5 });

  assert.equal(response.status, 201);
  assert.equal(response.body.product.name, 'Βιβλίο React');
});

test('POST /api/products με αρνητική τιμή → 400', async () => {
  await createUser({ email: 'admin@aueb.gr', role: 'Admin' });
  const token = await login(app, 'admin@aueb.gr');

  const response = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'X', category: 'Y', price: -5 });

  assert.equal(response.status, 400);
});

test('GET /api/products/:id άγνωστο id → 404', async () => {
  const response = await request(app).get('/api/products/64b8f0a0a0a0a0a0a0a0a0a');
  assert.equal(response.status, 404);
});

test('μη έγκυρο token → 401', async () => {
  const response = await request(app)
    .get('/api/orders')
    .set('Authorization', 'Bearer not-a-real-token');
  assert.equal(response.status, 401);
});

/* ---- Παραγγελίες ---- */

test('ο server υπολογίζει το σύνολο από τη βάση και αγνοεί την τιμή του client', async () => {
  await createUser({ email: 'user@aueb.gr', role: 'User' });
  const token = await login(app, 'user@aueb.gr');

  const product = await Product.create({ name: 'Βιβλίο', category: 'Βιβλία', price: 20 });

  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ productId: String(product._id), qty: 3, price: 0.01, total: 0.01 }]
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.order.total, 60);
  assert.equal(response.body.order.items[0].price, 20);
  assert.equal(response.body.order.items[0].qty, 3);
});

test('παραγγελία με αρνητική ποσότητα → 400', async () => {
  await createUser({ email: 'user@aueb.gr', role: 'User' });
  const token = await login(app, 'user@aueb.gr');
  const product = await Product.create({ name: 'Βιβλίο', category: 'Βιβλία', price: 20 });

  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: String(product._id), qty: -2 }] });

  assert.equal(response.status, 400);
});

test('παραγγελία με κενό καλάθι → 400', async () => {
  await createUser({ email: 'user@aueb.gr', role: 'User' });
  const token = await login(app, 'user@aueb.gr');

  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [] });

  assert.equal(response.status, 400);
});

test('παραγγελία με άγνωστο προϊόν → 400', async () => {
  await createUser({ email: 'user@aueb.gr', role: 'User' });
  const token = await login(app, 'user@aueb.gr');

  const response = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: '64b8f0a0a0a0a0a0a0a0a0a', qty: 1 }] });

  assert.equal(response.status, 400);
});

test('ο User βλέπει μόνο τις δικές του παραγγελίες, ο Admin όλες', async () => {
  const product = await Product.create({ name: 'Βιβλίο', category: 'Βιβλία', price: 10 });

  await createUser({ email: 'user@aueb.gr', role: 'User' });
  await createUser({ email: 'other@aueb.gr', role: 'User' });
  await createUser({ email: 'admin@aueb.gr', role: 'Admin' });

  const userToken = await login(app, 'user@aueb.gr');
  const otherToken = await login(app, 'other@aueb.gr');
  const adminToken = await login(app, 'admin@aueb.gr');

  await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ items: [{ productId: String(product._id), qty: 1 }] });

  await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${otherToken}`)
    .send({ items: [{ productId: String(product._id), qty: 2 }] });

  const asUser = await request(app).get('/api/orders').set('Authorization', `Bearer ${userToken}`);
  assert.equal(asUser.status, 200);
  assert.equal(asUser.body.orders.length, 1);
  assert.equal(asUser.body.orders[0].total, 10);

  const asAdmin = await request(app).get('/api/orders').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(asAdmin.body.orders.length, 2);
});

test('GET /api/orders χωρίς token → 401', async () => {
  const response = await request(app).get('/api/orders');
  assert.equal(response.status, 401);
});

/* ---- 404 & JSON παντού ---- */

test('άγνωστο endpoint → 404 JSON', async () => {
  const response = await request(app).get('/api/does-not-exist');
  assert.equal(response.status, 404);
  assert.ok(response.body.message);
});
