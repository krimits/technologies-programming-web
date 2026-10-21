import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="container">
      <div className="card">
        <h1>404 — Η σελίδα δεν βρέθηκε</h1>
        <p className="muted">
          Η σελίδα που ζητήθηκε δεν υπάρχει. <Link to="/">Επιστροφή στον κατάλογο</Link>
        </p>
      </div>
    </section>
  );
}
