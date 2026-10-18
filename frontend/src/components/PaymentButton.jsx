import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Loader2 } from "lucide-react";
import { createCart, createPaymentOrder, verifyPayment } from "../services/api";
import "./PaymentButton.css";

// Drives the full Razorpay flow described in the spec:
//   React -> POST /api/payment/create-order -> Razorpay Checkout ->
//   POST /api/payment/verify -> success/failure page.
//
// The frontend never creates the Razorpay order itself and never decides
// payment status on its own — the backend (and ultimately the Razorpay
// webhook) is the source of truth. This component only orchestrates the UI.
export default function PaymentButton({ cartId, customer, items, disabled }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // idle | creating | opening | verifying
  const [error, setError] = useState(null);

  async function handlePay() {
    setError(null);

    if (typeof window.Razorpay === "undefined") {
      setError("Payment SDK failed to load. Check your connection and try again.");
      return;
    }

    try {
      setStatus("creating");
      // Save the latest cart contents and the customer's details first: the
      // backend prices the order from this saved cart, and abandoned-cart
      // recovery needs the email/phone to reach the customer later.
      await createCart({
        cartId,
        customer,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      });
      const order = await createPaymentOrder({ cartId });
      const amountInRupees = order.amount / 100;

      setStatus("opening");
      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ReviveAI",
        description: "Order payment",
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone,
        },
        theme: { color: "#6d5ce7" },
        handler: async (response) => {
          try {
            setStatus("verifying");
            await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              cartId,
            });
            navigate("/payment/success", {
              state: {
                orderId: response.razorpay_order_id,
                amount: amountInRupees,
                customerName: customer.name,
              },
            });
          } catch (verifyErr) {
            // A 400 means the backend positively rejected the payment. Anything
            // else (network error, server error) means we simply couldn't
            // confirm it — Razorpay may still have charged the customer, so
            // don't tell them it failed or invite them to pay again.
            const rejected = verifyErr.status === 400;
            navigate("/payment/failed", {
              state: {
                cartId,
                unconfirmed: !rejected,
                reason: rejected
                  ? verifyErr.message
                  : "We couldn't confirm your payment just now. If money was deducted, " +
                    "your order will be confirmed automatically — please don't pay again. " +
                    `Reference: ${response.razorpay_order_id}`,
              },
            });
          }
        },
        modal: {
          ondismiss: () => setStatus("idle"),
        },
      });

      razorpay.on("payment.failed", () => {
        navigate("/payment/failed", { state: { cartId } });
      });

      razorpay.open();
    } catch (err) {
      setStatus("idle");
      setError(err.message || "Could not start the payment. Please try again.");
    }
  }

  const isBusy = status !== "idle";

  return (
    <div className="payment-button-wrap">
      <button
        type="button"
        className="btn btn-primary btn-block payment-btn"
        onClick={handlePay}
        disabled={disabled || isBusy}
      >
        {isBusy ? <Loader2 size={18} className="payment-btn-spin" /> : <CreditCard size={18} />}
        {status === "creating" && "Preparing your order…"}
        {status === "opening" && "Opening Razorpay…"}
        {status === "verifying" && "Confirming payment…"}
        {status === "idle" && "Pay with Razorpay"}
      </button>
      {error && <p className="payment-btn-error">{error}</p>}
    </div>
  );
}
