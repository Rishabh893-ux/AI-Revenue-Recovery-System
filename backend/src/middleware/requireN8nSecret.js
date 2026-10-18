import crypto from "crypto";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// Protects internal endpoints that only n8n / a scheduled job should call
// (marking carts abandoned, logging recovery actions). The caller must send
// the N8N_SHARED_SECRET value in the `x-n8n-secret` header. If the secret
// isn't configured, the endpoints are closed rather than left open.
export function requireN8nSecret(req, res, next) {
  if (!env.n8nSharedSecret) {
    logger.error("N8N_SHARED_SECRET is not configured — rejecting internal webhook call.");
    return res.status(503).json({ message: "Internal webhooks are not configured." });
  }

  const provided = Buffer.from(String(req.headers["x-n8n-secret"] || ""));
  const expected = Buffer.from(env.n8nSharedSecret);

  const isValid =
    provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  if (!isValid) {
    logger.warn(`Rejected ${req.method} ${req.originalUrl}: invalid or missing x-n8n-secret.`);
    return res.status(401).json({ message: "Invalid or missing n8n shared secret." });
  }

  next();
}
