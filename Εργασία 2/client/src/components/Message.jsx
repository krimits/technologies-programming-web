/* Μικρό component για μηνύματα επιτυχίας/σφάλματος. */
export default function Message({ type = 'success', children }) {
  if (!children) return null;
  return (
    <p className={`message ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
