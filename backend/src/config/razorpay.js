// Razorpay instance, initialized once with the secret key. This module is
// only ever imported on the backend — the secret key must never reach the
// frontend bundle.
import Razorpay from "razorpay";
import { env } from "./env.js";

let razorpay;

try {
  razorpay = new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
} catch (err) {
  // env.js already validates the format of both values before this file
  // even runs, so if the SDK itself still rejects them, something more
  // fundamental changed (SDK version, unexpected option shape) — worth a
  // clear pointer rather than a raw SDK stack trace.
  throw new Error(
    `[config/razorpay] Failed to initialize the Razorpay client: ${err.message}\n` +
      "  RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET passed env.js's format checks, so this is " +
      "likely a Razorpay SDK version mismatch rather than a bad credential."
  );
}

export { razorpay };
