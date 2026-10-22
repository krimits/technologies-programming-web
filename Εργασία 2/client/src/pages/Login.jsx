import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail } from '../lib/validators.js';
import Message from '../components/Message.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      // Κάθε πεδίο επαληθεύεται με τον δικό του κανόνα — το email δεν πρέπει
      // να εφαρμόζεται στο password (bug: έδειχνε «Μη έγκυρη μορφή email.» εκεί).
      const message =
        name === 'email'
          ? validateEmail(value).message
          : value
            ? ''
            : 'Ο κωδικός είναι υποχρεωτικό.';
      setErrors((current) => ({ ...current, [name]: message }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const emailResult = validateEmail(form.email);
    const nextErrors = {};
    if (!emailResult.valid) nextErrors.email = emailResult.message;
    if (!form.password) nextErrors.password = 'Ο κωδικός είναι υποχρεωτικό.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container narrow">
      <div className="card">
        <h1>Σύνδεση</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <p className="field-message is-invalid">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <p className="field-message is-invalid">{errors.password}</p>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Σύνδεση…' : 'Σύνδεση'}
            </button>
          </div>

          {serverError && <Message type="error">{serverError}</Message>}
        </form>

        <p className="muted">
          Δεν έχεις λογαριασμό; <Link to="/register">Εγγραφή</Link>
        </p>
        <p className="muted small">
          Λογαριασμοί δοκιμής: admin@aueb.gr / Admin123! · user@aueb.gr / User123!
        </p>
      </div>
    </section>
  );
}
