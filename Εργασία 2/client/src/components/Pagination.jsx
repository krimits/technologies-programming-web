/* Κουμπιά σελίδων: «Προηγούμενη», ένα κουμπί για κάθε σελίδα, «Επόμενη».
   Δεν φέρνει δεδομένα μόνο του: λέει στον γονέα ποια σελίδα ζητήθηκε (onChange). */

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination" aria-label="Σελίδες προϊόντων">
      <button type="button" className="btn btn-ghost" disabled={page === 1} onClick={() => onChange(page - 1)}>
        ← Προηγούμενη
      </button>

      {pages.map((number) => (
        <button
          key={number}
          type="button"
          className={number === page ? 'btn btn-primary' : 'btn btn-ghost'}
          aria-current={number === page ? 'page' : undefined}
          aria-label={`Σελίδα ${number}`}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}

      <button
        type="button"
        className="btn btn-ghost"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Επόμενη →
      </button>
    </nav>
  );
}
