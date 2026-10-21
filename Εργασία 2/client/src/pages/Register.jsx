import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  validateGreekName,
  validateEmail,
  validatePassword,
  validateConfirmation,
  passwordRules
} from '../lib/validators.js';
import Message from '../components/Message.jsx';

export default function Register() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmation: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const results = {
      firstName: validateGreekName(form.firstName, 'Το όνομα'),
      lastName: validateGreekName(form.lastName, 'Το επώνυμο'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmation: validateConfirmation(form.password, form.confirmation)
    };

    const nextErrors = {};
    Object.entries(results).forEach(([field, result]) => {
      if (!result.valid) nextErrors[field] = result.message;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmation: form.confirmation
      });
      // Μετά την εγγραφή κάνουμε αυτόματο login.
      await login(form.email.trim(), form.password);
      navigate('/');
    } catch (err) {
      setServerError(err.message);
      if (err.details) {
        setErrors((current) => ({ ...current, ...err.details }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container narrow">
      <div className="card">
        <h1>Εγγραφή</h1>
        <p className="muted">Οι κανόνες της φόρμας είναι ίδιοι με την Εργασία 1.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstName">Όνομα</label>
              <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="ΓΕΩΡΓΙΟΣ" />
              {errors.firstName && <p className="field-message is-invalid">{errors.firstName}</p>}
            </div>

            <div className="field">
              <label htmlFor="lastName">Επώνυμο</label>
              <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="ΠΑΠΑΔΟΠΟΥΛΟΥ" />
              {errors.lastName && <p className="field-message is-invalid">{errors.lastName}</p>}
            </div>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
              {errors.email && <p className="field-message is-invalid">{errors.email}</p>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
              {errors.password && <p className="field-message is-invalid">{errors.password}</p>}
            </div>

            <div className="field">
              <label htmlFor="confirmation">Επιβεβαίωση password</label>
              <input
                id="confirmation"
                name="confirmation"
                type="password"
                value={form.confirmation}
                onChange={handleChange}
              />
              {errors.confirmation && <p className="field-message is-invalid">{errors.confirmation}</p>}
            </div>
          </div>

          <ul className="password-rules">
            {passwordRules.map((rule) => (
              <li key={rule.key} className={rule.test(form.password) ? 'is-met' : ''}>
                <span className="rule-icon" aria-hidden="true" />
                {rule.label}
              </li>
            ))}
          </ul>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Εγγραφή…' : 'Εγγραφή'}
            </button>
          </div>

          {serverError && <Message type="error">{serverError}</Message>}
        </form>

        <p className="muted">
          Έχεις ήδη λογαριασμό; <Link to="/login">Σύνδεση</Link>
        </p>
      </div>
    </section>
  );
}
