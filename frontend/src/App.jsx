import { lazy, Suspense, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import LoadingSpinner from "./components/LoadingSpinner";

// The dashboard pulls in recharts (the bulk of the bundle), so it's loaded
// only when someone actually opens it — shoppers never download it.
const Dashboard = lazy(() => import("./pages/Dashboard"));

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();

  // Payment status pages get a clean, focused layout without the navbar
  // cart affordance competing for attention right after a transaction.
  const isStatusPage = location.pathname.startsWith("/payment/");

  return (
    <div className="app-shell">
      {!isStatusPage && <Navbar onCartClick={() => setCartOpen(true)} />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failed" element={<PaymentFailed />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingSpinner label="Loading dashboard" />}>
                <Dashboard />
              </Suspense>
            }
          />
        </Routes>
      </main>

      {!isStatusPage && <Footer />}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
