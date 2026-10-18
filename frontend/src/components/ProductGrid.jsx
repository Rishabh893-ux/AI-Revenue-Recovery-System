import { PackageSearch } from "lucide-react";
import ProductCard from "./ProductCard";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import "./ProductGrid.css";

export default function ProductGrid({ products, loading, error, onRetry }) {
  if (loading) return <LoadingSpinner label="Loading products" />;

  if (error) {
    return (
      <ErrorMessage
        title="Couldn't load products"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No products yet"
        description="Check back soon — new products are added regularly."
      />
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
