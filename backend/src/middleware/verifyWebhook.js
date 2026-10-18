import crypto from "crypto";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Verifies the X-Razorpay-Signature header against an HMAC-SHA256 of the
// raw request body, using the webhook secret configured in the Razorpay
// dashboard. This is what makes the webhook route trustworthy — anyone
// could POST to this URL, but only Razorpay knows the secret needed to
// produce a matching signature.
//
// Requires `req.rawBody` to be populated — see server.js, which captures
// the raw buffer specifically for this route before JSON-parsing it.
export function verifyWebhook(req, res, next) {
  const signature = req.headers["x-razorpay-signature"];

  if (!signature) {
    return res.status(400).json({ message: "Missing Razorpay signature header." });
  }

  if (!env.razorpayWebhookSecret) {
    logger.error("RAZORPAY_WEBHOOK_SECRET is not configured.");
    return res.status(500).json({ message: "Webhook verification is not configured." });
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(req.rawBody)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!isValid) {
    logger.warn("Rejected webhook with invalid signature.");
    return res.status(400).json({ message: "Invalid webhook signature." });
  }

  next();
}
