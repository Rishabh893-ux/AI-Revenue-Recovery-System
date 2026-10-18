import { Router } from "express";
import { createOrder, verifyPayment, getPaymentStatus } from "../controllers/paymentController.js";

const router = Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);
router.get("/:orderId", getPaymentStatus);

export default router;
