import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Activity, LayoutDashboard, Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "../hooks/useCart";
import "./Navbar.css";

export default function Navbar({ onCartClick }) {
  const { cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: "/#products", label: "Products" },
    { to: "/#how-it-works", label: "How It Works" },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="navbar-logo-mark">
            <Activity size={18} strokeWidth={2.5} />
          </span>
          ReviveAI
        </Link>

        <nav className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
          {links.map((link) =>
            link.to.startsWith("/#") ? (
              <a key={link.label} href={link.to} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => (isActive ? "is-active" : "")}
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-cart-btn"
            onClick={onCartClick}
            aria-label={`Open cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="navbar-cart-count">{cartCount}</span>}
          </button>

          <button
            type="button"
            className="navbar-menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
