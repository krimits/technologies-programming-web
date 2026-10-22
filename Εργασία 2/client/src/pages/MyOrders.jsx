import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { ordersApi } from '../api.js';
import Message from '../components/Message.jsx';

const STATUSES = ['Σε επεξεργασία', 'Απεστάλη', 'Ολοκληρώθηκε', 'Ακυρώθηκε'];

export default function MyOrders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let active = true;
    ordersApi
      .list()
      .then((data) => {
        if (active) setOrders(data.orders || []);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = async (order, status) => {
    if (status === order.status) return;
    setStatusError('');
    setUpdatingId(order._id);
    try {
      const { order: updated } = await ordersApi.updateStatus(order._id, status);
      setOrders((current) => current.map((o) => (o._id === updated._id ? updated : o)));
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="container">
      <div className="page-head">
        <h1>{isAdmin ? 'Όλες οι παραγγελίες' : 'Οι παραγγελίες μου'}</h1>
      </div>

      {loading && <p className="status">Φόρτωση παραγγελιών…</p>}
      {error && <Message type="error">{error}</Message>}
      {statusError && <Message type="error">{statusError}</Message>}
      {!loading && !error && orders.length === 0 && (
        <p className="empty-state">{isAdmin ? 'Δεν υπάρχει καμία παραγγελία' : 'Δεν έχεις κάνει καμία παραγγελία'}</p>
      )}

      {orders.map((order) => (
        <article key={order._id} className="card order-card">
          <div className="order-head">
            <h2>Παραγγελία #{String(order._id).slice(-6)}</h2>
            <span className="badge">{order.status}</span>
            <span className="muted">{new Date(order.date).toLocaleDateString('el-GR')}</span>
          </div>

          {isAdmin && order.user && (
            <p className="order-customer muted">
              Πελάτης: {order.user.firstName} {order.user.lastName} ({order.user.email})
            </p>
          )}

          <table className="table">
            <thead>
              <tr>
                <th>Προϊόν</th>
                <th>Τιμή</th>
                <th>Ποσότητα</th>
                <th>Σύνολο</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={`${order._id}-${index}`}>
                  <td>{item.name}</td>
                  <td>{item.price.toFixed(2)} €</td>
                  <td>{item.qty}</td>
                  <td>{(item.price * item.qty).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Σύνολο παραγγελίας</td>
                <td>
                  <strong>{order.total.toFixed(2)} €</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          {isAdmin && (
            <div className="order-status-control">
              <label htmlFor={`status-${order._id}`}>Κατάσταση:</label>
              <select
                id={`status-${order._id}`}
                value={order.status}
                disabled={updatingId === order._id}
                onChange={(event) => handleStatusChange(order, event.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
