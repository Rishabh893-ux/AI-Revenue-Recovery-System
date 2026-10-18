// Mock product catalog used until the backend/Supabase product endpoint is wired in.
// Shape matches what the backend is expected to return, so swapping the data
// source later doesn't require touching any component.

export const products = [
  {
    id: "prod_headphones",
    name: "Wireless Headphones",
    category: "Audio",
    description: "Over-ear ANC headphones with 40-hour battery life and plush memory-foam cushions.",
    price: 4500,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "prod_keyboard",
    name: "Mechanical Keyboard",
    category: "Accessories",
    description: "Hot-swappable mechanical keyboard with per-key RGB and a machined aluminum frame.",
    price: 3200,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "prod_mouse",
    name: "Gaming Mouse",
    category: "Accessories",
    description: "Lightweight 58g mouse with a 26,000 DPI sensor and zero-latency wireless dongle.",
    price: 1800,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "prod_watch",
    name: "Smart Watch",
    category: "Wearables",
    description: "AMOLED smartwatch with continuous heart-rate tracking and 10-day battery life.",
    price: 6500,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "prod_speaker",
    name: "Portable Speaker",
    category: "Audio",
    description: "IP67 waterproof speaker with 360° sound and 24 hours of playtime per charge.",
    price: 2800,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "prod_webcam",
    name: "4K Webcam",
    category: "Accessories",
    description: "4K/30fps webcam with auto-framing and a built-in privacy shutter.",
    price: 4200,
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=85",
  },
];

export const getProductById = (id) => products.find((p) => p.id === id);
