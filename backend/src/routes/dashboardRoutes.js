import { Router } from "express";
import { getMetrics, getRecoveryActions } from "../controllers/dashboardController.js";

const router = Router();

router.get("/metrics", getMetrics);
router.get("/recovery-actions", getRecoveryActions);

export default router;
