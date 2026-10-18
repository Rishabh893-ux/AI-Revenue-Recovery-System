import "./CartSummary.css";

export default function CartSummary({
  subtotal,
  shipping,
  total,
  freeShippingThreshold,
}) {
  const remaining = Math.max(freeShippingThreshold - subtotal, 0);

  return (
    <div className="cart-summary">
      {remaining > 0 && shipping > 0 && (
        <p className="cart-summary-note">
          Add ₹{remaining.toLocaleString("en-IN")} more for free shipping.
        </p>
      )}

      <div className="cart-summary-row">
        <span>Subtotal</span>
        <span>₹{subtotal.toLocaleString("en-IN")}</span>
      </div>
      <div className="cart-summary-row">
        <span>Shipping</span>
        <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span>
      </div>
      <div className="cart-summary-row cart-summary-total">
        <span>Total</span>
        <span>₹{total.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
