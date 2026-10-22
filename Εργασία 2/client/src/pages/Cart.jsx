import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ordersApi } from '../api.js';
import Message from '../components/Message.jsx';

export default function Cart() {
  const { items, total, count, setQuantity, remove, clear, toOrderPayload } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      setError('Πρέπει να συνδεθείτε για να ολοκληρώσετε την παραγγελία.');
      return;
    }

    setSubmitting(true);
    try {
      // Στέλνουμε ΜΟΝΟ id και ποσότητα — τις τιμές τις υπολογίζει ο server.
      const { order } = await ordersApi.create(toOrderPayload());
      setSuccess(`Η παραγγελία #${String(order._id).slice(-6)} ολοκληρώθηκε. Σύνολο: ${order.total.toFixed(2)} €`);
      clear();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Μετά από επιτυχημένο checkout το καλάθι αδειάζει, οπότε το μήνυμα επιτυχίας
  // πρέπει να εμφανίζεται και εδώ — αλλιώς ο χρήστης βλέπει μόνο «Το καλάθι είναι κενό».
  if (items.length === 0) {
    return (
      <section className="container">
        <div className="page-head">
          <h1>Το καλάθι σου</h1>
        </div>
        {success && <Message type="success">{success}</Message>}
        <p className="empty-state">
          Το καλάθι είναι κενό. <Link to="/">Πήγαινε στον κατάλογο</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="container">
      <div className="page-head">
        <h1>Το καλάθι σου</h1>
        <p className="muted">{count} προϊόντα</p>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Προϊόν</th>
              <th>Τιμή</th>
              <th>Ποσότητα</th>
              <th>Σύνολο</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId}>
                <td>{item.name}</td>
                <td>{item.price.toFixed(2)} €</td>
                <td>
                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.qty - 1)}
                      aria-label={`Μείωση ποσότητας ${item.name}`}
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.productId, item.qty + 1)}
                      aria-label={`Αύξηση ποσότητας ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{(item.price * item.qty).toFixed(2)} €</td>
                <td>
                  <button type="button" className="btn-link danger" onClick={() => remove(item.productId)}>
                    Αφαίρεση
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Σύνολο</td>
              <td>
                <strong>{total.toFixed(2)} €</strong>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>

        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={handleCheckout} disabled={submitting}>
            {submitting ? 'Υποβολή…' : 'Ολοκλήρωση παραγγελίας'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Συνέχεια αγορών
          </button>
        </div>

        {error && <Message type="error">{error}</Message>}
        {success && <Message type="success">{success}</Message>}
      </div>
    </section>
  );
}
