// Server-side source of truth for product prices. The frontend's catalog
// (frontend/src/data/products.js) is for display only — any price sent by
// the browser is ignored and replaced with the price here, so a customer
// can't edit a request and pay less than the real amount.
//
// Keep ids and prices in sync with the frontend catalog (or replace this
// with a Supabase `products` table lookup once one exists).
export const SHIPPING_FLAT_RATE = 99;
export const FREE_SHIPPING_THRESHOLD = 5000;

const products = {
  prod_headphones: { name: "Wireless Headphones", price: 4500 },
  prod_keyboard: { name: "Mechanical Keyboard", price: 3200 },
  prod_mouse: { name: "Gaming Mouse", price: 1800 },
  prod_watch: { name: "Smart Watch", price: 6500 },
  prod_speaker: { name: "Portable Speaker", price: 2800 },
  prod_webcam: { name: "4K Webcam", price: 4200 },
};

export function getProduct(id) {
  return products[id] || null;
}

// Turns client-submitted { id, quantity } pairs into priced line items and a
// total, rejecting unknown products and nonsense quantities.
export function priceItems(items) {
  const lines = items.map((item) => {
    const product = getProduct(item?.id);
    const quantity = Number(item?.quantity);

    if (!product) {
      throw Object.assign(new Error(`Unknown product: ${item?.id}`), { status: 422 });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw Object.assign(new Error(`Invalid quantity for ${item.id}.`), { status: 422 });
    }

    return { productId: item.id, name: product.name, price: product.price, quantity };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const shipping =
    lines.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;

  return { lines, subtotal, shipping, total: subtotal + shipping };
}
