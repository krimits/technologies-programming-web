/* =========================================================
   Εργασία 1 — Θέμα Α: Διαχείριση χρηστών
   logic.js — model, validation, rendering and persistence
   ---------------------------------------------------------
   Architecture:
     User       -> one record (a user of the application)
     UserStore  -> owns the collection + the localStorage persistence
     appState   -> transient UI state (search, filter, sort, page, edit)
   Every read/write of the collection goes through UserStore, so the
   in-memory array and localStorage never drift apart.
   ========================================================= */

'use strict';

/* ---------------- Constants ---------------- */

const STORAGE_KEY = 'users';
const PAGE_SIZE = 10;
const UNDO_TIMEOUT_MS = 6000;

/** Uppercase Greek letters WITHOUT tones: Α-Ω (U+0391-U+03A9).
 *  The range deliberately excludes Ά Έ Ή Ί Ό Ύ Ώ (U+0386-U+038F) and Ϊ Ϋ (U+03AA/AB). */
const GREEK_NAME_PATTERN = /^[Α-Ω]+([ \-][Α-Ω]+)*$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_SYMBOLS = '!@#$%^&*';

/* ---------------- Model ---------------- */

/** A single user record. */
class User {
  constructor(data) {
    this.id = data.id || generateId();
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.email = data.email;
    this.role = data.role;
    this.registrationDate = data.registrationDate;
    this.password = data.password;
  }

  /** Plain object, ready for JSON.stringify. */
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

  /** "ΓΕΩΡΓΙΟΣ ΠΑΠΑΔΟΠΟΥΛΟΣ" */
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

/** Owns the collection of users and its persistence in localStorage. */
class UserStore {
  constructor(key) {
    this.key = key;
    this.users = this.load();
  }

  /** Reads the collection from localStorage (JSON.parse) with a safe fallback. */
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => new User(item));
    } catch (error) {
      console.warn('Αδυναμία ανάγνωσης του localStorage — ξεκινάμε με κενή λίστα.', error);
      return [];
    }
  }

  /** Writes the collection to localStorage (JSON.stringify). */
  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.users.map((user) => user.toJSON())));
    } catch (error) {
      console.error('Αδυναμία αποθήκευσης στο localStorage.', error);
    }
  }

  all() {
    return [...this.users];
  }

  findById(id) {
    return this.users.find((user) => user.id === id) || null;
  }

  /** True if the email already exists (case-insensitive). excludeId allows editing a user. */
  hasEmail(email, excludeId = null) {
    const needle = String(email).trim().toLowerCase();
    return this.users.some((user) => user.id !== excludeId && user.email.toLowerCase() === needle);
  }

  add(data) {
    const user = new User(data);
    this.users.push(user);
    this.save();
    return user;
  }

  update(id, data) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    const updated = new User({ ...this.users[index], ...data, id });
    this.users[index] = updated;
    this.save();
    return updated;
  }

  /** Removes the user and returns it together with its previous index (for undo). */
  remove(id) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) return null;
    const [removed] = this.users.splice(index, 1);
    this.save();
    return { user: removed, index };
  }

  /** Puts a removed user back at its original position. */
  restore(user, index) {
    this.users.splice(Math.min(index, this.users.length), 0, user);
    this.save();
  }
}

/* ---------------- Helpers ---------------- */

function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Today as YYYY-MM-DD in local time (not UTC, to avoid the timezone off-by-one). */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** ISO date -> DD/MM/YYYY for display. */
function formatDate(isoDate) {
  if (!isoDate) return '—';
  const parts = String(isoDate).split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Escapes text before it is injected into innerHTML. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------------- Validation rules ---------------- */

function validateGreekName(value, label) {
  const trimmed = String(value).trim();
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

function validateEmailFormat(value) {
  const trimmed = String(value).trim();
  if (!trimmed) {
    return { valid: false, message: 'Το email είναι υποχρεωτικό.' };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { valid: false, message: 'Μη έγκυρη μορφή email.' };
  }
  return { valid: true, message: '' };
}

function validateEmailUnique(value, excludeId = null) {
  const trimmed = String(value).trim();
  if (!trimmed) return { valid: true, message: '' };
  if (store.hasEmail(trimmed, excludeId)) {
    return { valid: false, message: 'Το email χρησιμοποιείται ήδη. Επιλέξτε άλλο.' };
  }
  return { valid: true, message: '' };
}

function validatePassword(value) {
  const password = String(value);
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

function validateConfirmation(passwordValue, confirmationValue) {
  if (!confirmationValue) {
    return { valid: false, message: 'Η επιβεβαίωση του κωδικού είναι υποχρεωτική.' };
  }
  if (passwordValue !== confirmationValue) {
    return { valid: false, message: 'Οι κωδικοί δεν ταιριάζουν.' };
  }
  return { valid: true, message: '' };
}

/* ---------------- Application state ---------------- */

const store = new UserStore(STORAGE_KEY);

const appState = {
  editingId: null,   // id of the user being edited, null when adding
  sort: { key: null, direction: 'asc' },
  page: 1,
  lastDeleted: null, // { user, index } for the undo-delete feature
  undoTimer: null
};

const touchedFields = new Set();

/* ---------------- DOM references ---------------- */

const form = document.getElementById('user-form');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-button');
const formStatus = document.getElementById('form-status');

const tableBody = document.getElementById('users-body');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search');
const roleFilter = document.getElementById('role-filter');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('page-info');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

const modal = document.getElementById('confirm-modal');
const modalText = document.getElementById('modal-text');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastUndo = document.getElementById('toast-undo');

const importFileInput = document.getElementById('import-file');

/** The form fields, each with its own validation rule. */
const formFields = [
  {
    id: 'firstName',
    validate: (value) => validateGreekName(value, 'Το όνομα')
  },
  {
    id: 'lastName',
    validate: (value) => validateGreekName(value, 'Το επώνυμο')
  },
  {
    id: 'email',
    validate: (value) => {
      const format = validateEmailFormat(value);
      if (!format.valid) return format;
      return validateEmailUnique(value, appState.editingId);
    }
  },
  {
    id: 'role',
    validate: (value) => ({
      valid: Boolean(value),
      message: value ? '' : 'Ο ρόλος είναι υποχρεωτικό.'
    })
  },
  {
    id: 'registrationDate',
    validate: (value) => ({
      valid: Boolean(value),
      message: value ? '' : 'Η ημερομηνία εγγραφής είναι υποχρεωτική.'
    })
  },
  {
    id: 'password',
    validate: (value) => validatePassword(value)
  },
  {
    id: 'confirmPassword',
    validate: (value) => validateConfirmation(document.getElementById('password').value, value)
  }
];

/* ---------------- Live validation ---------------- */

/**
 * Validates one field and renders its status message.
 * The custom rule is mirrored into the browser's validity state through
 * setCustomValidity(), so checkValidity() reflects our rule as well as the
 * native ones (required / minlength).
 */
function validateField(field) {
  const input = document.getElementById(field.id);
  const messageBox = document.getElementById(`msg-${field.id}`);
  const result = field.validate(input.value);

  input.setCustomValidity(result.valid ? '' : result.message);
  const nativeValid = input.checkValidity();
  const isValid = result.valid && nativeValid;

  const showStatus = touchedFields.has(field.id) || !input.value.trim();

  if (showStatus) {
    if (isValid) {
      messageBox.textContent = 'Έγκυρο';
      messageBox.className = 'field-message is-valid';
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      input.removeAttribute('aria-invalid');
    } else {
      messageBox.textContent = result.message || input.validationMessage;
      messageBox.className = 'field-message is-invalid';
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
  }

  return isValid;
}

function validateAllFields() {
  let firstInvalidId = null;

  formFields.forEach((field) => {
    touchedFields.add(field.id);
    const isValid = validateField(field);
    if (!isValid && !firstInvalidId) firstInvalidId = field.id;
  });

  return firstInvalidId;
}

/** Live feedback for the four password complexity rules. */
function updatePasswordRules() {
  const password = document.getElementById('password').value;
  const checks = [
    { id: 'rule-length', ok: password.length >= 8 },
    { id: 'rule-letter', ok: /[A-Za-z]/.test(password) },
    { id: 'rule-digit', ok: /\d/.test(password) },
    { id: 'rule-symbol', ok: /[!@#$%^&*]/.test(password) }
  ];

  checks.forEach((check) => {
    document.getElementById(check.id).classList.toggle('is-met', check.ok);
  });
}

/* ---------------- Form handling ---------------- */

function setFormStatus(message, type) {
  formStatus.textContent = message;
  formStatus.className = 'form-status';
  if (type) formStatus.classList.add(`is-${type}`);
}

function resetForm() {
  form.reset();
  document.getElementById('registrationDate').value = todayIso();
  appState.editingId = null;
  touchedFields.clear();
  submitButton.textContent = 'Προσθήκη χρήστη';
  cancelButton.hidden = true;

  formFields.forEach((field) => {
    const input = document.getElementById(field.id);
    const messageBox = document.getElementById(`msg-${field.id}`);
    input.setCustomValidity('');
    input.classList.remove('is-valid', 'is-invalid');
    input.removeAttribute('aria-invalid');
    messageBox.textContent = '';
    messageBox.className = 'field-message';
  });

  updatePasswordRules();
  setFormStatus('', null);
}

function startEditing(user) {
  appState.editingId = user.id;

  document.getElementById('firstName').value = user.firstName;
  document.getElementById('lastName').value = user.lastName;
  document.getElementById('email').value = user.email;
  document.getElementById('role').value = user.role;
  document.getElementById('registrationDate').value = user.registrationDate;
  document.getElementById('password').value = user.password;
  document.getElementById('confirmPassword').value = user.password;

  submitButton.textContent = 'Αποθήκευση αλλαγών';
  cancelButton.hidden = false;
  updatePasswordRules();
  setFormStatus(`Επεξεργασία: ${escapeHtml(user.fullName)}`, null);

  document.getElementById('user-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('firstName').focus();
}

function collectFormData() {
  return {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    role: document.getElementById('role').value,
    registrationDate: document.getElementById('registrationDate').value,
    password: document.getElementById('password').value
  };
}

function handleSubmit(event) {
  event.preventDefault();

  const firstInvalidId = validateAllFields();
  if (firstInvalidId) {
    setFormStatus('Διόρθωστε τα επισημασμένα πεδία πριν την αποθήκευση.', 'error');
    document.getElementById(firstInvalidId).focus();
    return;
  }

  const data = collectFormData();
  let successMessage;

  if (appState.editingId) {
    store.update(appState.editingId, data);
    successMessage = 'Ο χρήστης ενημερώθηκε.';
  } else {
    store.add(data);
    successMessage = 'Ο χρήστης προστέθηκε.';
  }

  appState.page = 1;
  resetForm();
  setFormStatus(successMessage, 'success');
  render();
}

/* ---------------- Table rendering ---------------- */

function getVisibleUsers() {
  const query = searchInput.value.trim().toLowerCase();
  const role = roleFilter.value;

  let users = store.all().filter((user) => {
    const matchesQuery =
      !query ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);

    const matchesRole = role === 'all' || user.role === role;
    return matchesQuery && matchesRole;
  });

  if (appState.sort.key) {
    const { key, direction } = appState.sort;
    const factor = direction === 'asc' ? 1 : -1;

    users.sort((a, b) => {
      if (key === 'registrationDate') {
        return a.registrationDate.localeCompare(b.registrationDate) * factor;
      }
      return a[key].localeCompare(b[key], 'el', { sensitivity: 'base' }) * factor;
    });
  }

  return users;
}

function renderTableRow(user) {
  const roleClass = user.role === 'Admin' ? 'role-admin' : 'role-user';

  return `
    <tr data-id="${escapeHtml(user.id)}">
      <td>${escapeHtml(user.firstName)}</td>
      <td>${escapeHtml(user.lastName)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td><span class="role-badge ${roleClass}">${escapeHtml(user.role)}</span></td>
      <td>${escapeHtml(formatDate(user.registrationDate))}</td>
      <td class="actions-column">
        <button type="button" class="btn-link" data-action="edit">Επεξεργασία</button>
        <button type="button" class="btn-link danger" data-action="delete">Διαγραφή</button>
      </td>
    </tr>`;
}

function renderPagination(total, pageCount, from, to) {
  if (total <= PAGE_SIZE) {
    pagination.hidden = true;
    return;
  }

  pagination.hidden = false;
  pageInfo.textContent = `Σελίδα ${appState.page} από ${pageCount} · εμφανίζονται ${from}–${to} από ${total}`;
  prevPageButton.disabled = appState.page === 1;
  nextPageButton.disabled = appState.page === pageCount;
}

function render() {
  const users = getVisibleUsers();
  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  if (appState.page > pageCount) appState.page = pageCount;

  const start = (appState.page - 1) * PAGE_SIZE;
  const visible = users.slice(start, start + PAGE_SIZE);

  tableBody.innerHTML = visible.map(renderTableRow).join('');
  emptyState.hidden = users.length !== 0;
  tableBody.hidden = users.length === 0;

  renderPagination(users.length, pageCount, users.length === 0 ? 0 : start + 1, start + visible.length);
}

function toggleSort(key) {
  if (appState.sort.key === key) {
    appState.sort.direction = appState.sort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    appState.sort = { key, direction: 'asc' };
  }
  appState.page = 1;

  document.querySelectorAll('th.sortable').forEach((header) => {
    const isActive = header.dataset.sort === key;
    header.setAttribute('aria-sort', isActive ? (appState.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
    const indicator = header.querySelector('.sort-indicator');
    indicator.textContent = isActive ? (appState.sort.direction === 'asc' ? '▲' : '▼') : '';
  });

  render();
}

/* ---------------- Confirmation modal ---------------- */

let modalAction = null;

function openConfirmModal(message, onConfirm) {
  modalText.textContent = message;
  modalAction = onConfirm;
  modal.hidden = false;
  modalConfirm.focus();
}

function closeConfirmModal() {
  modal.hidden = true;
  modalAction = null;
}

/* ---------------- Undo delete (toast) ---------------- */

function showToast(message, onUndo) {
  toastMessage.textContent = message;
  toast.hidden = false;
  toastUndo.hidden = !onUndo;

  window.clearTimeout(appState.undoTimer);
  appState.undoTimer = window.setTimeout(() => {
    toast.hidden = true;
    appState.lastDeleted = null;
  }, UNDO_TIMEOUT_MS);

  toastUndo.onclick = () => {
    window.clearTimeout(appState.undoTimer);
    toast.hidden = true;
    if (onUndo) onUndo();
  };
}

function handleDelete(user) {
  openConfirmModal(
    `Θέλετε να διαγράψετε τον χρήστη «${user.fullName}»;`,
    () => {
      const removed = store.remove(user.id);
      if (!removed) return;

      appState.lastDeleted = removed;
      render();
      showToast(`Ο χρήστης «${user.fullName}» διεγράφη.`, () => {
        store.restore(removed.user, removed.index);
        appState.lastDeleted = null;
        render();
        setFormStatus('Η διαγραφή αναιρέθηκε.', 'success');
      });
    }
  );
}

/* ---------------- Import / Export (bonus) ---------------- */

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

function exportJson() {
  const users = store.all().map((user) => user.toJSON());
  downloadFile('users.json', JSON.stringify(users, null, 2), 'application/json');
}

function exportCsv() {
  const columns = ['firstName', 'lastName', 'email', 'role', 'registrationDate', 'password'];
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const lines = [columns.map(escapeCell).join(',')];
  store.all().forEach((user) => {
    lines.push(columns.map((column) => escapeCell(user[column])).join(','));
  });

  // BOM so that Excel detects UTF-8 (Greek letters).
  downloadFile('users.csv', `﻿${lines.join('\r\n')}`, 'text/csv');
}

/** Validates one imported record with exactly the same rules as the form. */
function validateImportedUser(record, usedEmails) {
  if (!record || typeof record !== 'object') {
    return { valid: false, reason: 'Μη έγκυρος εγγραφή.' };
  }

  const firstName = validateGreekName(record.firstName, 'Το όνομα');
  if (!firstName.valid) return { valid: false, reason: firstName.message };

  const lastName = validateGreekName(record.lastName, 'Το επώνυμο');
  if (!lastName.valid) return { valid: false, reason: lastName.message };

  const email = validateEmailFormat(record.email);
  if (!email.valid) return { valid: false, reason: email.message };

  const normalizedEmail = record.email.trim().toLowerCase();
  if (store.hasEmail(normalizedEmail) || usedEmails.has(normalizedEmail)) {
    return { valid: false, reason: 'Διπλότυπο email.' };
  }

  const password = validatePassword(record.password);
  if (!password.valid) return { valid: false, reason: password.message };

  const role = record.role === 'Admin' ? 'Admin' : 'User';

  return {
    valid: true,
    user: {
      firstName: record.firstName.trim(),
      lastName: record.lastName.trim(),
      email: normalizedEmail,
      role,
      registrationDate: /^\d{4}-\d{2}-\d{2}$/.test(record.registrationDate || '')
        ? record.registrationDate
        : todayIso(),
      password: record.password
    }
  };
}

function importJson(file) {
  const reader = new FileReader();

  reader.onload = () => {
    let records;
    try {
      records = JSON.parse(reader.result);
    } catch (error) {
      setFormStatus('Το αρχείο δεν περιέχει έγκυρο JSON.', 'error');
      return;
    }

    if (!Array.isArray(records)) {
      setFormStatus('Το αρχείο JSON πρέπει να περιέχει έναν πίνακα χρηστών.', 'error');
      return;
    }

    const usedEmails = new Set();
    const accepted = [];
    const rejected = [];

    records.forEach((record) => {
      const result = validateImportedUser(record, usedEmails);
      if (result.valid) {
        usedEmails.add(result.user.email);
        accepted.push(result.user);
      } else {
        rejected.push(result.reason);
      }
    });

    accepted.forEach((user) => store.add(user));
    appState.page = 1;
    render();

    const message = rejected.length === 0
      ? `Εισήχθησαν ${accepted.length} χρήστες.`
      : `Εισήχθησαν ${accepted.length} χρήστες, απορρίφθηκαν ${rejected.length}.`;
    setFormStatus(message, rejected.length === 0 ? 'success' : 'error');
  };

  reader.readAsText(file, 'utf-8');
}

/* ---------------- Events ---------------- */

form.addEventListener('submit', handleSubmit);

cancelButton.addEventListener('click', () => {
  resetForm();
  render();
});

formFields.forEach((field) => {
  const input = document.getElementById(field.id);
  input.addEventListener('input', () => {
    touchedFields.add(field.id);
    validateField(field);
    if (field.id === 'password') {
      updatePasswordRules();
      // the confirmation depends on the password -> re-validate it as well
      validateField(formFields.find((f) => f.id === 'confirmPassword'));
    }
  });
  input.addEventListener('blur', () => {
    touchedFields.add(field.id);
    validateField(field);
  });
});

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const row = button.closest('tr');
  const user = store.findById(row.dataset.id);
  if (!user) return;

  if (button.dataset.action === 'edit') {
    startEditing(user);
  } else if (button.dataset.action === 'delete') {
    handleDelete(user);
  }
});

document.querySelectorAll('th.sortable').forEach((header) => {
  header.querySelector('.sort-button').addEventListener('click', () => toggleSort(header.dataset.sort));
});

searchInput.addEventListener('input', () => {
  appState.page = 1;
  render();
});

roleFilter.addEventListener('change', () => {
  appState.page = 1;
  render();
});

prevPageButton.addEventListener('click', () => {
  if (appState.page > 1) {
    appState.page -= 1;
    render();
  }
});

nextPageButton.addEventListener('click', () => {
  appState.page += 1;
  render();
});

modalCancel.addEventListener('click', closeConfirmModal);
modalConfirm.addEventListener('click', () => {
  const action = modalAction;
  closeConfirmModal();
  if (action) action();
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeConfirmModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.hidden) closeConfirmModal();
});

document.getElementById('export-json').addEventListener('click', exportJson);
document.getElementById('export-csv').addEventListener('click', exportCsv);

document.getElementById('import-json').addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', () => {
  const file = importFileInput.files && importFileInput.files[0];
  if (file) importJson(file);
  importFileInput.value = '';
});

/* ---------------- Initialisation ---------------- */

document.getElementById('registrationDate').value = todayIso();
updatePasswordRules();
render();
