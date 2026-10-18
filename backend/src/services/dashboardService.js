// Aggregates dashboard numbers from payment_events, carts, and
// agent_actions. Aggregation happens in JS on top of simple selects rather
// than SQL views/RPCs — fine at hackathon/portfolio scale, but if this data
// grows large, replace these with Postgres views or RPC functions for
// performance.
import { supabase } from "../config/supabase.js";

export async function getMetrics() {
  const [{ data: paymentEvents, error: peError }, { data: carts, error: cartsError }] =
    await Promise.all([
      supabase.from("payment_events").select("status, amount, order_id, created_at"),
      supabase.from("carts").select("status, total_amount, created_at"),
    ]);

  if (cartsError) throw Object.assign(new Error(cartsError.message), { status: 500 });
  if (peError && !isMissingSchemaObject(peError)) {
    throw Object.assign(new Error(peError.message), { status: 500 });
  }

  // Older projects may not have the optional payment_events table yet. Use
  // cart payment fields until that migration is applied.
  const captured = peError
    ? (carts || [])
        .filter((cart) => cart.status === "paid")
        .map((cart) => ({ amount: cart.total_amount, created_at: cart.created_at }))
    : successfulPayments(paymentEvents || []);
  const failed = peError
    ? []
    : (paymentEvents || []).filter((event) => event.status === "failed");
  const abandonedCarts = (carts || []).filter((c) => c.status === "abandoned");

  const { data: agentActions, error: actionsError } = await supabase
    .from("agent_actions")
    .select("*");

  if (actionsError && !isMissingSchemaObject(actionsError)) {
    throw Object.assign(new Error(actionsError.message), { status: 500 });
  }

  const availableActions = actionsError ? [] : agentActions || [];
  // One cart can get several recovery actions (e.g. an abandoned-cart email
  // and later a failed-payment email). Count each cart once, so a recovered
  // cart's revenue isn't added twice and the rate is "carts recovered out of
  // carts the AI worked on".
  const recoveredActions = onePerCart(
    availableActions.filter((action) => action.status === "Recovered")
  );
  const cartsWorked = new Set(availableActions.map((a) => a.cart_id ?? a.id)).size;

  const totalRevenue = captured.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const recoveredRevenue = recoveredActions.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const recoveryRate = cartsWorked > 0
    ? Number(((recoveredActions.length / cartsWorked) * 100).toFixed(1))
    : 0;

  const revenueOverTime = buildMonthlySeries(captured, recoveredActions);

  return {
    totalRevenue,
    recoveredRevenue,
    recoveryRate,
    failedPayments: failed.length,
    abandonedCarts: abandonedCarts.length,
    revenueOverTime,
  };
}

export async function getRecoveryActions() {
  const { data, error } = await supabase
    .from("agent_actions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSchemaObject(error)) return [];
    throw Object.assign(new Error(error.message), { status: 500 });
  }

  return (data || []).map((row) => ({
    id: row.id,
    customer: row.customer_name || row.customer || row.name || "Customer",
    cartId: row.cart_id || row.cartId,
    amount: Number(row.amount || 0),
    problem: row.problem || row.issue,
    aiAction: row.ai_action || row.aiAction,
    status: row.status,
    date: row.created_at?.slice(0, 10),
  }));
}

function isMissingSchemaObject(error) {
  return /could not find the table|schema cache|column .* does not exist/i.test(error.message || "");
}

function onePerCart(actions) {
  const byCart = new Map();
  for (const action of actions) {
    const key = action.cart_id ?? action.id;
    if (!byCart.has(key)) byCart.set(key, action);
  }
  return [...byCart.values()];
}

// One successful payment per order. The /verify endpoint writes a
// "verified" event and the Razorpay webhook writes a "captured" event for
// the same order, so counting both would double the revenue.
function successfulPayments(events) {
  const byOrder = new Map();
  for (const event of events) {
    if (event.status !== "verified" && event.status !== "captured") continue;
    const current = byOrder.get(event.order_id);
    const amount = Number(event.amount || 0);
    if (!current || amount > Number(current.amount || 0)) {
      byOrder.set(event.order_id, { amount, created_at: current?.created_at || event.created_at });
    }
  }
  return [...byOrder.values()];
}

function buildMonthlySeries(capturedEvents, recoveredActions) {
  const months = {};

  // Keyed by year AND month so e.g. Oct 2025 and Oct 2026 don't merge.
  const monthKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const bucket = (dateStr) => {
    const key = monthKey(dateStr);
    if (!months[key]) {
      const label = new Date(dateStr).toLocaleString("en-US", { month: "short", year: "2-digit" });
      months[key] = { key, month: label, total: 0, recovered: 0 };
    }
    return months[key];
  };

  capturedEvents.forEach((e) => {
    bucket(e.created_at).total += Number(e.amount || 0);
  });

  recoveredActions.forEach((a) => {
    bucket(a.created_at).recovered += Number(a.amount || 0);
  });

  return Object.values(months)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, ...rest }) => rest);
}
