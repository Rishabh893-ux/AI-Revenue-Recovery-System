// Composes razorpayService (Razorpay API calls) with Supabase persistence.
// This is what paymentController actually calls.
//
// ASSUMED SCHEMA ADDITION (005_add_payment_fields.sql), on top of the carts
// table described in cartService.js:
//
//   carts
//     ...
//     razorpay_order_id    text
//     razorpay_payment_id  text
//     payment_status       text   -- 'pending' | 'paid' | 'failed'
//
//   payment_events
//     id          uuid primary key default gen_random_uuid()
//     cart_id     text references carts(id)
//     order_id    text
//     payment_id  text
//     status      text   -- 'created' | 'verified' | 'failed' | 'captured'
//     amount      numeric
//     created_at  timestamptz default now()
//
// Adjust column names here if your actual migrations differ.
import { supabase } from "../config/supabase.js";
import * as razorpayService from "./razorpayService.js";
import { getCartById } from "./cartService.js";
import { notifyPaymentFailed, markRecoveryActionsRecovered } from "./recoveryService.js";

function dbError(error) {
  return Object.assign(new Error(error.message), { status: 500 });
}

// Inserts a payment_events row unless an identical one (same order, payment
// and status) already exists. Razorpay retries webhooks, and the webhook and
// the /verify endpoint can both report the same payment, so without this the
// table — and the dashboard totals built on it — would fill with duplicates.
export async function recordPaymentEvent({ cartId, orderId, paymentId, status, amount }) {
  let query = supabase
    .from("payment_events")
    .select("id")
    .eq("order_id", orderId)
    .eq("status", status)
    .limit(1);
  query = paymentId ? query.eq("payment_id", paymentId) : query.is("payment_id", null);

  const { data: existing, error: lookupError } = await query;
  if (lookupError) throw dbError(lookupError);
  if (existing && existing.length > 0) return { duplicate: true };

  const { error } = await supabase.from("payment_events").insert({
    cart_id: cartId || null,
    order_id: orderId,
    payment_id: paymentId || null,
    status,
    amount: amount ?? null,
  });
  if (error) throw dbError(error);
  return { duplicate: false };
}

export async function initiateOrder({ cartId }) {
  const cart = await getCartById(cartId);

  if (!cart) {
    throw Object.assign(new Error("Cart not found. Please reload checkout and try again."), {
      status: 404,
    });
  }
  if (cart.status === "paid") {
    throw Object.assign(new Error("This cart has already been paid for."), { status: 409 });
  }

  // total_amount was computed server-side from the catalog when the cart was
  // saved — never from a client-supplied number.
  const amount = Number(cart.total_amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw Object.assign(new Error("Cart total is invalid."), { status: 422 });
  }

  const order = await razorpayService.createOrder({
    cartId,
    amount,
    customer: { name: cart.customer_name, email: cart.customer_email },
  });

  const { error: updateError } = await supabase
    .from("carts")
    .update({
      razorpay_order_id: order.orderId,
      payment_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", cartId);
  if (updateError) throw dbError(updateError);

  await recordPaymentEvent({ cartId, orderId: order.orderId, status: "created", amount });

  return order;
}

export async function confirmPayment({ orderId, paymentId, signature, cartId }) {
  const isValid = razorpayService.verifySignature({ orderId, paymentId, signature });
  const cart = await getCartById(cartId);

  // A valid signature only proves Razorpay issued this order/payment pair —
  // also make sure the order is the one created for THIS cart, so a payment
  // for one cart can't be replayed to mark a different cart as paid.
  const belongsToCart = cart && cart.razorpay_order_id === orderId;

  if (!isValid || !belongsToCart) {
    await recordPaymentEvent({ cartId, orderId, paymentId, status: "failed" });
    await notifyPaymentFailed({ cartId, orderId, reason: "Signature verification failed" });

    const err = new Error("Payment verification failed.");
    err.status = 400;
    throw err;
  }

  const { error: updateError } = await supabase
    .from("carts")
    .update({
      razorpay_payment_id: paymentId,
      payment_status: "paid",
      status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", cartId);
  if (updateError) throw dbError(updateError);

  await recordPaymentEvent({
    cartId,
    orderId,
    paymentId,
    status: "verified",
    amount: Number(cart.total_amount),
  });

  await markRecoveryActionsRecovered(cartId);

  return { verified: true, orderId, paymentId };
}

export async function getPaymentByOrderId(orderId) {
  const { data, error } = await supabase
    .from("payment_events")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw dbError(error);
  return data;
}
