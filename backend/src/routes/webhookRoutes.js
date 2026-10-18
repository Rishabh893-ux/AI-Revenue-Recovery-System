import { Router } from "express";
import {
  handleRazorpayWebhook,
  markCartAbandoned,
  recordRecoveryAction,
} from "../controllers/webhookController.js";
import { verifyWebhook } from "../middleware/verifyWebhook.js";
import { requireN8nSecret } from "../middleware/requireN8nSecret.js";

const router = Router();

// Signature-verified — see server.js for the raw-body capture this route needs.
router.post("/razorpay", verifyWebhook, handleRazorpayWebhook);

// Called by a scheduled abandonment-check job, not by the frontend. Requires
// the x-n8n-secret header, otherwise anyone could trigger recovery emails.
router.post("/cart-abandoned", requireN8nSecret, markCartAbandoned);

// Called by n8n after a recovery action completes.
router.post("/n8n/recovery-action", requireN8nSecret, recordRecoveryAction);

export default router;
