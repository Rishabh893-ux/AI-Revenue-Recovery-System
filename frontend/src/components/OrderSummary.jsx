import "./OrderSummary.css";

export default function OrderSummary({ items, subtotal, shipping, total }) {
  return (
    <div className="order-summary glass">
      <h3>Order Summary</h3>

      <div className="order-summary-list">
        {items.map((item) => (
          <div key={item.id} className="order-summary-row">
            <div className="order-summary-item-info">
              <span className="order-summary-item-name">{item.name}</span>
              <span className="order-summary-item-qty">Qty {item.quantity}</span>
            </div>
            <span className="order-summary-item-price">
              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>

      <div className="order-summary-totals">
        <div className="order-summary-total-row">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="order-summary-total-row">
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`}</span>
        </div>
        <div className="order-summary-total-row order-summary-grand-total">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
