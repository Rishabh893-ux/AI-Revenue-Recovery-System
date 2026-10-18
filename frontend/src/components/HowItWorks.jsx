import {
  ShoppingCart,
  CreditCard,
  Brain,
  Mail,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import "./HowItWorks.css";

const steps = [
  {
    icon: ShoppingCart,
    title: "Cart created",
    description: "A customer shops and builds a cart, tracked from the first item added.",
  },
  {
    icon: CreditCard,
    title: "Payment attempted",
    description: "At checkout, the customer pays through Razorpay Checkout.",
  },
  {
    icon: Brain,
    title: "AI checks in on failure",
    description: "If payment fails or the cart is left behind, the backend flags it and AI analyzes what happened.",
  },
  {
    icon: Mail,
    title: "Recovery action sent",
    description: "The AI decides the right nudge — usually a personalized email — and sends it automatically.",
  },
  {
    icon: RotateCcw,
    title: "Customer returns",
    description: "The customer comes back to a cart that's exactly as they left it.",
  },
  {
    icon: CheckCircle2,
    title: "Revenue recovered",
    description: "Payment completes, and the recovered revenue shows up on the dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works">
      <div className="container">
        <div className="section-heading">
          <h2>From lost sale to recovered revenue</h2>
          <p>Every abandoned cart and failed payment runs through the same pipeline.</p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step, i) => (
            <div key={step.title} className="how-it-works-card glass">
              <div className="how-it-works-index">{i + 1}</div>
              <div className="how-it-works-icon">
                <step.icon size={20} />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
