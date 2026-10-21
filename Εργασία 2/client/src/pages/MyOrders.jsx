import { useEffect, useState } from 'react';
import { ordersApi } from '../api.js';
import Message from '../components/Message.jsx';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <section className="container">
      <div className="page-head">
        <h1>Οι παραγγελίες μου</h1>
      </div>

      {loading && <p className="status">Φόρτωση παραγγελιών…</p>}
      {error && <Message type="error">{error}</Message>}
      {!loading && !error && orders.length === 0 && (
        <p className="empty-state">Δεν έχεις κάνει καμία παραγγελία</p>
      )}

      {orders.map((order) => (
        <article key={order._id} className="card order-card">
          <div className="order-head">
            <h2>Παραγγελία #{String(order._id).slice(-6)}</h2>
            <span className="badge">{order.status}</span>
            <span className="muted">{new Date(order.date).toLocaleDateString('el-GR')}</span>
          </div>

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
        </article>
      ))}
    </section>
  );
}
