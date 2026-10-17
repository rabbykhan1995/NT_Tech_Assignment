import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { DashboardController } from "./dashboard.controller";

const router = express.Router();

router
  .get("/overview", authMiddleware, asyncHandler(DashboardController.overview))
  .get("/profit-loss", authMiddleware, asyncHandler(DashboardController.profitLoss))
  .get("/cash-flow", authMiddleware, asyncHandler(DashboardController.cashFlow));

export default router;
