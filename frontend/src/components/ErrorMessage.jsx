import { AlertTriangle, RotateCw } from "lucide-react";
import "./ErrorMessage.css";

export default function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
}) {
  return (
    <div className="error-box glass" role="alert">
      <AlertTriangle size={20} className="error-icon" />
      <div className="error-copy">
        <h4>{title}</h4>
        {message && <p>{message}</p>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn-ghost error-retry" onClick={onRetry}>
          <RotateCw size={16} />
          Try again
        </button>
      )}
    </div>
  );
}
