import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ReportController } from "./report.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router
    .get(
        "/dashboard",
        authMiddleware,
        asyncHandler(ReportController.dashboardReport),
    )
    .get(
        "/low-stock-products",
        authMiddleware,
        asyncHandler(ReportController.lowStockProducts),
    )

    .get(
        "/stock-out-products",
        authMiddleware,
        asyncHandler(ReportController.stockOutProducts),
    )

    .get(
        "/cash-flow",
        authMiddleware,
        asyncHandler(ReportController.cashFlow),
    )

    .get(
        "/profit-loss",
        authMiddleware,
        asyncHandler(ReportController.profitLoss),
    );

export default router;
