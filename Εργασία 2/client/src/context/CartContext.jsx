/* Cart context: το καλάθι ζει στο localStorage, ώστε να διατηρείται μετά
   από ανανέωση της σελίδας. Στον server στέλνουμε ΜΟΝΟ productId + qty. */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'eshop_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const count = items.reduce((sum, item) => sum + item.qty, 0);

    return {
      items,
      total: Math.round(total * 100) / 100,
      count,

      add(product) {
        setItems((current) => {
          const existing = current.find((item) => item.productId === product._id);
          if (existing) {
            return current.map((item) =>
              item.productId === product._id ? { ...item, qty: item.qty + 1 } : item
            );
          }
          return [
            ...current,
            {
              productId: product._id,
              name: product.name,
              price: product.price,
              qty: 1
            }
          ];
        });
      },

      setQuantity(productId, qty) {
        setItems((current) =>
          qty <= 0
            ? current.filter((item) => item.productId !== productId)
            : current.map((item) => (item.productId === productId ? { ...item, qty } : item))
        );
      },

      remove(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },

      clear() {
        setItems([]);
      },

      /* Στέλνουμε στον server ΜΟΝΟ id και ποσότητα — τις τιμές τις βρίσκει εκεί. */
      toOrderPayload() {
        return items.map((item) => ({ productId: item.productId, qty: item.qty }));
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart πρέπει να χρησιμοποιείται μέσα σε <CartProvider>.');
  return context;
}
