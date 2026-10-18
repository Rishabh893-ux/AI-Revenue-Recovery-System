import * as dashboardService from "../services/dashboardService.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { success } from "../utils/response.js";

// GET /api/dashboard/metrics
export const getMetrics = asyncHandler(async (req, res) => {
  const metrics = await dashboardService.getMetrics();
  return success(res, metrics);
});

// GET /api/dashboard/recovery-actions
export const getRecoveryActions = asyncHandler(async (req, res) => {
  const actions = await dashboardService.getRecoveryActions();
  return success(res, actions);
});
