import { useNavigate } from "react-router-dom";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "../hooks/useCart";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import EmptyState from "./EmptyState";
import "./CartDrawer.css";

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { items, cartSubtotal, shipping, cartTotal, freeShippingThreshold } = useCart();

  function handleCheckout() {
    onClose();
    navigate("/checkout");
  }

  return (
    <>
      <div
        className={`cart-drawer-overlay ${open ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`cart-drawer ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="cart-drawer-header">
          <h3>Your Cart</h3>
          <button type="button" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Browse products and add something you like."
            />
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <CartSummary
              subtotal={cartSubtotal}
              shipping={shipping}
              total={cartTotal}
              freeShippingThreshold={freeShippingThreshold}
            />
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
