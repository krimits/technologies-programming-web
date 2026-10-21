# Τεχνολογίες και Προγραμματισμός Εφαρμογών στον Ιστό — Εργασίες 1 & 2

Φάκελος με τα παραδοτέα των δύο εργασιών του μαθήματος (ΟΠΑ, Χειμερινό Εξάμηνο 2026–2027,
διδάσκουσα: Δρ. Μαριέττου Σαβίνα).

| Φάκελος | Περιεχόμενο |
|---|---|
| `Εργασία 1/` | Θέμα Α — CRUD εφαρμογή διαχείρισης χρηστών (HTML/CSS/JS, χωρίς frameworks) |
| `Εργασία 2/` | Mini e-shop — React (Vite) + Express + MongoDB/Mongoose |
| `ΕΡΓΑΣΙΕΣ/` | Χρονοδιάγραμμα, checklists, specs, README templates (οργάνωση/πλάνο) |
| `ΕΡΓΑΣΙΕΣ 1 και 2 - 2026-27 (κείμενο).txt` | Το κείμενο της εργασίας σε μορφή text (για αναφορά/αναζήτηση) |

> Το PDF της εργασίας δεν περιλαμβάνεται στο repository — παραμένει μόνο τοπικά.

## Τρέξιμο γρήγορα

**Εργασία 1** — χωρίς εγκατάσταση: άνοιξε `Εργασία 1/index.html` σε browser.
(Αν δεν αποθηκεύονται τα δεδομένα στο `localStorage`, τρέξε έναν static server, π.χ.
`npx serve "Εργασία 1"`.)

**Εργασία 2** — χρειάζεται Node.js 18+ και MongoDB:

```bash
cd "Εργασία 2/server"
npm install
copy .env.example .env      # Windows (Linux/macOS: cp)
npm run seed                # 12 προϊόντα, 1 Admin, 1 User
npm run dev                 # API στο :4000

cd ../client
npm install
npm run dev                 # app στο http://localhost:5173
```

Λογαριασμοί δοκιμής: `admin@aueb.gr / Admin123!` · `user@aueb.gr / User123!`

## Κατάσταση ελέγχων

| Έργασία | Έλεγχοι | Αποτέλεσμα |
|---|---|---|
| Εργασία 1 | 49 unit tests (κανόνες ονόματος/password/email, `UserStore`/localStorage) + 30 end-to-end tests σε headless Edge | ✅ 79/79 |
| Εργασία 2 | 21 integration tests του REST API (`node:test` + `supertest` + `mongodb-memory-server`) | ✅ 21/21 |

Οι εντολές εκτέλεσης των tests: `cd "Εργασία 1"` → `node <test file>` (βλ. README) και
`cd "Εργασία 2/server" && npm test`.
