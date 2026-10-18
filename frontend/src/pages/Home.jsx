import { useEffect, useState } from "react";
import Hero from "../components/Hero";
import ProductGrid from "../components/ProductGrid";
import HowItWorks from "../components/HowItWorks";
import { products as mockProducts } from "../data/products";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function loadProducts() {
    setLoading(true);
    setError(null);
    // Products are static/mock for now. When a backend or Supabase products
    // table exists, replace this block with the real fetch — the rest of
    // the page (ProductGrid, loading/error states) already supports it.
    setTimeout(() => {
      try {
        setProducts(mockProducts);
      } catch {
        setError("Could not load products.");
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <>
      <Hero />

      <section id="products" className="container" style={{ padding: "40px 24px 96px" }}>
        <div className="section-heading">
          <h2>Shop the collection</h2>
          <p>Every purchase here is protected by AI revenue recovery.</p>
        </div>
        <ProductGrid
          products={products}
          loading={loading}
          error={error}
          onRetry={loadProducts}
        />
      </section>

      <HowItWorks />
    </>
  );
}
