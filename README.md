# Τεχνολογίες και Προγραμματισμός Εφαρμογών στον Ιστό — Εργασίες 1 & 2

Φάκελος με τα παραδοτέα των δύο εργασιών του μαθήματος (ΟΠΑ, Χειμερινό Εξάμηνο 2026–2027,
διδάσκουσα: Δρ. Μαριέττου Σαβίνα).

| Φάκελος | Περιεχόμενο |
|---|---|
| `Εργασία 1/` | Θέμα Β — Mini e-shop: CRUD προϊόντων + εγγραφή πελάτη με live validation (HTML/CSS/JS, χωρίς frameworks) |
| `Εργασία 2/` | Mini e-shop — η επέκταση της Εργασίας 1 σε React (Vite) + Express + MongoDB/Mongoose |
| `ΕΡΓΑΣΙΕΣ/` | Χρονοδιάγραμμα, checklists, specs, README templates (οργάνωση/πλάνο) |
| `ΕΡΓΑΣΙΕΣ 1 και 2 - 2026-27 (κείμενο).txt` | Το κείμενο της εργασίας σε μορφή text (για αναφορά/αναζήτηση) |

> Το PDF της εργασίας δεν περιλαμβάνεται στο repository — παραμένει μόνο τοπικά.

## Τρέξιμο γρήγορα

**Εργασία 1** — χωρίς εγκατάσταση: άνοιξε `Εργασία 1/index.html` σε browser.
Στην πρώτη επίσκεψη ο κατάλογος γεμίζει με 12 ενδεικτικά προϊόντα (κλειδί `products`).

**Από την Εργασία 1 στην Εργασία 2.** Η Εργασία 2 ξεκινά με τα ίδια 12 προϊόντα
(`Εργασία 2/server/data/products.json`), τους ίδιους κανόνες επικύρωσης και τις ίδιες
μεταβλητές χρωμάτων. Ένα αρχείο από την «Εξαγωγή JSON» της Εργασίας 1 φορτώνεται στη
MongoDB με `npm run seed -- <διαδρομή>/products.json`.

**Εργασία 2** — χρειάζεται Node.js 18+ και MongoDB:

```bash
cd "Εργασία 2/server"
npm install
copy .env.example .env      # Windows (Linux/macOS: cp)
npm run seed                # 12 προϊόντα (από data/products.json), 1 Admin, 1 User
npm run dev                 # API στο :4000

cd ../client
npm install
npm run dev                 # app στο http://localhost:5173
```

Λογαριασμοί δοκιμής: `admin@aueb.gr / Admin123!` · `user@aueb.gr / User123!`

## Κατάσταση ελέγχων

| Έργασία | Έλεγχοι | Αποτέλεσμα |
|---|---|---|
| Εργασία 1 | 45 end-to-end tests σε headless Chromium (κανόνες επικύρωσης, CRUD, ταξινόμηση, αναζήτηση/φίλτρο, σελιδοποίηση, αναίρεση, import/export, `localStorage`, κινητό 360px) | ✅ 45/45 |
| Εργασία 2 | 33 integration tests του REST API (`node:test` + `supertest` + `mongodb-memory-server`) + 16 έλεγχοι στον browser (React → Express → MongoDB) | ✅ 33/33 και 16/16 |

Τα tests της Εργασίας 2: `cd "Εργασία 2/server" && npm test`.
