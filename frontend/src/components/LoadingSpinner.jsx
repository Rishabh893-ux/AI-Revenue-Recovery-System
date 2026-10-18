import "./LoadingSpinner.css";

export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <svg className="spinner-pulse" viewBox="0 0 120 40" aria-hidden="true">
        <polyline
          points="0,20 25,20 33,6 41,34 49,14 57,26 65,20 120,20"
          fill="none"
          stroke="url(#pulseGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="pulseGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--indigo)" />
            <stop offset="100%" stopColor="var(--pulse)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="spinner-label">{label}</span>
    </div>
  );
}
