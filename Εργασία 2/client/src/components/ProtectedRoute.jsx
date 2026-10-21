import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/* Προστατευμένη διαδρομή: απαιτεί σύνδεση (και προαιρετικά ρόλο Admin).
   ΣΗΜΕΙΩΣΗ: αυτό είναι μόνο UX — ο πραγματικός έλεγχος γίνεται στον server. */
export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="container status">Φόρτωση…</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role && !isAdmin) {
    return <p className="container status error">Δεν έχες δικαίωμα για αυτή τη σελίδα.</p>;
  }

  return children;
}
