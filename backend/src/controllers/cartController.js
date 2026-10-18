import * as cartService from "../services/cartService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { success, fail } from "../utils/response.js";

// POST /api/carts
// Called by the frontend when a customer enters checkout, so the cart is
// trackable for abandonment even before any payment is attempted.
export const createCart = asyncHandler(async (req, res) => {
  const { cartId, customer, items } = req.body;

  if (!cartId || !Array.isArray(items)) {
    return fail(res, "cartId and items are required.", 422);
  }

  const result = await cartService.upsertCart({ cartId, customer, items });
  return success(res, result, 201);
});
