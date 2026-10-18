import { ArrowDown, Sparkles } from "lucide-react";
import "./Hero.css";

const stats = [
  { label: "Recovery rate", value: "30.9%" },
  { label: "Revenue recovered", value: "₹38.5K" },
  { label: "Avg. recovery time", value: "4.2 hrs" },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <Sparkles size={14} />
            AI revenue recovery, built in
          </span>
          <h1>
            Shop smarter.
            <br />
            Recover more revenue.
          </h1>
          <p className="hero-sub">
            ReviveAI pairs a fast, familiar checkout with an AI system that watches
            every abandoned cart and failed payment — then reaches out to bring the
            sale back to life, automatically.
          </p>
          <div className="hero-cta-row">
            <a href="#products" className="btn btn-primary">
              Explore Products
            </a>
            <a href="#how-it-works" className="btn btn-ghost">
              See How It Works
            </a>
          </div>

          <div className="hero-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="hero-stat">
                <span className="hero-stat-value">{stat.value}</span>
                <span className="hero-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual glass-strong">
          <div className="hero-visual-header">
            <span>Revenue signal</span>
            <span className="hero-visual-live">
              <span className="hero-visual-dot" />
              Live
            </span>
          </div>
          <svg className="hero-pulse-svg" viewBox="0 0 400 160" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--indigo)" />
                <stop offset="55%" stopColor="var(--purple)" />
                <stop offset="100%" stopColor="var(--pulse)" />
              </linearGradient>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--purple)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--purple)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,110 L40,110 L55,60 L70,130 L85,40 L100,110 L160,110 L172,95 L184,110 L230,110 L245,50 L260,140 L275,20 L290,110 L400,110"
              fill="none"
              stroke="url(#heroLine)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hero-pulse-line"
            />
            <path
              d="M0,110 L40,110 L55,60 L70,130 L85,40 L100,110 L160,110 L172,95 L184,110 L230,110 L245,50 L260,140 L275,20 L290,110 L400,110 L400,160 L0,160 Z"
              fill="url(#heroFill)"
              stroke="none"
            />
          </svg>
          <div className="hero-visual-footer">
            <div>
              <span className="hero-visual-footer-label">Flatlined</span>
              <span className="hero-visual-footer-value hero-visual-footer-flat">₹1,240</span>
            </div>
            <ArrowDown size={16} className="hero-visual-arrow" />
            <div>
              <span className="hero-visual-footer-label">Revived by AI</span>
              <span className="hero-visual-footer-value hero-visual-footer-revived">₹1,240</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
