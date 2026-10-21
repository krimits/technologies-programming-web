import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          Mini <span>e-shop</span>
        </Link>

        <nav className="nav-links" aria-label="Κύρια πλοήγηση">
          <NavLink to="/" end>
            Κατάλογος
          </NavLink>
          <NavLink to="/cart">
            Καλάθι{count > 0 ? ` (${count})` : ''}
          </NavLink>
          {isAuthenticated && <NavLink to="/orders">Οι παραγγελίες μου</NavLink>}
          {isAdmin && <NavLink to="/admin">Διαχείριση προϊόντων</NavLink>}
        </nav>

        <div className="nav-user">
          {isAuthenticated ? (
            <>
              <span className="nav-email">
                {user.firstName} {user.lastName} · <strong>{user.role}</strong>
              </span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Αποσύνδεση
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Σύνδεση
              </Link>
              <Link to="/register" className="btn btn-primary">
                Εγγραφή
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
