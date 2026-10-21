/* Κεντρικός χειρισμός σφαλμάτων: κάθε απάντηση είναι JSON με μήνυμα. */

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Δεν βρέθηκε το endpoint ${req.method} ${req.originalUrl}.`
  });
}

/* eslint-disable-next-line no-unused-vars */
export function errorHandler(error, req, res, next) {
  if (error?.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(error.errors).map(([field, err]) => [field, err.message])
    );
    return res.status(400).json({ message: 'Μη έγκυρα δεδομένα.', details });
  }

  if (error?.code === 11000) {
    return res.status(400).json({ message: 'Το email χρησιμοποιείται ήδη.' });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Μη έγκυρο αναγνωριστικό.' });
  }

  console.error('[error]', error);
  return res.status(500).json({ message: 'Εσωτερικό σφάλμα διακομιστή.' });
}
