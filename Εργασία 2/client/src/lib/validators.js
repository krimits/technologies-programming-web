/* Κανόνες επικύρωσης — IDENTICAL with τον server (server/src/utils/validators.js).
   Ο client ελέγχει για UX, αλλά ο server ελέγχει ξανά (ο server είναι η αλήθεια). */

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

/* Οι κανόνες password για τις ενδείξεις ✔/✘. */
export const passwordRules = [
  { key: 'length', label: 'Τουλάχιστον 8 χαρακτήρες', test: (value) => value.length >= 8 },
  { key: 'letter', label: 'Τουλάχιστον ένα γράμμα', test: (value) => /[A-Za-z]/.test(value) },
  { key: 'digit', label: 'Τουλάχιστον ένας αριθμός', test: (value) => /\d/.test(value) },
  { key: 'symbol', label: 'Τουλάχιστον ένα από τα !@#$%^&*', test: (value) => /[!@#$%^&*]/.test(value) }
];
