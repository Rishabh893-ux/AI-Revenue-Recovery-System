// Bridges backend events (abandoned cart, failed payment) to n8n, and logs
// what the AI recovery system does back into Supabase so the dashboard's
// recovery table has real data to show.
//
// This backend NEVER calls Gemini or n8n's internal logic directly — it only
// pings an n8n webhook URL to say "here's what happened, you decide what to
// do", per the architecture: React -> Backend -> Supabase -> n8n -> Gemini.
//
// ASSUMED SCHEMA (003_create_agent_actions.sql):
//
//   agent_actions
//     id             uuid primary key default gen_random_uuid()
//     cart_id        text references carts(id)
//     customer_name  text
//     amount         numeric
//     problem        text   -- 'Abandoned Cart' | 'Payment Failed'
//     ai_action      text   -- e.g. 'Email Recovery', 'Discount Offer'
//     status         text   -- 'Recovered' | 'Pending' | 'Lost'
//     created_at     timestamptz default now()
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

async function pingN8n(url, payload) {
  if (!url) {
    logger.warn("n8n webhook URL not configured — skipping recovery trigger.", payload);
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Never let a hung n8n instance stall the request that triggered this.
      signal: AbortSignal.timeout(10_000),
    });
    // fetch() only throws on network errors — an inactive n8n workflow
    // answers 404, which would otherwise look like success.
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      logger.error(
        `n8n webhook ${url} answered ${res.status} for ${payload.event} — ` +
          "is the workflow active?",
        body.slice(0, 300)
      );
    }
  } catch (err) {
    // A failed n8n ping should never break the customer-facing request that
    // triggered it (e.g. a failed payment response).
    logger.error("Failed to notify n8n:", err.message);
  }
}

export async function notifyAbandonedCart(cart) {
  await pingN8n(env.n8nAbandonedCartWebhook, {
    event: "cart.abandoned",
    cartId: cart.id,
    customer: {
      name: cart.customer_name,
      email: cart.customer_email,
      phone: cart.customer_phone,
    },
    totalAmount: cart.total_amount,
  });
}

export async function notifyPaymentFailed({ cartId, orderId, reason }) {
  await pingN8n(env.n8nFailedPaymentWebhook, {
    event: "payment.failed",
    cartId,
    orderId,
    reason,
  });
}

// Called when a cart is paid. Any recovery actions still "Pending" for that
// cart are marked "Recovered", so the dashboard can credit the AI recovery
// system with the revenue. Safe to call more than once (the /verify endpoint
// and the Razorpay webhook both report the same payment).
export async function markRecoveryActionsRecovered(cartId) {
  if (!cartId) return;
  const { data, error } = await supabase
    .from("agent_actions")
    .update({ status: "Recovered" })
    .eq("cart_id", cartId)
    .eq("status", "Pending")
    .select("id");

  if (error) {
    logger.error(`Failed to mark recovery actions recovered for ${cartId}:`, error.message);
    return;
  }
  if (data && data.length > 0) {
    logger.info(`Cart ${cartId} paid after recovery — ${data.length} action(s) marked Recovered.`);
  }
}

// Called when n8n has taken (or completed) a recovery action, so it shows
// up in the dashboard's recovery activity table. See webhookController.js
// for the endpoint n8n calls to reach this.
export async function logAgentAction({
  cartId,
  customerName,
  amount,
  problem,
  aiAction,
  status,
}) {
  const { error } = await supabase.from("agent_actions").insert({
    cart_id: cartId,
    customer_name: customerName,
    amount,
    problem,
    ai_action: aiAction,
    status,
  });

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
}
