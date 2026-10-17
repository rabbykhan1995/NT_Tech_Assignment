import express from "express";
import { validate } from "../../middlewares/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createPurchaseSchema,

} from "./purchase.validator";
import { PurchaseController } from "./purchase.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router
  .post(
    "/create",
    authMiddleware,
    validate(createPurchaseSchema),
    asyncHandler(PurchaseController.create),
  )
  .get("/list", authMiddleware, asyncHandler(PurchaseController.list))
  .get("/purchaseInvoiceByID/:id", authMiddleware, asyncHandler(PurchaseController.purchaseInvoiceByID))


export default router;