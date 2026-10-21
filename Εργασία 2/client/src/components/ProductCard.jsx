import { useState } from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="card product-card">
      <div className="product-head">
        <h3>{product.name}</h3>
        <span className="product-category">{product.category}</span>
      </div>

      {product.description && <p className="product-description">{product.description}</p>}

      <div className="product-foot">
        <span className="product-price">{product.price.toFixed(2)} €</span>
        {product.available ? (
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            {added ? '✓ Στο καλάθι' : 'Προσθήκη'}
          </button>
        ) : (
          <span className="badge badge-off">Μη διαθέσιμο</span>
        )}
      </div>
    </article>
  );
}
