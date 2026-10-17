import express from "express";
import { validate } from "../../middlewares/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createSaleSchema,
} from "./sale.validator";
import { SaleController } from "./sale.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router
  .post(
    "/create",
    authMiddleware,
    validate(createSaleSchema),
    asyncHandler(SaleController.create),
  )
  .get("/list", authMiddleware, asyncHandler(SaleController.list))
  .get("/saleByID/:id", authMiddleware, asyncHandler(SaleController.saleByID))

export default router;