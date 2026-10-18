import * as paymentService from "../services/paymentService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { success, fail } from "../utils/response.js";

// POST /api/payment/create-order
// The amount is NOT taken from the request — it's read from the cart the
// backend priced itself (see cartService.upsertCart), so it can't be forged.
export const createOrder = asyncHandler(async (req, res) => {
  const { cartId } = req.body;

  if (!cartId) {
    return fail(res, "cartId is required.", 422);
  }

  const order = await paymentService.initiateOrder({ cartId });
  return success(res, order, 201);
});

// POST /api/payment/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, cartId } = req.body;

  if (!orderId || !paymentId || !signature || !cartId) {
    return fail(res, "orderId, paymentId, signature and cartId are required.", 422);
  }

  const result = await paymentService.confirmPayment({ orderId, paymentId, signature, cartId });
  return success(res, result, 200);
});

// GET /api/payment/:orderId
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const payment = await paymentService.getPaymentByOrderId(orderId);

  if (!payment) {
    return fail(res, "No payment found for that order id.", 404);
  }

  return success(res, payment);
});
