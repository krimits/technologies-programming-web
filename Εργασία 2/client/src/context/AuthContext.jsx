/* Authentication context: κρατά τον συνδεδεμένο χρήστη και το JWT. */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setToken, getToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Στην αρχή ελέγχουμε αν υπάρχει αποθηκευμένο token.
     (Το token αποθηκεύεται στο localStorage για να μην χρειάζεται σύνδεση
     σε κάθε refresh· το server επαληθεύει το token σε κάθε αίτημα.) */
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    // Το token μπορεί να έχει λήξει ή να μην είναι έγκυρο — το server θα απαντήσει 401.
    authApi
      .me()
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'Admin',

      async login(email, password) {
        const data = await authApi.login({ email, password });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },

      async register(formData) {
        const data = await authApi.register(formData);
        return data.user;
      },

      logout() {
        setToken(null);
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth πρέπει να χρησιμοποιείται μέσα σε <AuthProvider>.');
  return context;
}
