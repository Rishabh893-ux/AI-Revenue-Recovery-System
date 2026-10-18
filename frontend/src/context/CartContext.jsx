import { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext(null);

const STORAGE_KEY = "reviveai_cart";
const SHIPPING_FLAT_RATE = 99;
const FREE_SHIPPING_THRESHOLD = 5000;

function loadInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], cartId: null };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      cartId: parsed.cartId || null,
    };
  } catch {
    return { items: [], cartId: null };
  }
}

function generateCartId() {
  return `cart_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function CartProvider({ children }) {
  const [{ items, cartId }, setCartState] = useState(loadInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, cartId }));
  }, [items, cartId]);

  function ensureCartId(state) {
    return state.cartId || generateCartId();
  }

  function addToCart(product, quantity = 1) {
    setCartState((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      const nextItems = existing
        ? state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...state.items, { ...product, quantity }];

      return { items: nextItems, cartId: ensureCartId(state) };
    });
  }

  function removeFromCart(productId) {
    setCartState((state) => ({
      ...state,
      items: state.items.filter((item) => item.id !== productId),
    }));
  }

  function increaseQuantity(productId) {
    setCartState((state) => ({
      ...state,
      items: state.items.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }));
  }

  function decreaseQuantity(productId) {
    setCartState((state) => ({
      ...state,
      items: state.items
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0),
    }));
  }

  function clearCart() {
    setCartState({ items: [], cartId: null });
  }

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const cartSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const shipping = useMemo(() => {
    if (items.length === 0) return 0;
    return cartSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }, [cartSubtotal, items.length]);

  const cartTotal = cartSubtotal + shipping;

  const value = {
    cartId,
    items,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    shipping,
    cartTotal,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
