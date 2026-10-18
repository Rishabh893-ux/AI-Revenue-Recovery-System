// Thin wrapper around the Razorpay SDK — order creation and payment
// signature verification. Nothing here touches Supabase; paymentService.js
// composes this with persistence.
import crypto from "crypto";
import { razorpay } from "../config/razorpay.js";
import { env } from "../config/env.js";

export async function createOrder({ cartId, amount, customer }) {
  // Razorpay expects amount in the smallest currency unit (paise for INR).
  const amountInPaise = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: cartId,
    notes: {
      cartId,
      customerName: customer?.name || "",
      customerEmail: customer?.email || "",
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  };
}

// Verifies the signature Razorpay Checkout returns to the frontend after
// payment. This confirms the payment response wasn't tampered with, but the
// Razorpay webhook (verified separately, server-to-server) remains the
// ultimate source of truth for payment status.
export function verifySignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Constant-time comparison so the expected signature can't be guessed
  // byte-by-byte from response timing.
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(String(signature));
  return (
    expectedBuffer.length === signatureBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}
