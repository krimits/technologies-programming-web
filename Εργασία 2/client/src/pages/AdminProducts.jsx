import { useEffect, useState } from 'react';
import { productsApi } from '../api.js';
import Message from '../components/Message.jsx';

const EMPTY_FORM = { name: '', category: '', price: '', available: true, description: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    productsApi
      .list()
      .then((data) => setProducts(data.products || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);

    try {
      if (editingId) {
        await productsApi.update(editingId, {
          ...form,
          price: Number(form.price)
        });
        setSuccess('Το προϊόν ενημερώθηκε.');
      } else {
        await productsApi.create({ ...form, price: Number(form.price) });
        setSuccess('Το προϊόν προστέθηκε.');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      available: product.available,
      description: product.description || ''
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (product) => {
    setError('');
    setSuccess('');
    if (!window.confirm(`Διαγραφή του προϊόντος «${product.name}»;`)) return;

    try {
      await productsApi.remove(product._id);
      setSuccess('Το προϊόν διαγράφηκε.');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="container">
      <div className="page-head">
        <h1>Διαχείριση προϊόντων</h1>
        <p className="muted">Διαθέσιμο μόνο για ρόλο Admin — ο έλεγχος γίνεται στον server.</p>
      </div>

      <div className="card">
        <h2>{editingId ? 'Επεξεργασία προϊόντος' : 'Νέο προϊόν'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Όνομα</label>
              <input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="category">Κατηγορία</label>
              <input
                id="category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="price">Τιμή (€)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="available">Διαθεσιμότητα</label>
              <select
                id="available"
                value={form.available ? 'yes' : 'no'}
                onChange={(event) => setForm({ ...form, available: event.target.value === 'yes' })}
              >
                <option value="yes">Διαθέσιμο</option>
                <option value="no">Μη διαθέσιμο</option>
              </select>
            </div>

            <div className="field field-wide">
              <label htmlFor="description">Περιγραφή</label>
              <input
                id="description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {editingId ? 'Αποθήκευση αλλαγών' : 'Προσθήκη προϊόντος'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Ακύρωση
              </button>
            )}
          </div>

          {error && <Message type="error">{error}</Message>}
          {success && <Message type="success">{success}</Message>}
        </form>
      </div>

      <div className="card">
        <h2>Προϊόντα ({products.length})</h2>

        {loading && <p className="status">Φόρτωση…</p>}

        <table className="table">
          <thead>
            <tr>
              <th>Όνομα</th>
              <th>Κατηγορία</th>
              <th>Τιμή</th>
              <th>Διαθεσιμότητα</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.price.toFixed(2)} €</td>
                <td>
                  {product.available ? (
                    <span className="badge badge-ok">Διαθέσιμο</span>
                  ) : (
                    <span className="badge badge-off">Μη διαθέσιμο</span>
                  )}
                </td>
                <td className="actions-column">
                  <button type="button" className="btn-link" onClick={() => handleEdit(product)}>
                    Επεξεργασία
                  </button>
                  <button type="button" className="btn-link danger" onClick={() => handleDelete(product)}>
                    Διαγραφή
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
