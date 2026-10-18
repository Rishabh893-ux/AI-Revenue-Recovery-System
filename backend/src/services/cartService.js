// Cart persistence against Supabase.
//
// ASSUMED SCHEMA (adjust to match your actual migrations —
// 001_create_carts.sql / 002_create_cart_items.sql):
//
//   carts
//     id              text primary key   (the frontend-generated cartId)
//     customer_name   text
//     customer_email  text
//     customer_phone  text
//     total_amount    numeric
//     status          text   -- 'active' | 'abandoned' | 'paid'
//     created_at      timestamptz default now()
//     updated_at      timestamptz default now()
//
//   cart_items
//     id          uuid primary key default gen_random_uuid()
//     cart_id     text references carts(id)
//     product_id  text
//     name        text
//     price       numeric
//     quantity    integer
//
// If your actual column names differ, this is the only file that needs to
// change — controllers just call these functions.
import { supabase } from "../config/supabase.js";
import { priceItems } from "../data/catalog.js";

function dbError(error) {
  return Object.assign(new Error(error.message), { status: 500 });
}

export async function upsertCart({ cartId, customer, items }) {
  // Prices and the total are computed here from the server-side catalog —
  // whatever prices/total the browser sent are ignored.
  const { lines, total } = priceItems(items);

  const { data: existing, error: lookupError } = await supabase
    .from("carts")
    .select("status")
    .eq("id", cartId)
    .maybeSingle();

  if (lookupError) throw dbError(lookupError);

  // A paid cart is final — don't let anyone (or a stale browser tab) reopen
  // it or rewrite its contents.
  if (existing?.status === "paid") {
    throw Object.assign(new Error("This cart has already been paid for."), { status: 409 });
  }

  const { error: cartError } = await supabase.from("carts").upsert({
    id: cartId,
    customer_name: customer?.name || null,
    customer_email: customer?.email || null,
    customer_phone: customer?.phone || null,
    total_amount: total,
    status: "active",
    updated_at: new Date().toISOString(),
  });

  if (cartError) throw dbError(cartError);

  // Replace existing line items for this cart with the current snapshot —
  // simplest way to keep cart_items in sync as the customer edits their cart.
  const { error: deleteError } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (deleteError) throw dbError(deleteError);

  if (lines.length > 0) {
    const rows = lines.map((line) => ({
      cart_id: cartId,
      product_id: line.productId,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
    }));

    const { error: itemsError } = await supabase.from("cart_items").insert(rows);
    if (itemsError) throw dbError(itemsError);
  }

  return { cartId, status: "active", totalAmount: total };
}

export async function markCartStatus(cartId, status) {
  const { error } = await supabase
    .from("carts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", cartId);

  if (error) throw dbError(error);
}

export async function getCartById(cartId) {
  const { data, error } = await supabase
    .from("carts")
    .select("*, cart_items(*)")
    .eq("id", cartId)
    .maybeSingle();

  if (error) throw dbError(error);
  return data;
}
