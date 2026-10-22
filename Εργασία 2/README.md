# Εργασία 2 — Mini E-shop (Κατάλογος, Καλάθι, Ταυτοποίηση)

Ολοκληρωμένη διαδικτυακή εφαρμογή e-shop με **React (Vite + React Router)** στον client,
**Node.js + Express** στον server και **MongoDB (Mongoose)** για τη βάση δεδομένων.
Περιλαμβάνει εγγραφή/σύνδεση με JWT, ρόλους (User/Admin) με έλεγχο στον server, κατάλογο
προϊόντων, καλάθι στο `localStorage`, παραγγελίες με υπολογισμό τιμών **από τη βάση**,
ιστορικό παραγγελιών και διαχείριση προϊόντων για Admin.

**Μέλη ομάδας:** ........................ (ΑΜ: p3xxxxxx) — υπεύθυνο/α: ................................
........................ (ΑΜ: p3yyyyyy) — υπεύθυνο/α: ................................

---

## Προαπαιτούμενα

- **Node.js 18+** (έλεγχος: `node -v`) και npm
- **MongoDB Community Server** (τοπικά) ή MongoDB Atlas — δείς τις οδηγίες εγκατάστασης
  https://www.mongodb.com/try/download/community. Εναλλακτικά, το MongoDB Compass
  (https://www.mongodb.com/products/compass) για τη διαχείριση της βάσης.

## Εκτέλεση

### 1) Server

```bash
cd server
npm install
cp .env.example .env        # Windows: copy .env.example .env
# ρύθρισε το .env: MONGO_URI, JWT_SECRET, PORT
npm run seed                # γεμίζει τη βάση: 12 προϊόντα, 1 Admin, 1 User
npm run dev                 # ή `npm start`
```

### 2) Client (σε άλλο terminal)

```bash
cd client
npm install
npm run dev
```

Άνοιξε **http://localhost:5173**. Το `vite.config.js` κάνει proxy τα `/api` στο
`http://localhost:4000`, οπότε δεν χρειάζεται CORS κατά την ανάπτυξη.

### Λογαριασμοί δοκιμής (από το seed)

| Ρόλος | Email | Password |
|---|---|---|
| Admin | `admin@aueb.gr` | `Admin123!` |
| User | `user@aueb.gr` | `User123!` |

> Σε Windows, αν το `cp` δεν δουλεύει: `Copy-Item .env.example .env`

## Δομή

```
Εργασία 2/
├── client/                      # React (Vite)
│   ├── index.html
│   ├── vite.config.js           # proxy /api -> http://localhost:4000
│   └── src/
│       ├── api.js               # ΜΟΝΑΔΙΚΟ σημείο επικοινωνίας με το API
│       ├── App.jsx              # διαδρομές (React Router)
│       ├── main.jsx
│       ├── styles.css
│       ├── components/          # Navbar, ProductCard, ProtectedRoute, Message
│       ├── context/             # AuthContext (JWT), CartContext (localStorage)
│       ├── lib/validators.js    # ίδιοι κανόνες με τον server
│       └── pages/               # Catalog, Cart, Login, Register, MyOrders, AdminProducts
├── server/                      # Express + Mongoose
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── server.js            # σύνδεση DB + listen
│   │   ├── app.js               # createApp() — routes + middleware
│   │   ├── config/env.js        # διαβάζει το .env
│   │   ├── models/              # user, product, order
│   │   ├── routes/              # auth, products, orders
│   │   ├── middleware/          # auth (JWT/roles), errorHandler
│   │   ├── utils/validators.js  # κανόνες επικύρωσης
│   │   └── seed.js              # npm run seed
│   └── tests/api.test.js        # 30 integration tests (node:test + supertest)
└── screenshots.pdf
```

## REST API

| Method | Endpoint | Πρόσβαση | Επιτυχία | Σφάλματα |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | 201 | 400 (validation / duplicate email) |
| POST | `/api/auth/login` | public | 200 | 401 (λάθος credentials) |
| GET | `/api/auth/me` | σύνδεση | 200 | 401 |
| GET | `/api/products` | public | 200 | — |
| GET | `/api/products/:id` | public | 200 | 404 |
| POST | `/api/products` | **Admin** | 201 | 400, 401, 403 |
| PUT | `/api/products/:id` | **Admin** | 200 | 400, 401, 403, 404 |
| DELETE | `/api/products/:id` | **Admin** | 200 | 401, 403, 404 |
| GET | `/api/orders` | User (τα δικά του) / Admin (όλα) | 200 | 401 |
| POST | `/api/orders` | σύνδεση | 201 | 400 (κενό/άγνωστο/μη έγκυρο), 401 |
| PUT | `/api/orders/:id/status` | **Admin** (bonus) | 200 | 400, 401, 403, 404 |

Όλες οι απαντήσεις είναι JSON, ακόμα και τα errors (`{ "message": "..." }`).

## Αρχιτεκτονικές επιλογές (και γιατί)

**Ο server είναι η αλήθεια για τις τιμές.** Ο client στέλνει μόνο `productId` + `qty`.
Ο server βρίσκει τα προϊόντα στη βάση, υπολογίζει το σύνολο και αποθηκεύει την παραγγελία
(`routes/orders.js`). Κάθε `price`/`total` που έρχεται από τον client αγνοείται — υπάρχει
αυτοτελές test για αυτό. Η παραγγελία κρατά **snapshot** (όνομα/τιμή/ποσότητα), ώστε να μην
αλλάζει αν μεταβληθεί μετά την παραγγελία η τιμή του προϊόντος.

**Έλεγχος δικαιωμάτων στον server.** `requireAuth` (401) και `requireRole('Admin')` (403)
είναι middleware του Express. Το κρύψιμο κουμπιών στη React είναι μόνο UX· το endpoint
απορρίπτει όποιον δεν έχει δικαίωμα, ακόμα κι αν κάνει την κλήση με το DevTools.

**Ο ρόλος διαβάζεται από τη βάση, όχι από το token.** Στο `requireAuth` φορτώνεται ο χρήστης
από τη βάση, άρα ένας χρήστης που άλλαξε ρόλο δεν έχει παλιό token με παλιά δικαιώματα.

**Κωδικοί:** `bcrypt` (10 rounds) — το password στο schema έχει `select: false`, δηλαδή
**δεν επιστρέφεται ποτέ** σε κανένα query/response. Στο login ζητάμε το πεδίο ρητά
(`.select('+password')`).

**Secrets:** μόνο στο `.env` (δεν παραδίδεται)· παραδίδεται το `.env.example`. Κανένα
hard-coded secret στον κώδικα.

**Ένα σημείο επικοινωνίας στον client:** το `src/api.js`. Καμία κλήση `fetch()` δεν υπάρχει
στα components — όλα περνούν από εκεί, ώστε να μη διαχείριζεται το header/token πολλαπλά
στοιχεία. Οι errors του server μεταφέρονται ως `Error` με το μήνυμα του server.

**Ίδιοι κανόνες σε client & server:** οι κανόνες επικύρωσης (κεφαλαία ελληνικά χωρίς τόνους,
email, password) υπάρχουν σε `client/src/lib/validators.js` και `server/src/utils/validators.js`
με **ίδιο περιεχόμενο**. Ο client τα δείχνει αμέσως (UX), ο server τα ελέγχει ξανά (ασφάλεια).

**Καλάθι:** ζει στο `localStorage` (κλειδί `eshop_cart`) μέσω `CartContext`, άρα διατηρείται
μετά από refresh. Η εμφάνιση της τιμής είναι ενδεικτική — η αληθινή τιμή υπολογίζεται πάντα
στον server.

**State:** `useState` για το UI state και `useEffect` για το αρχικό fetch με cleanup.
Το derived state (φιλτραρισμένα προϊόντα, σύνολο καλαθιού) υπολογίζεται στο render με
`useMemo` — όχι σε effect + state.

## Τεστ

```bash
cd server
npm test
```

30 integration tests (`node:test` + `supertest` + `mongodb-memory-server` — σηκώνουν προσωρινή
MongoDB στη μνήμη, δεν χρειάζεται εγκατεστημένο server). Καλύπτουν: hashing, μη επιστροφή
password, 201/400 στην εγγραφή, duplicate email, 401 σε λάθος κωδικό, 400 σε μη αλφαριθμητικό
password (όχι 500), 401 χωρίς token, 403 για User, 201/200 για Admin σε POST/PUT/DELETE
προϊόντων, 404 (έγκυρο αλλά άγνωστο και μη έγκυρο id), 400 για αρνητική τιμή/ποσότητα/κενό
καλάθι/άγνωστο ή μη έγκυρο productId/μη διαθέσιμο προϊόν, αναζήτηση με regex ειδικούς
χαρακτήρες, υπολογισμό total από τη βάση (με παραποιημένη τιμή από τον client), απομόνωση
παραγγελιών ανά χρήστη και αλλαγή κατάστασης παραγγελίας μόνο από Admin. Δείτε το
`ΠΙΝΑΚΑΣ-ΔΟΚΙΜΩΝ.md`.

## Πίνακας δοκιμών

Με αναλυτικό πίνακα (5+ περιπτώσεις με αποτελέσματα): [`ΠΙΝΑΚΑΣ-ΔΟΚΙΜΩΝ.md`](./ΠΙΝΑΚΑΣ-ΔΟΚΙΜΩΝ.md).

## Screenshots

Το `screenshots.pdf` περιλαμβάνει: κατάλογο, καλάθι, σύνδεση, εγγραφή με μη έγκυρα πεδία,
ιστορικό παραγγελιών, διαχείριση προϊόντων (Admin) και προβολή σε κινητό — με λεζάντα σε κάθε εικόνα.

## Bonus που υλοποιήθηκαν

- **Σελιδοποίηση στον server:** `GET /api/products?page=2&limit=10` επιστρέφει
  `{ products, page, pageSize, total, totalPages }` (έτοιμο για buttons στη React).
- **Κατάσταση παραγγελίας:** ο Admin αλλάζει την κατάσταση μιας παραγγελίας
  (`PUT /api/orders/:id/status`: «Σε επεξεργασία → Απεστάλη → Ολοκληρώθηκε»), και ο User
  βλέπει την ενημερωμένη κατάσταση στο ιστορικό του. Στη σελίδα παραγγελιών ο Admin βλέπει
  τα στοιχεία του πελάτη κάθε παραγγελίας και αλλάζει την κατάσταση με select, ενώ ο User
  βλέπει μόνο τις δικές του.

## Γνωστά περιορισμάνα / σημειώσεις

- Ο token αποθηκεύεται στο `localStorage` (άνετο για development). Σε production
  προτιμότερο `httpOnly cookie` ή `sessionStorage`, γιατί το `localStorage` είναι
  προσβάσιμο από οποιονδήποτε script της σελίδας (XSS).
- Δεν υπάρχει refresh token: όταν λήξει το JWT (2h), ο χρήστης συνδέεται ξανά.
- Οι τιμές στο καλάθι εμφανίζονται για ευκολία· ο υπολογισμός γίνεται πάντα στον server.
- Το seed **καθαρίζει** τις συλλογές πριν γεμίσει, ώστε να είναι ασφαλές να εκτελείται
  πολλές φορές.
