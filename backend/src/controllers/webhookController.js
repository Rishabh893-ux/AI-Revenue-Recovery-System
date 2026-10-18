import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { success, fail } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import {
  notifyAbandonedCart,
  notifyPaymentFailed,
  logAgentAction,
  markRecoveryActionsRecovered,
} from "../services/recoveryService.js";
import { recordPaymentEvent } from "../services/paymentService.js";

// Writes below are logged-but-not-thrown on failure: Razorpay retries a
// webhook aggressively if it doesn't get a 200, so a transient Supabase
// error shouldn't turn into a retry storm. We still want the failure
// visible, though, so nothing here fails silently.
async function safeRecordEvent(event) {
  try {
    return await recordPaymentEvent(event);
  } catch (err) {
    logger.error(`Failed to record payment_events (${event.status}):`, err.message);
    return { duplicate: false, failed: true };
  }
}

// POST /api/webhooks/razorpay
// Signature already verified by the verifyWebhook middleware before this
// runs. This is the real source of truth for payment status — not the
// frontend's Checkout success callback.
export const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const event = req.body.event;
  const payment = req.body.payload?.payment?.entity;

  logger.info("Razorpay webhook received:", event);

  if (!payment || (event !== "payment.captured" && event !== "payment.failed")) {
    return success(res, { received: true, ignored: true });
  }

  const cartId = payment.notes?.cartId;
  const status = event === "payment.captured" ? "captured" : "failed";

  const { duplicate } = await safeRecordEvent({
    cartId,
    orderId: payment.order_id,
    paymentId: payment.id,
    status,
    amount: payment.amount / 100,
  });

  // Razorpay retry of an event we've already processed — acknowledge it
  // without re-updating the cart or re-notifying n8n.
  if (duplicate) {
    return success(res, { received: true, duplicate: true });
  }

  if (cartId && status === "captured") {
    const { error: updateError } = await supabase
      .from("carts")
      .update({ payment_status: "paid", status: "paid", updated_at: new Date().toISOString() })
      .eq("id", cartId);
    if (updateError) logger.error("Failed to update cart to paid:", updateError.message);

    await markRecoveryActionsRecovered(cartId);
  }

  if (cartId && status === "failed") {
    // Never downgrade a cart that's already paid — a failed attempt can
    // arrive after (or alongside) a later successful retry.
    const { error: updateError } = await supabase
      .from("carts")
      .update({ payment_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", cartId)
      .or("payment_status.is.null,payment_status.neq.paid");
    if (updateError) logger.error("Failed to update cart to failed:", updateError.message);

    await notifyPaymentFailed({
      cartId,
      orderId: payment.order_id,
      reason: payment.error_description,
    });
  }

  // Razorpay just needs a 200 to know the webhook was received.
  return success(res, { received: true });
});

// POST /api/webhooks/cart-abandoned
// Called by a scheduled job (cron, or an n8n schedule trigger) that scans
// for carts inactive past a threshold — React never decides this itself.
export const markCartAbandoned = asyncHandler(async (req, res) => {
  const { cartId } = req.body;
  if (!cartId) return fail(res, "cartId is required.", 422);

  const { data: cart, error } = await supabase
    .from("carts")
    .update({ status: "abandoned", updated_at: new Date().toISOString() })
    .eq("id", cartId)
    .neq("status", "paid") // a paid cart must never be "recovered"
    .select()
    .maybeSingle();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  if (!cart) return fail(res, "Cart not found or already paid.", 404);

  await notifyAbandonedCart(cart);
  return success(res, { cartId, status: "abandoned" });
});

// POST /api/webhooks/n8n/recovery-action
// n8n calls this after Gemini decides on and executes a recovery action, so
// it's recorded and shows up in the dashboard's recovery table. Protected by
// a shared secret header (see middleware/requireN8nSecret.js) rather than a
// Razorpay-style signature.
export const recordRecoveryAction = asyncHandler(async (req, res) => {
  const { cartId, customerName, amount, problem, aiAction, status } = req.body;

  if (!cartId || !problem || !aiAction || !status) {
    return fail(res, "cartId, problem, aiAction and status are required.", 422);
  }

  await logAgentAction({ cartId, customerName, amount, problem, aiAction, status });
  return success(res, { recorded: true }, 201);
});
