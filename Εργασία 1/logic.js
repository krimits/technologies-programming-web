/* =========================================================
   Εργασία 1 — Θέμα Β: Mini e-shop
   logic.js — μοντέλο, κανόνες επικύρωσης, εμφάνιση, αποθήκευση
   ---------------------------------------------------------
   Ενότητες του αρχείου
      1. Ρυθμίσεις και αρχικά δεδομένα
      2. Βοηθητικές συναρτήσεις
      3. Κανόνες επικύρωσης (καθαρές συναρτήσεις, χωρίς DOM)
      4. Μοντέλο: Product / ProductStore και User / UserStore
      5. Live validation φορμών (κλάση FormController)
      6. Προϊόντα: φόρμα, πίνακας, ταξινόμηση, αναζήτηση, φίλτρο, σελίδες
      7. Διαγραφή με επιβεβαίωση και αναίρεση
      8. Εξαγωγή / εισαγωγή (bonus)
      9. Εγγραφή πελάτη
     10. Συνδέσεις γεγονότων και εκκίνηση

   Προς την Εργασία 2: οι ενότητες 3 και 4 δεν αγγίζουν το DOM. Οι κανόνες
   πηγαίνουν σχεδόν αυτούσιοι στα validators.js του client και του server,
   οι κλάσεις Product / User γίνονται σχήματα Mongoose και η
   ProductStore.search() αντιστοιχεί στο GET /api/products.
   ========================================================= */

'use strict';

/* =========================================================
   1. Ρυθμίσεις και αρχικά δεδομένα
   ========================================================= */

const PRODUCTS_KEY = 'products';   // κλειδί του localStorage για τα προϊόντα
const USERS_KEY = 'users';         // κλειδί του localStorage για τους πελάτες
const PAGE_SIZE = 10;              // προϊόντα ανά σελίδα
const UNDO_TIMEOUT_MS = 6000;      // πόσο μένει διαθέσιμο το κουμπί «Αναίρεση»

/** Οι κατηγορίες του καταστήματος. Από εδώ γεμίζουν η φόρμα και το φίλτρο. */
const CATEGORIES = ['Ηλεκτρονικά', 'Βιβλία', 'Ένδυση', 'Αξεσουάρ', 'Σπίτι'];

const PRODUCT_NAME_MIN = 2;
const PRODUCT_NAME_MAX = 80;
const PRICE_MIN = 0.01;
const PRICE_MAX = 99999.99;

/** Κεφαλαία ελληνικά χωρίς τόνους, με ένα κενό ή μία παύλα ανάμεσα σε λέξεις.
 *  Το εύρος Α-Ω (U+0391–U+03A9) δεν περιέχει τα Ά Έ Ή Ί Ό Ύ Ώ (U+0386–U+038F)
 *  ούτε τα Ϊ Ϋ (U+03AA–U+03AB), οπότε οι τόνοι αποκλείονται χωρίς άλλο έλεγχο.
 *  Το ίδιο κείμενο υπάρχει στο γνώρισμα pattern των πεδίων Όνομα / Επώνυμο. */
const GREEK_NAME_PATTERN = /^[Α-Ω]+([ \-][Α-Ω]+)*$/u;

/** Μορφή email: χαρακτήρες@domain.κατάληξη (τουλάχιστον 2 γράμματα στην κατάληξη). */
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** Οι κανόνες πολυπλοκότητας του password. Τους χρησιμοποιούν και ο έλεγχος
 *  (validatePassword) και οι ενδείξεις ✔ / ✘, ώστε να γράφονται μία φορά. */
const PASSWORD_RULES = [
  { id: 'length', text: 'τουλάχιστον 8 χαρακτήρες', test: (value) => value.length >= 8 },
  { id: 'letter', text: 'ένα γράμμα', test: (value) => /[A-Za-z]/.test(value) },
  { id: 'digit', text: 'έναν αριθμό', test: (value) => /\d/.test(value) },
  { id: 'symbol', text: 'ένα από τα !@#$%^&*', test: (value) => /[!@#$%^&*]/.test(value) }
];

/** Αρχικά προϊόντα. Μπαίνουν μόνο στην πρώτη επίσκεψη, όταν το κλειδί products
 *  δεν υπάρχει ακόμη. Είναι τα ίδια με το server/data/products.json της Εργασίας 2. */
const SAMPLE_PRODUCTS = [
  { name: 'Laptop 15"', category: 'Ηλεκτρονικά', price: 899.9, available: true },
  { name: 'Οθόνη 27"', category: 'Ηλεκτρονικά', price: 279.5, available: true },
  { name: 'Μηχανικό πληκτρολόγιο', category: 'Ηλεκτρονικά', price: 89.9, available: true },
  { name: 'Ασύρματο ποντίκι', category: 'Ηλεκτρονικά', price: 24.5, available: false },
  { name: 'Βιβλίο: Σύγχρονη JavaScript', category: 'Βιβλία', price: 32, available: true },
  { name: 'Βιβλίο: Μαθαίνοντας React', category: 'Βιβλία', price: 38.5, available: true },
  { name: 'Βιβλίο: Βάσεις Δεδομένων', category: 'Βιβλία', price: 29, available: false },
  { name: 'Βαμβακερό T-shirt', category: 'Ένδυση', price: 19.9, available: true },
  { name: 'Φούτερ με κουκούλα', category: 'Ένδυση', price: 44, available: true },
  { name: 'Σακίδιο για laptop', category: 'Αξεσουάρ', price: 49, available: true },
  { name: 'Θερμός 500 ml', category: 'Σπίτι', price: 18.5, available: true },
  { name: 'Φωτιστικό γραφείου LED', category: 'Σπίτι', price: 34.9, available: false }
];

/* =========================================================
   2. Βοηθητικές συναρτήσεις
   ========================================================= */

/** Μοναδικό id από τη χρονική στιγμή και ένα τυχαίο κομμάτι. */
function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Η σημερινή ημερομηνία ως YYYY-MM-DD σε τοπική ώρα
 *  (το toISOString() δίνει UTC και θα έδειχνε λάθος μέρα μετά τα μεσάνυχτα). */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** YYYY-MM-DD -> DD/MM/YYYY για εμφάνιση. */
function formatDate(isoDate) {
  const [year, month, day] = String(isoDate).split('-');
  return day ? `${day}/${month}/${year}` : String(isoDate);
}

const priceFormatter = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' });

/** 1234.5 -> «1.234,50 €» */
function formatPrice(price) {
  return priceFormatter.format(price);
}

/** «1 προϊόν» / «5 προϊόντα» */
function countProducts(count) {
  return `${count} ${count === 1 ? 'προϊόν' : 'προϊόντα'}`;
}

/** Για συγκρίσεις κειμένου: πεζά, χωρίς τόνους, με «ς» = «σ».
 *  Έτσι η αναζήτηση «βιβλιο» βρίσκει το «Βιβλίο». */
function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')                  // «ί» -> «ι» + σημάδι τόνου
    .replace(/[̀-ͯ]/g, '')   // αφαιρεί τα σημάδια τόνων / διαλυτικών
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .trim();
}

/** Escape πριν μπει κείμενο σε innerHTML: τα δεδομένα δεν γίνονται ποτέ HTML. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* =========================================================
   3. Κανόνες επικύρωσης
   Κάθε κανόνας επιστρέφει το μήνυμα λάθους, ή '' όταν η τιμή είναι έγκυρη.
   Δεν χρησιμοποιούν DOM, άρα τους καλούν και οι φόρμες και η εισαγωγή JSON.
   ========================================================= */

/* ---------- Προϊόν ---------- */

function validateProductName(value) {
  const name = String(value ?? '').trim();
  if (!name) return 'Το όνομα του προϊόντος είναι υποχρεωτικό.';
  if (name.length < PRODUCT_NAME_MIN) return `Το όνομα πρέπει να έχει τουλάχιστον ${PRODUCT_NAME_MIN} χαρακτήρες.`;
  if (name.length > PRODUCT_NAME_MAX) return `Το όνομα πρέπει να έχει έως ${PRODUCT_NAME_MAX} χαρακτήρες.`;
  return '';
}

function validateCategory(value) {
  if (!value) return 'Επιλέξτε κατηγορία.';
  if (!CATEGORIES.includes(value)) return `Άγνωστη κατηγορία «${value}».`;
  return '';
}

function validatePrice(value) {
  if (value === '' || value === null || value === undefined) return 'Η τιμή είναι υποχρεωτική.';
  if (typeof value !== 'number' && typeof value !== 'string') return 'Η τιμή πρέπει να είναι αριθμός.';
  const price = Number(value);
  if (!Number.isFinite(price)) return 'Η τιμή πρέπει να είναι αριθμός.';
  if (price < PRICE_MIN) return 'Η τιμή πρέπει να είναι θετική (τουλάχιστον 0,01 €).';
  if (price > PRICE_MAX) return 'Η τιμή δεν μπορεί να ξεπερνά τα 99.999,99 €.';
  // Έως 2 δεκαδικά. Η ανοχή 1e-6 χρειάζεται γιατί π.χ. 19.9 * 100 = 1989.9999999999998.
  if (Math.abs(price * 100 - Math.round(price * 100)) > 1e-6) return 'Η τιμή μπορεί να έχει έως δύο δεκαδικά ψηφία.';
  return '';
}

function validateAvailability(value) {
  return typeof value === 'boolean' ? '' : 'Η διαθεσιμότητα πρέπει να είναι true ή false.';
}

/** Ελέγχει ένα ολόκληρο προϊόν (π.χ. μια εγγραφή από αρχείο JSON).
 *  Επιστρέφει πίνακα με τα μηνύματα λάθους· κενός πίνακας = έγκυρο. */
function validateProduct(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['Η εγγραφή δεν είναι αντικείμενο JSON.'];
  }
  return [
    validateProductName(data.name),
    validateCategory(data.category),
    validatePrice(data.price),
    validateAvailability(data.available)
  ].filter((message) => message !== '');
}

/* ---------- Πελάτης ---------- */

/** label: «Το όνομα» ή «Το επώνυμο», για να βγαίνει σωστή πρόταση. */
function validateGreekName(value, label) {
  const name = String(value ?? '');
  if (!name.trim()) return `${label} είναι υποχρεωτικό.`;
  if (name !== name.trim()) return `${label} δεν πρέπει να αρχίζει ή να τελειώνει με κενό.`;
  if (!GREEK_NAME_PATTERN.test(name)) {
    return `${label} πρέπει να είναι με κεφαλαία ελληνικά χωρίς τόνους (π.χ. ΓΕΩΡΓΙΟΣ ή ΑΝΝΑ-ΜΑΡΙΑ).`;
  }
  return '';
}

function validateEmail(value) {
  const email = String(value ?? '').trim();
  if (!email) return 'Το email είναι υποχρεωτικό.';
  if (!EMAIL_PATTERN.test(email)) return 'Μη έγκυρη μορφή email (π.χ. onoma@example.gr).';
  return '';
}

function validateRole(value) {
  return value === 'Admin' || value === 'User' ? '' : 'Επιλέξτε ρόλο (Admin ή User).';
}

function validateRegistrationDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? '')) ? '' : 'Η ημερομηνία εγγραφής είναι υποχρεωτική.';
}

function validatePassword(value) {
  const password = String(value ?? '');
  if (!password) return 'Το password είναι υποχρεωτικό.';
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.text);
  if (missing.length > 0) return `Το password χρειάζεται ${missing.join(', ')}.`;
  return '';
}

function validateConfirmation(password, confirmation) {
  if (!confirmation) return 'Η επιβεβαίωση του password είναι υποχρεωτική.';
  if (password !== confirmation) return 'Τα δύο password δεν ταιριάζουν.';
  return '';
}

/* =========================================================
   4. Μοντέλο και αποθήκευση
   ========================================================= */

/** Ένα προϊόν του καταστήματος. */
class Product {
  constructor({ id, name, category, price, available }) {
    this.id = id || generateId();
    this.name = String(name).trim();
    this.category = category;
    this.price = Number(price);
    this.available = Boolean(available);
  }

  /** Το JSON.stringify καλεί αυτόματα την toJSON(): εδώ ορίζεται τι αποθηκεύεται. */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      price: this.price,
      available: this.available
    };
  }
}

/** Ένας πελάτης, όπως έρχεται από τη φόρμα εγγραφής. */
class User {
  constructor({ id, firstName, lastName, email, role, registrationDate, password }) {
    this.id = id || generateId();
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = String(email).trim().toLowerCase();
    this.role = role;
    this.registrationDate = registrationDate;
    // ΜΟΝΟ για εξάσκηση: σε πραγματική εφαρμογή ο κωδικός δεν αποθηκεύεται ποτέ στον browser.
    // Στην Εργασία 2 αποθηκεύεται στον server ως hash με bcrypt.
    this.password = password;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
      registrationDate: this.registrationDate,
      password: this.password
    };
  }
}

/**
 * Κοινή βάση για τις δύο συλλογές. Οι εγγραφές ζουν σε πίνακα JavaScript
 * (this.items) και αποθηκεύονται ως JSON σε ένα κλειδί του localStorage.
 * Κάθε αλλαγή (add / update / remove / restore) καλεί αμέσως save(),
 * άρα ο πίνακας στη μνήμη και το localStorage δεν διαφέρουν ποτέ.
 */
class LocalStorageStore {
  /**
   * @param {string} storageKey   το κλειδί στο localStorage
   * @param {Function} Model      η κλάση των εγγραφών (Product ή User)
   * @param {Array} initialData   εγγραφές για την πρώτη επίσκεψη
   */
  constructor(storageKey, Model, initialData = []) {
    this.storageKey = storageKey;
    this.Model = Model;
    this.initialData = initialData;
    this.items = [];
    this.load();
  }

  /** Διαβάζει τη συλλογή με JSON.parse. Αν το JSON είναι χαλασμένο ξεκινά κενή. */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw === null) {
        // Πρώτη επίσκεψη: το κλειδί δεν υπάρχει, άρα βάζουμε τα αρχικά δεδομένα.
        this.items = this.initialData.map((data) => new this.Model(data));
        this.save();
        return;
      }
      const parsed = JSON.parse(raw);
      this.items = Array.isArray(parsed) ? parsed.map((data) => new this.Model(data)) : [];
    } catch (error) {
      console.warn(`Το κλειδί «${this.storageKey}» δεν διαβάστηκε. Η λίστα ξεκινά κενή.`, error);
      this.items = [];
    }
  }

  /** Γράφει όλη τη συλλογή με JSON.stringify (καλεί την toJSON() κάθε εγγραφής). */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (error) {
      console.error(`Η αποθήκευση στο κλειδί «${this.storageKey}» απέτυχε.`, error);
    }
  }

  /** Αντίγραφο του πίνακα, ώστε κανείς να μην αλλάζει τη συλλογή χωρίς save(). */
  all() {
    return [...this.items];
  }

  get size() {
    return this.items.length;
  }

  findById(id) {
    return this.items.find((item) => item.id === id) || null;
  }

  add(data) {
    const item = new this.Model(data);
    this.items.push(item);
    this.save();
    return item;
  }

  /** Αντικαθιστά τα πεδία μιας εγγραφής, κρατώντας το ίδιο id. */
  update(id, data) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    this.items[index] = new this.Model({ ...this.items[index].toJSON(), ...data, id });
    this.save();
    return this.items[index];
  }

  /** Αφαιρεί μια εγγραφή και επιστρέφει και τη θέση της (για την αναίρεση). */
  remove(id) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const [item] = this.items.splice(index, 1);
    this.save();
    return { item, index };
  }

  /** Ξαναβάζει μια εγγραφή στη θέση που είχε πριν διαγραφεί. */
  restore(item, index) {
    this.items.splice(Math.min(index, this.items.length), 0, item);
    this.save();
  }
}

/** Τα προϊόντα, στο κλειδί «products». */
class ProductStore extends LocalStorageStore {
  constructor() {
    super(PRODUCTS_KEY, Product, SAMPLE_PRODUCTS);
  }

  /** Υπάρχει ήδη προϊόν με αυτό το όνομα; (χωρίς διάκριση πεζών / τόνων).
   *  Το excludeId αγνοεί το προϊόν που επεξεργαζόμαστε, αλλιώς θα «έπεφτε» πάνω στον εαυτό του. */
  hasName(name, excludeId = null) {
    const needle = normalizeText(name);
    return this.items.some((product) => product.id !== excludeId && normalizeText(product.name) === needle);
  }

  /**
   * Αναζήτηση: φιλτράρει με βάση το όνομα και την κατηγορία και ταξινομεί.
   * Επιστρέφει νέο πίνακα· η συλλογή δεν αλλάζει.
   * @param {{text?: string, category?: string, sortKey?: string|null, direction?: 'asc'|'desc'}} options
   */
  search({ text = '', category = 'all', sortKey = null, direction = 'asc' } = {}) {
    const needle = normalizeText(text);

    const result = this.items.filter((product) => {
      const matchesText = needle === '' || normalizeText(product.name).includes(needle);
      const matchesCategory = category === 'all' || product.category === category;
      return matchesText && matchesCategory;
    });

    if (sortKey) {
      const factor = direction === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const order = sortKey === 'price'
          ? a.price - b.price
          : a[sortKey].localeCompare(b[sortKey], 'el', { sensitivity: 'base' });
        return order * factor;
      });
    }
    return result;
  }
}

/** Οι πελάτες που εγγράφηκαν, στο κλειδί «users». */
class UserStore extends LocalStorageStore {
  constructor() {
    super(USERS_KEY, User);
  }

  /** Το email υπάρχει ήδη; (χωρίς διάκριση πεζών / κεφαλαίων) */
  hasEmail(email) {
    const needle = String(email ?? '').trim().toLowerCase();
    return this.items.some((user) => user.email === needle);
  }
}

const productStore = new ProductStore();
const userStore = new UserStore();

/* =========================================================
   5. Live validation φορμών
   ========================================================= */

/**
 * Συνδέει τα πεδία μιας φόρμας με τους κανόνες τους. Σε κάθε πεδίο δουλεύουν δύο επίπεδα:
 *   α) τα HTML γνωρίσματα (required, minlength, pattern, type="email", min, step),
 *      που τα ελέγχει ο ίδιος ο browser·
 *   β) ο δικός μας κανόνας (field.validate) για όσα δεν γράφονται σε HTML
 *      (μοναδικότητα, σύνθεση password, ταύτιση επιβεβαίωσης). Τον δίνουμε στον
 *      browser με setCustomValidity(), οπότε τον λαμβάνει υπόψη και το checkValidity().
 * Το «Έγκυρο» ή το μήνυμα λάθους φαίνεται μόνο σε πεδία που άγγιξε ήδη ο χρήστης.
 */
class FormController {
  /**
   * @param {HTMLFormElement} form
   * @param {{id: string, validate: (value: string) => string}[]} fields
   */
  constructor(form, fields) {
    this.form = form;
    this.fields = fields;
    this.touched = new Set();

    fields.forEach((field) => {
      const input = document.getElementById(field.id);
      // «input»: σε κάθε πλήκτρο. «blur»: όταν ο χρήστης φεύγει από το πεδίο (π.χ. το άφησε κενό).
      ['input', 'blur'].forEach((eventName) => {
        input.addEventListener(eventName, () => {
          this.touched.add(field.id);
          this.validateField(field.id);
        });
      });
    });
  }

  /** Ελέγχει ένα πεδίο, δείχνει το αποτέλεσμα και επιστρέφει true / false. */
  validateField(id) {
    const field = this.fields.find((item) => item.id === id);
    const input = document.getElementById(id);

    // Σε type="number" με μη αριθμητικό κείμενο ο browser δίνει value = '' και validity.badInput = true.
    const customMessage = input.validity.badInput ? 'Δώστε έναν έγκυρο αριθμό.' : field.validate(input.value);
    input.setCustomValidity(customMessage);   // '' σημαίνει «καμία αντίρρηση από τον δικό μας κανόνα»

    // Τελική απόφαση από το Constraint Validation API (HTML γνωρίσματα + customError).
    // Τα readonly πεδία δεν ελέγχονται από το checkValidity(), γι' αυτό κοιτάμε και το μήνυμα.
    const isValid = input.checkValidity() && customMessage === '';

    if (this.touched.has(id)) {
      showFieldResult(input, isValid ? 'valid' : 'invalid', customMessage || nativeErrorMessage(input));
    }
    return isValid;
  }

  /** Ελέγχει όλα τα πεδία (στο submit). Επιστρέφει το πρώτο μη έγκυρο input ή null. */
  validateAll() {
    let firstInvalid = null;
    this.fields.forEach((field) => {
      this.touched.add(field.id);
      const isValid = this.validateField(field.id);
      if (!isValid && firstInvalid === null) firstInvalid = document.getElementById(field.id);
    });
    return firstInvalid;
  }

  /** Αδειάζει τη φόρμα και σβήνει μηνύματα και καταστάσεις. */
  reset() {
    this.form.reset();
    this.touched.clear();
    this.fields.forEach((field) => {
      const input = document.getElementById(field.id);
      input.setCustomValidity('');
      showFieldResult(input, 'none', '');
    });
  }
}

/** Μήνυμα για τα σφάλματα των HTML γνωρισμάτων, από το αντικείμενο validity του πεδίου. */
function nativeErrorMessage(input) {
  const validity = input.validity;
  if (validity.valueMissing) return 'Το πεδίο είναι υποχρεωτικό.';
  if (validity.typeMismatch) return 'Μη έγκυρη μορφή.';
  if (validity.patternMismatch) return 'Η τιμή δεν έχει την επιτρεπτή μορφή.';
  if (validity.tooShort) return `Χρειάζονται τουλάχιστον ${input.minLength} χαρακτήρες.`;
  if (validity.tooLong) return `Επιτρέπονται έως ${input.maxLength} χαρακτήρες.`;
  if (validity.rangeUnderflow) return `Η ελάχιστη τιμή είναι ${input.min}.`;
  if (validity.rangeOverflow) return `Η μέγιστη τιμή είναι ${input.max}.`;
  if (validity.stepMismatch) return 'Επιτρέπονται έως δύο δεκαδικά ψηφία.';
  return input.validationMessage;
}

/** state: 'valid' -> «Έγκυρο», 'invalid' -> μήνυμα λάθους, 'none' -> τίποτα. */
function showFieldResult(input, state, message) {
  const messageBox = document.getElementById(`msg-${input.id}`);

  input.classList.toggle('is-valid', state === 'valid');
  input.classList.toggle('is-invalid', state === 'invalid');
  if (state === 'invalid') {
    input.setAttribute('aria-invalid', 'true');
  } else {
    input.removeAttribute('aria-invalid');
  }

  messageBox.className = state === 'none' ? 'field-message' : `field-message is-${state}`;
  if (state === 'valid') {
    messageBox.textContent = 'Έγκυρο';
  } else if (state === 'invalid') {
    messageBox.textContent = message;
  } else {
    messageBox.textContent = '';
  }
}

/** Μήνυμα επιτυχίας / λάθους κάτω από μια φόρμα. type: 'success', 'error' ή ''. */
function setStatus(element, message, type = '') {
  element.textContent = message;
  element.className = type ? `form-status is-${type}` : 'form-status';
}

/* =========================================================
   6. Προϊόντα: φόρμα και πίνακας
   ========================================================= */

const productForm = document.getElementById('product-form');
const productFormTitle = document.getElementById('product-form-title');
const productNameInput = document.getElementById('productName');
const productCategoryInput = document.getElementById('productCategory');
const productPriceInput = document.getElementById('productPrice');
const productAvailableInput = document.getElementById('productAvailable');
const productSubmitButton = document.getElementById('product-submit');
const productCancelButton = document.getElementById('product-cancel');
const productStatus = document.getElementById('product-status');

const productsBody = document.getElementById('products-body');
const productsEmpty = document.getElementById('products-empty');
const productCount = document.getElementById('product-count');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const sortHeaders = document.querySelectorAll('#products-table th.sortable');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('page-info');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

/** Κατάσταση της οθόνης (όχι δεδομένα: αυτά είναι στο productStore). */
const productView = {
  editingId: null,     // id του προϊόντος που επεξεργαζόμαστε, null όταν προσθέτουμε νέο
  sortKey: null,       // 'name' | 'category' | 'price' | null (σειρά προσθήκης)
  direction: 'asc',
  page: 1,
  highlightId: null    // γραμμή που μόλις προστέθηκε / άλλαξε (σύντομη επισήμανση)
};

const productFormController = new FormController(productForm, [
  {
    id: 'productName',
    validate: (value) => validateProductName(value) ||
      (productStore.hasName(value, productView.editingId) ? 'Υπάρχει ήδη προϊόν με αυτό το όνομα.' : '')
  },
  { id: 'productCategory', validate: validateCategory },
  { id: 'productPrice', validate: validatePrice }
]);

/** Γεμίζει τη λίστα κατηγοριών της φόρμας και του φίλτρου από τη σταθερά CATEGORIES. */
function fillCategoryOptions() {
  CATEGORIES.forEach((category) => {
    productCategoryInput.add(new Option(category, category));
    categoryFilter.add(new Option(category, category));
  });
}

function readProductForm() {
  return {
    name: productNameInput.value.trim(),
    category: productCategoryInput.value,
    price: Number(productPriceInput.value),
    available: productAvailableInput.checked
  };
}

function handleProductSubmit(event) {
  event.preventDefault();   // καμία αποστολή / ανανέωση σελίδας

  const firstInvalid = productFormController.validateAll();
  if (firstInvalid) {
    setStatus(productStatus, 'Διορθώστε τα πεδία με κόκκινο πριν την αποθήκευση.', 'error');
    firstInvalid.focus();
    return;
  }

  const data = readProductForm();
  let saved;
  let message;

  if (productView.editingId) {
    saved = productStore.update(productView.editingId, data);
    message = `Το προϊόν «${data.name}» ενημερώθηκε.`;
  } else {
    saved = productStore.add(data);
    message = `Το προϊόν «${data.name}» προστέθηκε.`;
  }

  if (!saved) {
    // Π.χ. το προϊόν διαγράφηκε από άλλη καρτέλα όσο το επεξεργαζόμασταν.
    setStatus(productStatus, 'Το προϊόν δεν υπάρχει πια, οπότε δεν αποθηκεύτηκε.', 'error');
    return;
  }

  resetProductForm();
  setStatus(productStatus, message, 'success');
  revealProduct(saved.id);
  renderProducts();
}

/** Φέρνει το προϊόν στη φόρμα για επεξεργασία. */
function startEditProduct(product) {
  productFormController.reset();
  productView.editingId = product.id;

  productNameInput.value = product.name;
  productCategoryInput.value = product.category;
  productPriceInput.value = product.price;
  productAvailableInput.checked = product.available;

  productFormTitle.textContent = 'Επεξεργασία προϊόντος';
  productSubmitButton.textContent = 'Αποθήκευση αλλαγών';
  productCancelButton.hidden = false;
  setStatus(productStatus, `Επεξεργάζεστε το «${product.name}».`);

  renderProducts();   // για να επισημανθεί η γραμμή που επεξεργαζόμαστε
  productForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  productNameInput.focus({ preventScroll: true });
}

/** Επιστροφή της φόρμας στην κατάσταση «Νέο προϊόν». */
function resetProductForm() {
  productFormController.reset();
  productView.editingId = null;
  productFormTitle.textContent = 'Νέο προϊόν';
  productSubmitButton.textContent = 'Προσθήκη προϊόντος';
  productCancelButton.hidden = true;
}

/** Τα προϊόντα που πρέπει να φαίνονται, με την αναζήτηση, το φίλτρο και την ταξινόμηση. */
function getVisibleProducts() {
  return productStore.search({
    text: searchInput.value,
    category: categoryFilter.value,
    sortKey: productView.sortKey,
    direction: productView.direction
  });
}

/** Πηγαίνει στη σελίδα όπου εμφανίζεται το προϊόν και το επισημαίνει. */
function revealProduct(id) {
  const index = getVisibleProducts().findIndex((product) => product.id === id);
  if (index !== -1) productView.page = Math.floor(index / PAGE_SIZE) + 1;
  productView.highlightId = id;
}

function renderProductRow(product) {
  const classes = [];
  if (product.id === productView.editingId) classes.push('is-editing');
  if (product.id === productView.highlightId) classes.push('is-highlighted');

  const availability = product.available
    ? '<span class="badge badge-in">Διαθέσιμο</span>'
    : '<span class="badge badge-out">Εξαντλημένο</span>';

  return `
    <tr data-id="${escapeHtml(product.id)}" class="${classes.join(' ')}">
      <td data-label="Όνομα" class="cell-name">${escapeHtml(product.name)}</td>
      <td data-label="Κατηγορία"><span class="chip">${escapeHtml(product.category)}</span></td>
      <td data-label="Τιμή" class="numeric">${formatPrice(product.price)}</td>
      <td data-label="Διαθεσιμότητα">${availability}</td>
      <td class="actions-column">
        <button type="button" class="btn-link" data-action="edit"
                aria-label="Επεξεργασία: ${escapeHtml(product.name)}">Επεξεργασία</button>
        <button type="button" class="btn-link danger" data-action="delete"
                aria-label="Διαγραφή: ${escapeHtml(product.name)}">Διαγραφή</button>
      </td>
    </tr>`;
}

/** Ξαναζωγραφίζει τον πίνακα. Αλλάζει μόνο το tbody, όχι τη φόρμα ή τα φίλτρα. */
function renderProducts() {
  const products = getVisibleProducts();
  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  // Μετά από φίλτρο ή διαγραφή μπορεί να μείνουν λιγότερες σελίδες.
  productView.page = Math.min(Math.max(productView.page, 1), pageCount);
  const start = (productView.page - 1) * PAGE_SIZE;
  const pageItems = products.slice(start, start + PAGE_SIZE);

  productsBody.innerHTML = pageItems.map(renderProductRow).join('');
  productsEmpty.hidden = products.length > 0;

  productCount.textContent = products.length === productStore.size
    ? countProducts(productStore.size)
    : `${products.length} από ${countProducts(productStore.size)}`;

  pagination.hidden = pageCount === 1;
  pageInfo.textContent = `Σελίδα ${productView.page} από ${pageCount}`;
  prevPageButton.disabled = productView.page === 1;
  nextPageButton.disabled = productView.page === pageCount;

  productView.highlightId = null;   // η επισήμανση φαίνεται μόνο μία φορά
}

/** Κλικ σε επικεφαλίδα: πρώτα αύξουσα, με δεύτερο κλικ φθίνουσα. */
function toggleSort(key) {
  if (productView.sortKey === key) {
    productView.direction = productView.direction === 'asc' ? 'desc' : 'asc';
  } else {
    productView.sortKey = key;
    productView.direction = 'asc';
  }
  productView.page = 1;
  updateSortHeaders();
  renderProducts();
}

/** Βελάκια και aria-sort στις επικεφαλίδες. */
function updateSortHeaders() {
  sortHeaders.forEach((header) => {
    const isActive = header.dataset.sort === productView.sortKey;
    const ascending = productView.direction === 'asc';
    let ariaSort = 'none';
    let arrow = '↕';
    if (isActive) {
      ariaSort = ascending ? 'ascending' : 'descending';
      arrow = ascending ? '▲' : '▼';
    }
    header.setAttribute('aria-sort', ariaSort);
    header.querySelector('.sort-indicator').textContent = arrow;
  });
}

/* =========================================================
   7. Διαγραφή με επιβεβαίωση και αναίρεση
   ========================================================= */

const modal = document.getElementById('confirm-modal');
const modalText = document.getElementById('modal-text');
const modalConfirmButton = document.getElementById('modal-confirm');
const modalCancelButton = document.getElementById('modal-cancel');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastUndoButton = document.getElementById('toast-undo');

let pendingConfirm = null;     // η ενέργεια που θα γίνει αν πατηθεί «Διαγραφή»
let focusBeforeModal = null;   // πού επιστρέφει η εστίαση όταν κλείσει το παράθυρο
let undoTimer = null;

function openConfirm(message, onConfirm) {
  focusBeforeModal = document.activeElement;
  pendingConfirm = onConfirm;
  modalText.textContent = message;
  modal.hidden = false;
  modalCancelButton.focus();   // η ασφαλής επιλογή έχει την εστίαση
}

function closeConfirm(confirmed) {
  const action = pendingConfirm;
  pendingConfirm = null;
  modal.hidden = true;
  if (focusBeforeModal && document.contains(focusBeforeModal)) focusBeforeModal.focus();
  if (confirmed && action) action();
}

function showUndoToast(message, onUndo) {
  toastMessage.textContent = message;
  toast.hidden = false;
  window.clearTimeout(undoTimer);
  undoTimer = window.setTimeout(hideToast, UNDO_TIMEOUT_MS);
  toastUndoButton.onclick = () => {
    hideToast();
    onUndo();
  };
  // Η γραμμή (και το κουμπί της) χάθηκε με τη διαγραφή· η εστίαση πάει στην «Αναίρεση».
  toastUndoButton.focus();
}

function hideToast() {
  window.clearTimeout(undoTimer);
  toast.hidden = true;
  toastUndoButton.onclick = null;
}

function deleteProduct(product) {
  openConfirm(`Να διαγραφεί το προϊόν «${product.name}»;`, () => {
    const removed = productStore.remove(product.id);
    if (!removed) return;

    // Αν διαγράφηκε το προϊόν που ήταν στη φόρμα, η φόρμα γυρνά σε «Νέο προϊόν».
    if (productView.editingId === product.id) resetProductForm();
    setStatus(productStatus, '');
    renderProducts();

    showUndoToast(`Το προϊόν «${product.name}» διαγράφηκε.`, () => {
      // Στο μεταξύ μπορεί να προστέθηκε άλλο προϊόν με το ίδιο όνομα.
      if (productStore.hasName(removed.item.name)) {
        setStatus(productStatus, 'Η αναίρεση δεν έγινε: υπάρχει ήδη προϊόν με το ίδιο όνομα.', 'error');
        return;
      }
      productStore.restore(removed.item, removed.index);
      revealProduct(removed.item.id);
      renderProducts();
      setStatus(productStatus, `Το προϊόν «${product.name}» επανήλθε.`, 'success');
    });
  });
}

/* =========================================================
   8. Εξαγωγή / εισαγωγή (bonus)
   ========================================================= */

const importFileInput = document.getElementById('import-file');
const importReport = document.getElementById('import-report');
const importSummary = document.getElementById('import-summary');
const importErrors = document.getElementById('import-errors');

/** Κατεβάζει ένα αρχείο που φτιάχνεται στον browser (Blob + προσωρινό URL). */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportProductsJson() {
  downloadFile('products.json', JSON.stringify(productStore.all(), null, 2), 'application/json');
  setStatus(productStatus, `Εξήχθησαν ${countProducts(productStore.size)} στο products.json.`, 'success');
}

function exportProductsCsv() {
  const columns = ['id', 'name', 'category', 'price', 'available'];
  // Κάθε κελί σε εισαγωγικά· τα εισαγωγικά μέσα στο κείμενο διπλασιάζονται (κανόνας του CSV).
  const toCell = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    columns.join(','),
    ...productStore.all().map((product) => columns.map((column) => toCell(product[column])).join(','))
  ];
  // Το BOM (﻿) στην αρχή βοηθά το Excel να διαβάσει σωστά τα ελληνικά (UTF-8).
  downloadFile('products.csv', `﻿${lines.join('\r\n')}`, 'text/csv');
  setStatus(productStatus, `Εξήχθησαν ${countProducts(productStore.size)} στο products.csv.`, 'success');
}

/** Διαβάζει αρχείο JSON και προσθέτει μόνο τα έγκυρα προϊόντα που δεν υπάρχουν ήδη. */
function importProductsJson(file) {
  const reader = new FileReader();

  reader.onload = () => {
    let records;
    try {
      records = JSON.parse(reader.result);
    } catch (error) {
      showImportReport('Το αρχείο δεν περιέχει έγκυρο JSON.', [], true);
      return;
    }
    if (!Array.isArray(records)) {
      showImportReport('Το JSON πρέπει να είναι πίνακας προϊόντων: [ { ... }, { ... } ].', [], true);
      return;
    }

    const accepted = [];
    const errors = [];
    const namesInFile = new Set();   // για διπλότυπα μέσα στο ίδιο το αρχείο

    records.forEach((record, index) => {
      const problems = validateProduct(record);   // οι ίδιοι κανόνες με τη φόρμα
      if (problems.length === 0) {
        const key = normalizeText(record.name);
        if (productStore.hasName(record.name) || namesInFile.has(key)) {
          problems.push(`Υπάρχει ήδη προϊόν με όνομα «${String(record.name).trim()}».`);
        } else {
          namesInFile.add(key);
        }
      }

      if (problems.length > 0) {
        errors.push(`Εγγραφή ${index + 1}: ${problems.join(' ')}`);
      } else {
        accepted.push(record);
      }
    });

    // Κρατάμε μόνο τα γνωστά πεδία. Το id του αρχείου αγνοείται: κάθε προϊόν παίρνει νέο.
    accepted.forEach(({ name, category, price, available }) => {
      productStore.add({ name, category, price, available });
    });

    productView.page = 1;
    renderProducts();
    showImportReport(
      `Εισήχθησαν ${accepted.length} από ${records.length} εγγραφές.`,
      errors,
      accepted.length === 0 && records.length > 0
    );
  };

  reader.onerror = () => showImportReport('Το αρχείο δεν μπόρεσε να διαβαστεί.', [], true);
  reader.readAsText(file, 'utf-8');
}

function showImportReport(summary, errors, isError) {
  importReport.hidden = false;
  importReport.classList.toggle('is-error', isError);
  importSummary.textContent = summary;
  importErrors.innerHTML = errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('');
}

/* =========================================================
   9. Εγγραφή πελάτη
   ========================================================= */

const registerForm = document.getElementById('register-form');
const registerStatus = document.getElementById('register-status');
const passwordInput = document.getElementById('password');
const registrationDateInput = document.getElementById('registrationDate');
const customersBody = document.getElementById('customers-body');
const customersEmpty = document.getElementById('customers-empty');
const customerCount = document.getElementById('customer-count');

const registerFormController = new FormController(registerForm, [
  { id: 'firstName', validate: (value) => validateGreekName(value, 'Το όνομα') },
  { id: 'lastName', validate: (value) => validateGreekName(value, 'Το επώνυμο') },
  {
    id: 'email',
    validate: (value) => validateEmail(value) ||
      (userStore.hasEmail(value) ? 'Το email χρησιμοποιείται ήδη από άλλον πελάτη.' : '')
  },
  { id: 'role', validate: validateRole },
  { id: 'registrationDate', validate: validateRegistrationDate },
  { id: 'password', validate: validatePassword },
  { id: 'confirmPassword', validate: (value) => validateConfirmation(passwordInput.value, value) }
]);

/** Ενημερώνει τις ενδείξεις ✔ / ✘ (η CSS δείχνει ✔ όταν η γραμμή έχει την κλάση is-met). */
function updatePasswordRules() {
  PASSWORD_RULES.forEach((rule) => {
    const item = document.querySelector(`.rule[data-rule="${rule.id}"]`);
    item.classList.toggle('is-met', rule.test(passwordInput.value));
  });
}

function handleRegisterSubmit(event) {
  event.preventDefault();

  const firstInvalid = registerFormController.validateAll();
  if (firstInvalid) {
    setStatus(registerStatus, 'Διορθώστε τα πεδία με κόκκινο πριν την εγγραφή.', 'error');
    firstInvalid.focus();
    return;
  }

  const user = userStore.add({
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    role: document.getElementById('role').value,
    registrationDate: registrationDateInput.value,
    password: passwordInput.value
  });

  resetRegisterForm();
  setStatus(registerStatus, `Ο πελάτης ${user.fullName} εγγράφηκε.`, 'success');
  renderCustomers();
}

function resetRegisterForm() {
  registerFormController.reset();
  registrationDateInput.value = todayIso();   // το form.reset() αδειάζει και την ημερομηνία
  updatePasswordRules();
}

/** Λίστα πελατών, ο πιο πρόσφατος πρώτος. */
function renderCustomers() {
  const users = userStore.all().reverse();

  customersBody.innerHTML = users.map((user) => `
    <tr>
      <td data-label="Ονοματεπώνυμο">${escapeHtml(user.fullName)}</td>
      <td data-label="Email">${escapeHtml(user.email)}</td>
      <td data-label="Ρόλος"><span class="badge ${user.role === 'Admin' ? 'badge-admin' : 'badge-user'}">${escapeHtml(user.role)}</span></td>
      <td data-label="Ημερομηνία">${escapeHtml(formatDate(user.registrationDate))}</td>
    </tr>`).join('');

  customersEmpty.hidden = users.length > 0;
  customerCount.textContent = users.length === 1 ? '1 πελάτης' : `${users.length} πελάτες`;
}

/* =========================================================
   10. Συνδέσεις γεγονότων και εκκίνηση
   ========================================================= */

/* ---------- Προϊόντα ---------- */

productForm.addEventListener('submit', handleProductSubmit);

productCancelButton.addEventListener('click', () => {
  resetProductForm();
  setStatus(productStatus, 'Η επεξεργασία ακυρώθηκε.');
  renderProducts();
});

// Ένας listener για όλα τα κουμπιά του πίνακα (event delegation): οι γραμμές
// ξαναφτιάχνονται σε κάθε render, ο tbody όμως μένει ο ίδιος.
productsBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const product = productStore.findById(button.closest('tr').dataset.id);
  if (!product) return;

  if (button.dataset.action === 'edit') {
    startEditProduct(product);
  } else if (button.dataset.action === 'delete') {
    deleteProduct(product);
  }
});

sortHeaders.forEach((header) => {
  header.querySelector('.sort-button').addEventListener('click', () => toggleSort(header.dataset.sort));
});

// Η αναζήτηση φιλτράρει σε κάθε πλήκτρο. Κάθε αλλαγή φίλτρου γυρνά στη σελίδα 1.
searchInput.addEventListener('input', () => {
  productView.page = 1;
  renderProducts();
});

categoryFilter.addEventListener('change', () => {
  productView.page = 1;
  renderProducts();
});

prevPageButton.addEventListener('click', () => {
  productView.page -= 1;
  renderProducts();
});

nextPageButton.addEventListener('click', () => {
  productView.page += 1;
  renderProducts();
});

/* ---------- Παράθυρο επιβεβαίωσης ---------- */

modalCancelButton.addEventListener('click', () => closeConfirm(false));
modalConfirmButton.addEventListener('click', () => closeConfirm(true));

// Κλικ έξω από το παράθυρο = Άκυρο
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeConfirm(false);
});

modal.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeConfirm(false);
  // Το Tab κυκλοφορεί μόνο ανάμεσα στα δύο κουμπιά όσο το παράθυρο είναι ανοιχτό.
  if (event.key === 'Tab') {
    event.preventDefault();
    const next = document.activeElement === modalCancelButton ? modalConfirmButton : modalCancelButton;
    next.focus();
  }
});

/* ---------- Εξαγωγή / εισαγωγή ---------- */

document.getElementById('export-json').addEventListener('click', exportProductsJson);
document.getElementById('export-csv').addEventListener('click', exportProductsCsv);
document.getElementById('import-json').addEventListener('click', () => importFileInput.click());
document.getElementById('import-close').addEventListener('click', () => {
  importReport.hidden = true;
});

importFileInput.addEventListener('change', () => {
  const file = importFileInput.files[0];
  if (file) importProductsJson(file);
  importFileInput.value = '';   // για να μπορεί να ξαναφορτωθεί το ίδιο αρχείο
});

/* ---------- Εγγραφή πελάτη ---------- */

registerForm.addEventListener('submit', handleRegisterSubmit);

passwordInput.addEventListener('input', () => {
  updatePasswordRules();
  // Η επιβεβαίωση εξαρτάται από το password: αν έχει ήδη συμπληρωθεί, ξαναελέγχεται.
  if (registerFormController.touched.has('confirmPassword')) {
    registerFormController.validateField('confirmPassword');
  }
});

/* ---------- Γενικό μήνυμα φόρμας ---------- */

// Μόλις ο χρήστης αρχίσει να διορθώνει, το «Διορθώστε τα πεδία…» δεν ισχύει πια.
[[productForm, productStatus], [registerForm, registerStatus]].forEach(([form, status]) => {
  form.addEventListener('input', () => {
    if (status.classList.contains('is-error')) setStatus(status, '');
  });
});

/* ---------- Άλλη καρτέλα ---------- */

// Αν αλλάξουν τα δεδομένα σε άλλη καρτέλα του ίδιου site, ο browser στέλνει εδώ
// το γεγονός «storage» και ξαναδιαβάζουμε τη συλλογή (key === null σημαίνει clear()).
window.addEventListener('storage', (event) => {
  if (event.key === PRODUCTS_KEY || event.key === null) {
    productStore.load();
    renderProducts();
  }
  if (event.key === USERS_KEY || event.key === null) {
    userStore.load();
    renderCustomers();
  }
});

/* ---------- Εκκίνηση ---------- */

fillCategoryOptions();
registrationDateInput.value = todayIso();
updatePasswordRules();
updateSortHeaders();
renderProducts();
renderCustomers();
