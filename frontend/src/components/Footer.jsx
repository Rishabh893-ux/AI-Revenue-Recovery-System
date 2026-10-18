import { Activity } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-brand-mark">
            <Activity size={16} />
          </span>
          ReviveAI
        </div>
        <p className="footer-note">
          AI-powered checkout and revenue recovery for online stores.
        </p>
        <p className="footer-copyright">© {new Date().getFullYear()} ReviveAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
