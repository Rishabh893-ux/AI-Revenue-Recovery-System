import { useLocation, useNavigate } from "react-router-dom";
import PaymentStatus from "../components/PaymentStatus";

// Designed so the AI Revenue Recovery system has a natural landing point to
// reference later (e.g. a recovery email links back to /payment/failed or
// straight to /checkout) — this page itself does not trigger recovery; the
// backend/n8n system owns that.
export default function PaymentFailed() {
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="container">
      <PaymentStatus
        variant="failed"
        title="Payment could not be completed"
        message={
          state?.reason ||
          "Something interrupted your payment. If any amount was deducted it will be refunded " +
            "automatically by your bank — you can try again whenever you're ready."
        }
      >
        {!state?.unconfirmed && (
          <button type="button" className="btn btn-primary" onClick={() => navigate("/checkout")}>
            Retry Payment
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/")}>
          Return to Cart
        </button>
      </PaymentStatus>
    </div>
  );
}
