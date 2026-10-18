// Centralized backend API layer.
//
// Every network call the app makes to its own backend goes through here —
// components never call fetch() directly. This keeps the base URL, error
// handling, and payload shapes in one place, and makes it trivial to point
// the app at a real backend later by changing VITE_API_URL alone.

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(
      `Could not reach the backend at ${url}. Is the API running?`,
      0
    );
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(
      body?.message || `Request to ${path} failed with status ${response.status}`,
      response.status
    );
  }

  return body;
}

/* -------------------- Carts -------------------- */

// Registers (or updates) a cart with the backend so it can be tracked for
// abandonment. Only product ids and quantities matter — the backend prices
// every item itself and computes the total, so nothing here is trusted.
export function createCart({ cartId, customer, items }) {
  return request("/carts", {
    method: "POST",
    body: JSON.stringify({ cartId, customer, items }),
  });
}

/* -------------------- Payments -------------------- */

// Asks the backend to create a Razorpay order. The backend holds the
// Razorpay secret key and returns only what the frontend needs to open
// Checkout — the frontend never touches a secret credential. The amount is
// taken from the cart the backend already priced, not from the browser.
export function createPaymentOrder({ cartId }) {
  return request("/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ cartId }),
  });
}

// Sends the Razorpay response back to the backend for signature
// verification. The backend's verification (and the Razorpay webhook) is
// the real source of truth for payment status, not this response.
export function verifyPayment({ orderId, paymentId, signature, cartId }) {
  return request("/payment/verify", {
    method: "POST",
    body: JSON.stringify({ orderId, paymentId, signature, cartId }),
  });
}

export function getPaymentStatus(orderId) {
  return request(`/payment/${orderId}`, { method: "GET" });
}

/* -------------------- Dashboard -------------------- */

export function getDashboardMetrics() {
  return request("/dashboard/metrics", { method: "GET" });
}

export function getRecoveryActions() {
  return request("/dashboard/recovery-actions", { method: "GET" });
}

export { ApiError };
