import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCart } from "../hooks/useCart";
import "./ProductCard.css";

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  function handleAdd() {
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <article className="product-card glass">
      <div className="product-card-media">
        {product.image && !imageFailed ? (
          <img src={product.image} alt={product.name} onError={() => setImageFailed(true)} />
        ) : (
          <span className="product-card-placeholder">{initials(product.name)}</span>
        )}
        <span className="product-card-category">{product.category}</span>
      </div>

      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>

      <div className="product-card-footer">
        <span className="product-card-price">₹{product.price.toLocaleString("en-IN")}</span>
        <button
          type="button"
          className={`btn ${justAdded ? "btn-ghost" : "btn-primary"} product-card-btn`}
          onClick={handleAdd}
        >
          {justAdded ? <Check size={16} /> : <Plus size={16} />}
          {justAdded ? "Added" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
