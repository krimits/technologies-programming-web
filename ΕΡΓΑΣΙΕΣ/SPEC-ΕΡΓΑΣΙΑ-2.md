# SPEC — Εργασία 2 (contracts, σχήματα, ασφάλεια)

Αναφορά/προδιαγραφή. Η υλοποίηση, τα ονόματα routes και ο σχεδιασμός είναι δικά σου.

## 1. Δομή έργου

```
/
├── client/                 # Vite + React (React Router)
│   ├── src/
│   │   ├── components/     # ProductCard, Navbar, Cart, ...
│   │   ├── pages/          # Catalog, Cart, Login/Register, MyOrders, AdminProducts
│   │   ├── api.js          # μοναδικό σημείο επικοινωνίας με το server
│   │   └── ...
│   └── vite.config.js      # proxy: /api -> http://localhost:<port>
└── server/
    ├── models/             # Mongoose schemas: user, product, order
    ├── routes/             # auth, products, orders
    ├── middleware/         # authRequired, roleRequired('Admin'), error handler
    ├── seed.js             # npm run seed
    ├── .env.example
    └── server.js
```

Ρυθμίσεις που δεν πρέπει να ξεχαστείς:
- **proxy** στο `vite.config.js` για να πηγαίνουν τα `/api` στο Express (αποφεύγεις CORS από την αρχή).
- `PORT` στο `.env` του server, και ίδιο port στο proxy.
- `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` στο `.env` (το `JWT_SECRET` **μην το βάλεις** στο git).
- `.env.example` με τα ίδια κλειδιά και κενές/placeholder τιμές.

## 2. Σχήματα Mongoose (ελάχιστα)

**users**
| πεδίο | τύπος | κανόνες |
|---|---|---|
| firstName / lastName | String | required |
| email | String | required, **unique**, lowercase, trim |
| password | String | required, bcrypt hash (ποτέ plaintext) |
| role | String | enum `['Admin','User']`, default `'User'` |
| registrationDate | Date | default now |
| timestamps | — | createdAt/updatedAt (βοηθάει) |

**products**
| πεδίο | τύπος | κανόνες |
|---|---|---|
| name | String | required |
| category | String | required (π.χ. `books`, `electronics`) |
| price | Number | required, **min 0** (validation server: αρνητική τιμή → 400) |
| available | Boolean | default true |
| description / image | String | προαιρετικά |

**orders**
| πεδίο | τύπος | κανόνες |
|---|---|---|
| user | ObjectId → User | required (ref) |
| items | [{ name, price, qty }] | required, **snapshot** (όχι μόνο ref) |
| total | Number | required, υπολογίζεται στον server |
| status | String | default `'Σε επεξεργασία'` (για το bonus) |
| date | Date | default now |

Σημείωση: η παραγγελία κρατά **ονομα και τιμή ανά προϊόν** (όπως ζητά η εργασία) → η παραγγελία
παραμένει σωστή ακόμα κι αν αλλάξει μετά τη τιμή του προϊόντος.

## 3. REST API — ενδεικτικά endpoints & status codes

| Method | Endpoint | Access | Επιτυχία | Πιθανά σφάλματα |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | 201 + χρήστης (χωρίς password) | 400 (validation/duplicate email) |
| POST | `/api/auth/login` | public | 200 + `{ token, user }` | 401 (λάθος credentials) |
| GET | `/api/products` | public/User | 200 + array | — |
| GET | `/api/products/:id` | public | 200 | 404 |
| POST | `/api/products` | **Admin** | 201 | 400, 401, 403 |
| PUT | `/api/products/:id` | **Admin** | 200 | 400, 401, 403, 404 |
| DELETE | `/api/products/:id` | **Admin** | 200/204 | 401, 403, 404 |
| GET | `/api/orders` | User (τα δικά του) / Admin (όλα) | 200 + array | 401 |
| POST | `/api/orders` | User | 201 + order | 400 (κενό καλάθι/άγνωστο προϊόν/ποσότητα ≤ 0), 401 |

Κανόνες:
- **Κάθε** απάντηση JSON, ακόμη και τα errors: `{ message: '...' }` (ή `{ error: ... }`) — συνεπής σχήμα.
- 400 = κακά δεδομένα · 401 = μη συνδεδεμένος · 403 = συνδεμένος χωρίς δικαίωμα · 404 = δεν υπάρχει · 201 = δημιουργήθηκε.
- Το **password hash δεν επιστρέφεται ποτέ** (ούτε στο login response, ούτε στο `GET /api/orders` με user).
- Error handling σε **κεντρικό middleware** (όχι `try/catch` σε κάθε route) → σωστό status + JSON.

## 4. Checkout — το σημαντικότερο σημείο της εργασίας

Client στέλνει: `[ { productId, qty } ]` — **μόνο** id και ποσότητα.
Server:
1. Φορτώνει τα προϊόντα από τη βάση με τα id τους.
2. Αν κάποιο id δεν υπάρχει → 400.
3. Αν ποσότητα ≤ 0 ή μη ακέραιος → 400.
4. Υπολογίζει `total` από τις **τιμές της βάσης** (αγνοεί τυχόν `price`/`total` που έστειλε ο client).
5. Δημιουργεί το έγγραφο order με items snapshot.

Αυτό είναι ρητό τεστ στον πίνακα δοκιμών («τροποποιημένη τιμή από τον client») και 15% + 10% της βαθμολογίας.
Πρόσεξε επίσης: μην κάνεις «stock check» μόνο στον client.

## 5. Auth & Roles

**bcrypt**: hash στο register, `compare` στο login, cost factor ≥ 10. Ποτέ plaintext, ποτέ στο response.

**JWT**:
- Login → `sign({ userId, role }, secret, { expiresIn: '2h' })` → επιστρέφεται στο client.
- Client → στέλνει `Authorization: Bearer <token>` σε κάθε προστατευμένο αίτημα.
- Server middleware: ελέγχει ύπαρξη/μορφή/υπογραφή/λήξη → 401 αν αποτύχει.
- Role middleware: φορτώνει τον χρήστη (ή διαβάζει το role από το verified token) → 403 αν ο ρόλος δεν ταιριάζει.
- Προσοχή: το token περιέχει `role`· αν ο χρήστης αλλάξει ρόλο, το παλιό token μένει έγκυρο μέχρι να λήξει.
  Αν το θεωρείς μπλεμμα, κάνε lookup του χρήστη στο DB στο middleware (καθαρότερο, λίγο πιο αργό).

**Μοναδικότητα email**: unique index στο schema + χειροκίνητος έλεγχος στο register (ώστε να
επιστρέφεται καθαρό 400 αντί για γενικό duplicate-key error 500).

## 6. Client (React)

- `api.js`: μοναδικό σημείο για όλες τις κλήσεις (`authApi`, `productsApi`, `ordersApi`),
  με κοινή ρύθμιση του `Authorization` header όταν υπάρχει token, και **κοινό** χειρισμό errors
  (π.χ. wrapper που πετάει/επιστρέφει το `message` από το JSON).
- Token: `localStorage` (ή `sessionStorage`) — επιλογή που πρέπει να εξηγήσεις στην προφορική
  (trade-off: convenience vs XSS risk). Καθάρισε το token στο logout.
- `useState` για το UI state, `useEffect` για αρχικό fetch, με cleanup και σωστές dependencies.
- Derived state (π.χ. filtered products, total) υπολογίζεται στο render, **όχι** σε effect + state.
- Cart: στο `localStorage` (κλειδί π.χ. `cart`), αλλά το **server** είναι η αλήθεια για τις τιμές.
- Μην κάνεις `fetch` στα components: όλα μέσω `api.js`.
- Κάθε σελίδα που φορτώνει δεδομένα χρειάζεται loading + error + empty state.
- React Router: `BrowserRouter` + routes για catalog / cart / login / register / orders / admin,
  με προστασία admin route (UI) — **αλλά** η προστασία πραγματική είναι στο server.

## 7. Seed script

- `npm run seed` → καθαρίζει/επαναδημιουργεί τα δεδομένα (ή κάνει upsert, όχι duplicate).
- ≥10 προϊόντα σε **πολλές κατηγορίες** (ώστε το φίλτρο κατηγορίας να έχει νόημα).
- 1 Admin + 1 User με **γνωστά** credentials (τα βάζεις στο README) — π.χ. `admin@aueb.gr` / `admin123`.
- Οι κωδικοί στο seed περνούν από bcrypt (για να μπορεί να κάνει login).
- Ο seed πρέπει να τερματίζει με σωστό exit code και να τυπώνει τι έκανε.

## 8. Checklist ασφάλειας

- [ ] Κανένα secret στον κώδικα (μόνο `process.env.*`)
- [ ] `.env` στο `.gitignore`, `.env.example` στο repo
- [ ] Password hash ποτέ στο response
- [ ] Όλα τα protected endpoints ελέγχονται στο server (401/403)
- [ ] Validation στον server για κάθε input (όχι εμπιστοσύνη στον client)
- [ ] Ο server δεν δέχεται τιμές/συνόλα από τον client
- [ ] Μην επιστρέφεις στο client το σύνολο του error stack σε production (μήνυμα μόνο)

## 9. Πριν την παράδοση

- [ ] `npm install` → `npm run seed` → `npm run dev` από καθαρό clone (README πρέπει να δουλεύει 1-1)
- [ ] Κανένα `node_modules`/`.env` στο zip
- [ ] Πίνακας δοκιμών: οι 5 ενδεικτικές περιπτώσεις + 2-3 δικά σου, με το **πραγματικό** αποτέλεσμα
- [ ] Screenshots με τις 5 απαιτούμενες εικόνες
- [ ] Μπορώ να εξηγήσω κάθε endpoint και κάθε status code χωρίς να κοιτάξω
