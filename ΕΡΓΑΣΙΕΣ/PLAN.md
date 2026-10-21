# ΕΡΓΑΣΙΕΣ 1 & 2 — Χρονοδιάγραμμα και Master Plan

Μάθημα: Τεχνολογίες και Προγραμματισμός Εφαρμογών στον Ιστό (ΟΠΑ, ΤΥΠ)
Διδάσκουσα: Δρ. Μαριέττου Σαβίνα
Χειμερινό εξάμηνο 2026–2027

## Βασικά στοιχεία

| | |
|---|---|
| Ομάδα | 2 άτομα (ίδια ομάδα και στις 2 εργασίες) |
| Εργασία 1 | υποχρεωτική, 15% του μαθήματος, παράδοση **Δευ 21/12/2026 23:59** |
| Εργασία 2 | προαιρετική, +15% του μαθήματος, παράδοση **Παρ 15/01/2027 23:59** |
| Βαθμολογία | Τ.Β. = 0,15·Β(Ε1) + 0,15·Β(Ε2) + 0,70·Β(γραπτό) (αν παραδώσεις και τις δύο) |
| Προφορική | υποχρεωτική, **ανά μέλος** (μπορεί να διαφέρει ο βαθμός μεταξύ μελών) |
| Παράδοση | eclass, ένα zip ανά εργασία, όνομα `p3xxxxxx-p3yyyyyy.zip`, χωρίς `node_modules`, με README |
| Κατανομή | Βαθμός ανά εργασία: 10, με bonus έως +10% (κάθε επέκταση +5%) |

## Βασική αρχή (μη την παραβλεψεις)

Η προφορική εξέταση ζητά «εξήγηση κάθε γραμμής» + **μία μικρή ζωντανή αλλαγή στον κώδικά σου**.
Άρα: γράφεις εσύ τον κώδικα, αλλάζεις όσο θέλεις, ξαναγράφεις, και κρατάς τον καθαρό και σχολιασμένο.
Το AI/ChatGPT βοηθά σε ερωτήματα, επεξηγήσεις, review και debug — όχι σε «έτοιμη παράδοση».
Μην κάνεις copy-paste κώδικα που δεν μπορείς να εξηγήσεις: χάνεται στο «Σχεδίαση κώδικα» (10%) και
στο «καθαρός κώδικας/σχόλια» (10%), και σε κάθε άλλο κριτήριο που το παρακολουθεί.

## Φάσεις Εργασίας 1 (target: 18–24 ώρες)

| # | Φάση | Περιεχόμενο | Ώρες | Πότε |
|---|---|---|---|---|
| 1.1 | Σκελέτος | index.html σημασιολογική δομή, style.css, logic.js, γραμμή εκτέλεσης, git init | 1,5–2 | 22–23 Νοε |
| 1.2 | Φόρμα + validation | 7 πεδία, live «Έγκυρο/λάθος», ελληνικά κεφαλαία χωρίς τόνους, email format+uniqueness, password rules + ✔/✘, confirm | 4,5–6 | 24–27 Νοε |
| 1.3 | CRUD πίνακας | πίνακας με Edit/Delete, confirm στη διαγραφή, modal ή inline edit | 2,5–3 | 28–30 Νοε |
| 1.4 | Sort / Search / Filter | 3 στήλες asc+desc, keyword σε όνομα/επώνυμο/email, φίλτρο ρόλου, κενό «Δεν βρέθηκαν χρήστες» | 2,5–3 | 1–3 Δεκ |
| 1.5 | Δομή + αποθήκευση | κλάση `User`, κλάση `UserStore` (add/find/update/delete), `localStorage` key `users`, stringify/parse, save μετά από κάθε αλλαγή | 1,5–2 | 4–5 Δεκ |
| 1.6 | CSS / responsive / UX | layout, mobile χωρίς οριζόντια scroll, μηνύματα επιτυχίας/λάθους, states κενού/φόρτωσης | 2,5–3 | 6–8 Δεκ |
| 1.7 | Έλεγχος + έγγραφα | test pass σε DevTools (Application → Local Storage → `users`), README, `screenshots.pdf` (7 εικόνες με captions) | 3–4 | 9–11 Δεκ |
| 1.8 | Buffer | bugfix, polish, τελικό zip, υποβολή | 2–3 | 12–20 Δεκ |
| 1.B | Bonus (προαιρετικό) | export/import CSV+JSON (3h) · pagination (2h) · undo delete (1h) | 0–6 | 13–19 Δεκ |
| | **Σύνολο** | | **18–24 (+0–6)** | |

Milestone gate: στις **8 Δεκ** πρέπει να δουλεύουν form+CRUD+localStorage (80% του βαθμού).
Αν δεν έχεις ολοκληρώσει validation + CRUD στις 3 Δεκ, διόρθωσε το scope: bonus πάντα τελευταίο.

## Φάσεις Εργασίας 2 (target: 28–38 ώρες)

| # | Φάση | Περιεχόμενο | Ώρες | Πότε |
|---|---|---|---|---|
| 2.0 | Contracts (2 ώρες, μαζί) | endpoint list, σχήματα JSON, roles matrix, `api.js` interface — γραμμένο ΠΡΙΝ από τον κώδικα | 2 | 22–23 Ιαν |
| 2.1 | Setup | `server/` + `client/` (Vite React), Express, Mongoose σύνδεση, `.env` + `.env.example`, proxy στο `vite.config.js` | 2,5–3 | 24–26 Ιαν |
| 2.2 | Σχήματα + seed | `users`/`products`/`orders` schemas (required, unique email, indexes), `npm run seed` (≥10 προϊόντα, 1 Admin, 1 User) | 2,5–3 | 27–29 Ιαν |
| 2.3 | Auth | register/login/logout, bcrypt (10+ rounds), JWT, middleware `authRequired` + `roleRequired`, 401/403 | 3–4 | 30 Ιαν–2 Φεβ |
| 2.4 | Products + roles | GET/POST/PUT/DELETE `/api/products`, εφαρμογή roles (Admin only για write) | 2,5–3 | 3–5 Φεβ |
| 2.5 | Cart + checkout + orders | client cart στο `localStorage`, POST `/api/orders` με μόνο id+qty, **ο server υπολογίζει total**, snapshot items (name/price/qty), `GET /api/orders` (μόνο δικά μου) | 3–4 | 6–9 Φεβ |
| 2.6 | React εφαρμογή | router, pages: catalog/cart/login-register/my-orders/admin, components `ProductCard/Navbar/Cart`, `useState`/`useEffect`, `api.js`, μηνύματα επιτυχίας/λάθους, loading states | 6–8 | 10–16 Φεβ |
| 2.7 | Validation + ασφάλεια | ίδιοι κανόνες φόρμας σε client & server, 400 + JSON, secrets μόνο στο `.env` | 1,5–2 | 17–18 Φεβ |
| 2.8 | Δοκιμές + έγγραφα | πίνακας δοκιμών ≥5 περιπτώσεις, README (λογαριασμοί Admin/User, βήματα), `screenshots.pdf` | 2,5–3 | 19–22 Φεβ |
| 2.9 | Buffer / integration | end-to-end pass, edge cases, τελικό zip χωρίς `node_modules`/`.env` | 3–4 | 23–29 Φεβ |
| 2.B | Bonus (προαιρετικό) | reviews 1–5 + μέσος όρος (3h) · order status workflow (2h) · server pagination (2h) | 0–7 | 30 Ιαν–14 Φεβ |
| | **Σύνολο** | | **28–38 (+0–7)** | |

Hard gate στις **9 Φεβ**: πρέπει να δουλεύουν auth + ένα endpoint προϊόντων + ανάγνωση από DB.
Αν κάνεις και τις δύο εργασίες, μην ξεκινήσεις την Ε2 αν η Ε1 δεν έχει παραδοθεί/δοκιμαστεί.

## Κατανομή στην ομάδα (2 άτομα)

**Εργασία 1**

| Μέλος | Κύρια ευθύνη | Δευτερεύουσα |
|---|---|---|
| A | Φόρμα + live validation + `User`/`UserStore` + localStorage | CSS/responsive |
| B | Πίνακας CRUD + sort/search/filter | Φόρμα/validation (review) |
| Κοινό | README, screenshots, τελικός έλεγχος, διάβασμα του κώδικα του άλλου | |

**Εργασία 2**

| Μέλος | Κύρια ευθύνη | Δευτερεύουσα |
|---|---|---|
| A | `server/`: Express, Mongoose, seed, auth (bcrypt/JWT), middleware ρόλων, orders | seed script, validation server |
| B | `client/`: React/Vite, router, pages, components, `api.js`, cart στο localStorage | μηνύματα/UX |
| Κοινό | contracts, integration, πίνακας δοκιμών, README, screenshots | |

Κανόνας ομάδας: **κάθε μέλος πρέπει να μπορεί να εξηγήσει όλο τον κώδικα.**
Πιο πρακτικό: κάθε εβδομάδα 30 λεπτά «cross-review» (ο ένας διαβάζει/εξηγεί τον κώδικα του άλλου).

## Risk register

| Κίνδυνος | Συνέπεια | Αντιμετώπιση |
|---|---|---|
| Κολλάει στο debug (ειδικά Ε2: token/proxy/state) | χάνεις bonus και polish | deadline ανά φάση, όχι «μαζεύω και τελειώνω τα πάντα» |
| Bonus εν πιον επιλογής | +0% bonus, ίδια βαθμολογία βασικού | bonus μόνο αν η βασική εργασία είναι 100% και δοκιμασμένη |
| `screenshots.pdf` ξεχνιέται | −5% (Ε1), −5% (Ε2) | τα screenshots τα βγάζεις *κατά τη διάρκεια*, όχι την τελευταία μέρα |
| Μη λειτουργικό README | −5% | template: `ΕΡΓΑΣΙΕΣ/README-TEMPLATE.md` |
| «Δεν μπορώ να εξηγήσω τον κώδικα» | πολύ μεγάλο ρίσκο στην προφορική | γράφε/διάβαζε τον κώδικά σου, όχι copy-paste |
| Δεν υπάρχει MongoDB εγκατεστημένο | μπλόκο στο 2.1 | έλεγξε το environment **πριν** τις 24 Ιαν (docker/ Compass) |
| Διπλότυπες εγγραφές στο localStorage μετά απο άνοιγμα 2 tabs | bug «μυστηριώδης» | single source of truth στο `UserStore`, γράψε πάντα μέσω store |

## Πώς χρησιμοποιείται αυτός ο φάκελος

- `PLAN.md` (εδώ) — χρονοδιάγραμμα, budget, κατανομή, risks.
- `ΕΡΓΑΣΙΑ-1-CHECKLIST.md` — checklist αποδοχής ανά απαίτηση (βάση βαθμολογίας) με ώρες.
- `ΕΡΓΑΣΙΑ-2-CHECKLIST.md` — idem για την Ε2 + πίνακας δοκιμών.
- `SPEC-ΕΡΓΑΣΙΑ-1.md` — ακριβής προδιαγραφή rules/validation/αποθήκευσης (τα «κρυφά» σημεία).
- `SPEC-ΕΡΓΑΣΙΑ-2.md` — endpoints, status codes, roles matrix, σχήμα εγγράφου παραγγελίας, env vars.
- `README-TEMPLATE.md` — σκελέτος README + λίστα screenshots + πίνακας δοκιμών.
- `ΕΡΓΑΣΙΕΣ 1 και 2 - 2026-27 (κείμενο).txt` — πλήρες κείμενο του PDF (για αναφορά).
