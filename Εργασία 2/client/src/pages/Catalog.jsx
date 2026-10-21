import { useEffect, useMemo, useState } from 'react';
import { productsApi } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Message from '../components/Message.jsx';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');

  useEffect(() => {
    let active = true;
    productsApi
      .list()
      .then((data) => {
        if (active) setProducts(data.products || []);
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

  const categories = useMemo(
    () => ['all', ...new Set(products.map((product) => product.category))],
    [products]
  );

  /* Η αναζήτηση, το φίλτρο και η ταξινόμηση γίνονται στη React (όπως επιτρέπεται). */
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });

    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => a.name.localeCompare(b.name, 'el'));
    return sorted;
  }, [products, search, category, sort]);

  return (
    <section className="container">
      <div className="page-head">
        <h1>Κατάλογος προϊόντων</h1>
        <p className="muted">{visible.length} προϊόντα</p>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="search">Αναζήτηση</label>
          <input
            id="search"
            type="search"
            value={search}
            placeholder="Όνομα ή κατηγορία…"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="category">Κατηγορία</label>
          <select id="category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Όλες' : item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="sort">Ταξινόμηση</label>
          <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="name">Όνομα (Α-Ω)</option>
            <option value="price-asc">Τιμή (αύξουσα)</option>
            <option value="price-desc">Τιμή (φθίνουσα)</option>
          </select>
        </div>
      </div>

      {loading && <p className="status">Φόρτωση προϊόντων…</p>}
      {error && <Message type="error">{error}</Message>}

      {!loading && !error && visible.length === 0 && (
        <p className="empty-state">Δεν βρέθηκαν προϊόντα</p>
      )}

      <div className="product-grid">
        {visible.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
