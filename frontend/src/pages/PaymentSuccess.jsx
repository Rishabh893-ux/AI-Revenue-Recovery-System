import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentStatus from "../components/PaymentStatus";
import { useCart } from "../hooks/useCart";

export default function PaymentSuccess() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  // The cart only clears when we arrive here from a backend-verified
  // payment (PaymentButton passes the orderId in router state) — opening
  // /payment/success directly or from a bookmark must not wipe the cart.
  const verifiedOrderId = state?.orderId;
  useEffect(() => {
    if (verifiedOrderId) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedOrderId]);

  const orderId = state?.orderId || "—";
  const amount = state?.amount;
  const customerName = state?.customerName;

  return (
    <div className="container">
      <PaymentStatus
        variant="success"
        title="Payment successful"
        message="Your order is confirmed. Keep the order ID below for your records."
        details={[
          { label: "Order ID", value: orderId },
          amount != null && { label: "Amount", value: `₹${amount.toLocaleString("en-IN")}` },
          customerName && { label: "Customer", value: customerName },
        ].filter(Boolean)}
      >
        <button type="button" className="btn btn-primary" onClick={() => navigate("/")}>
          Continue Shopping
        </button>
      </PaymentStatus>
    </div>
  );
}
