import { useEffect, useState } from 'react';
import { productsApi } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';
import Message from '../components/Message.jsx';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 6;          // προϊόντα ανά σελίδα
const SEARCH_DELAY_MS = 300;  // περιμένουμε να σταματήσει η πληκτρολόγηση πριν ρωτήσουμε τον server

/* Κατάλογος με σελιδοποίηση στον server (bonus): η αναζήτηση, το φίλτρο, η ταξινόμηση
   και η σελίδα στέλνονται ως παράμετροι στο GET /api/products, και ο server επιστρέφει
   μόνο τα προϊόντα της σελίδας μαζί με το σύνολο και το πλήθος των σελίδων. */
export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);

  // Οι κατηγορίες του φίλτρου, μία φορά στην αρχή.
  useEffect(() => {
    productsApi
      .categories()
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));   // χωρίς κατηγορίες μένει μόνο το «Όλες»
  }, []);

  // Debounce: το debouncedSearch αλλάζει 300ms μετά το τελευταίο πλήκτρο,
  // ώστε να μη γίνεται ένα αίτημα για κάθε γράμμα. Νέα αναζήτηση = σελίδα 1.
  useEffect(() => {
    const term = search.trim();
    // Ίδιος όρος (π.χ. στην πρώτη φόρτωση ή ένα κενό στο τέλος): τίποτα να κάνουμε,
    // αλλιώς θα γυρνούσαμε άδικα στη σελίδα 1 τον χρήστη που μόλις άλλαξε σελίδα.
    if (term === debouncedSearch) return undefined;

    const timer = window.setTimeout(() => {
      setDebouncedSearch(term);
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [search, debouncedSearch]);

  // Η σελίδα που φαίνεται: ξαναζητείται όταν αλλάζει κάποια από τις παραμέτρους.
  useEffect(() => {
    let active = true;   // αγνοούμε απαντήσεις που έφτασαν αφού άλλαξαν ήδη οι παράμετροι
    setLoading(true);
    setError('');

    productsApi
      .list({ search: debouncedSearch, category, sort, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setProducts(data.products || []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
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
  }, [debouncedSearch, category, sort, page]);

  // Κάθε αλλαγή φίλτρου ή ταξινόμησης γυρνά στη σελίδα 1
  // (αλλιώς θα ζητούσαμε π.χ. τη σελίδα 3 από αποτελέσματα που χωρούν σε μία).
  const changeCategory = (event) => {
    setCategory(event.target.value);
    setPage(1);
  };

  const changeSort = (event) => {
    setSort(event.target.value);
    setPage(1);
  };

  const changePage = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="container">
      <div className="page-head">
        <h1>Κατάλογος προϊόντων</h1>
        <p className="muted">
          {total} προϊόντα{totalPages > 1 ? ` · σελίδα ${page} από ${totalPages}` : ''}
        </p>
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="search">Αναζήτηση</label>
          <input
            id="search"
            type="search"
            value={search}
            placeholder="Όνομα προϊόντος…"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="category">Κατηγορία</label>
          <select id="category" value={category} onChange={changeCategory}>
            <option value="all">Όλες</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="sort">Ταξινόμηση</label>
          {/* Οι τιμές είναι αυτές που καταλαβαίνει ο server: ?sort=name | price | -price */}
          <select id="sort" value={sort} onChange={changeSort}>
            <option value="name">Όνομα (Α-Ω)</option>
            <option value="price">Τιμή (αύξουσα)</option>
            <option value="-price">Τιμή (φθίνουσα)</option>
          </select>
        </div>
      </div>

      {loading && <p className="status">Φόρτωση προϊόντων…</p>}
      {error && <Message type="error">{error}</Message>}

      {!loading && !error && products.length === 0 && (
        <p className="empty-state">Δεν βρέθηκαν προϊόντα</p>
      )}

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={changePage} />
    </section>
  );
}
