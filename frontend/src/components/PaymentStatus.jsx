import { CheckCircle2, XCircle } from "lucide-react";
import "./PaymentStatus.css";

export default function PaymentStatus({
  variant, // "success" | "failed"
  title,
  message,
  details = [],
  children,
}) {
  const isSuccess = variant === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className={`payment-status glass ${isSuccess ? "is-success" : "is-failed"}`}>
      <div className="payment-status-icon">
        <Icon size={40} strokeWidth={1.6} />
      </div>
      <h2>{title}</h2>
      {message && <p className="payment-status-message">{message}</p>}

      {details.length > 0 && (
        <dl className="payment-status-details">
          {details.map((d) => (
            <div key={d.label}>
              <dt>{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="payment-status-actions">{children}</div>
    </div>
  );
}
