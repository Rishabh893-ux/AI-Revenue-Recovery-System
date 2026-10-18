import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../hooks/useCart";
import CheckoutForm, { validateCustomer } from "../components/CheckoutForm";
import OrderSummary from "../components/OrderSummary";
import PaymentButton from "../components/PaymentButton";
import EmptyState from "../components/EmptyState";
import { createCart } from "../services/api";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, cartId, cartSubtotal, shipping, cartTotal } = useCart();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = useMemo(() => validateCustomer(customer), [customer]);
  const isValid = Object.keys(errors).length === 0;

  // Register the cart with the backend as soon as the customer starts
  // checking out, so it can be tracked (and later marked "abandoned" by
  // the backend/n8n) if they never complete payment. This is best-effort —
  // it should never block the customer from paying.
  useEffect(() => {
    if (!cartId || items.length === 0) return;
    createCart({
      cartId,
      customer,
      items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
    }).catch(() => {
      // Silently ignored: cart tracking is a backend concern, not a
      // checkout blocker.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId]);

  if (items.length === 0) {
    return (
      <div className="container checkout-empty">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a few products before heading to checkout."
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate("/")}>
              Browse Products
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-grid">
        <div className="checkout-main">
          <CheckoutForm customer={customer} onChange={setCustomer} errors={errors} />

          <div className="checkout-pay-section glass">
            <h3>Payment</h3>
            <p className="checkout-pay-note">
              You'll be redirected to Razorpay's secure checkout to complete payment.
            </p>
            {import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith("rzp_test_") && (
              <p className="checkout-test-note">
                Test mode: use card <strong>4111 1111 1111 1111</strong>, any future expiry,
                CVV <strong>123</strong>, and OTP <strong>123456</strong>.
              </p>
            )}
            <PaymentButton
              cartId={cartId}
              customer={customer}
              items={items}
              disabled={!isValid}
            />
            {!isValid && submitAttempted && (
              <p className="checkout-pay-warning">
                Please complete the customer information above before paying.
              </p>
            )}
            {!isValid && !submitAttempted && (
              <button
                type="button"
                className="checkout-pay-hint"
                onClick={() => setSubmitAttempted(true)}
              >
                Fill in your details to enable payment
              </button>
            )}
          </div>
        </div>

        <OrderSummary
          items={items}
          subtotal={cartSubtotal}
          shipping={shipping}
          total={cartTotal}
        />
      </div>
    </div>
  );
}
