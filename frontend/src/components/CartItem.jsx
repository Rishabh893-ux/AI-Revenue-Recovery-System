import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "../hooks/useCart";
import "./CartItem.css";

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

export default function CartItem({ item }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-item">
      <div className="cart-item-media">{initials(item.name)}</div>

      <div className="cart-item-info">
        <h4>{item.name}</h4>
        <span className="cart-item-price">₹{item.price.toLocaleString("en-IN")}</span>
      </div>

      <div className="cart-item-qty">
        <button
          type="button"
          aria-label={`Decrease quantity of ${item.name}`}
          onClick={() => decreaseQuantity(item.id)}
        >
          <Minus size={14} />
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity of ${item.name}`}
          onClick={() => increaseQuantity(item.id)}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="cart-item-line-total">
        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
      </div>

      <button
        type="button"
        className="cart-item-remove"
        aria-label={`Remove ${item.name} from cart`}
        onClick={() => removeFromCart(item.id)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
