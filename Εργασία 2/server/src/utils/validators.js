/* Validation rules — IDENTICAL with τον client (client/src/lib/validators.js).
   Οι κανόνες είναι οι ίδιοι με την Εργασία 1: κεφαλαία ελληνικά χωρίς τόνους,
   έγκυρο email, password με γράμμα/ψηφίο/σύμβολο. */

/** Κεφαλαία ελληνικά χωρίς τόνους. Το εύρος Α-Ω (U+0391-U+03A9) αποκλείει
 *  αυτόματα τα Ά Έ Ή Ί Ό Ύ Ώ (U+0386-U+038F) και τα Ϊ Ϋ (U+03AA/AB). */
export const GREEK_NAME_PATTERN = /^[Α-Ω]+([ \-][Α-Ω]+)*$/u;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_SYMBOLS = '!@#$%^&*';

export function validateGreekName(value, label) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: `${label} είναι υποχρεωτικό.` };
  }
  if (!GREEK_NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message: `${label} πρέπει να είναι σε κεφαλαία ελληνικά χωρίς τόνους (π.χ. ΓΕΩΡΓΙΟΣ ή ΑΝΝΑ-ΜΑΡΙΑ).`
    };
  }
  return { valid: true, message: '' };
}

export function validateEmail(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return { valid: false, message: 'Το email είναι υποχρεωτικό.' };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { valid: false, message: 'Μη έγκυρη μορφή email.' };
  }
  return { valid: true, message: '' };
}

export function validatePassword(value) {
  const password = String(value ?? '');
  if (!password) {
    return { valid: false, message: 'Ο κωδικός είναι υποχρεωτικό.' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα γράμμα.' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα αριθμό.' };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, message: `Ο κωδικός πρέπει να περιέχει τουλάχιστον ένα από τα ${PASSWORD_SYMBOLS}.` };
  }
  return { valid: true, message: '' };
}

export function validateConfirmation(password, confirmation) {
  if (!confirmation) {
    return { valid: false, message: 'Η επιβεβαίωση του κωδικού είναι υποχρεωτική.' };
  }
  if (password !== confirmation) {
    return { valid: false, message: 'Οι κωδικοί δεν ταιριάζουν.' };
  }
  return { valid: true, message: '' };
}

/** Επικύρωση των δεδομένων εγγραφής. */
export function validateRegistration({ firstName, lastName, email, password, confirmation }) {
  const errors = {};
  const checks = [
    ['firstName', validateGreekName(firstName, 'Το όνομα')],
    ['lastName', validateGreekName(lastName, 'Το επώνυμο')],
    ['email', validateEmail(email)],
    ['password', validatePassword(password)],
    ['confirmation', validateConfirmation(password, confirmation)]
  ];
  checks.forEach(([field, result]) => {
    if (!result.valid) errors[field] = result.message;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Έλεγχος ενός payload παραγγελίας (μόνο id + ποσότητα — ποτέ τιμές). */
export function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'Το καλάθι είναι κενό.' };
  }
  for (const item of items) {
    const quantity = Number(item?.qty);
    if (!item?.productId || !Number.isInteger(quantity) || quantity <= 0) {
      return { valid: false, message: 'Μη έγκυρα δεδομένα παραγγελίας (productId / qty).' };
    }
  }
  return { valid: true, message: '' };
}
