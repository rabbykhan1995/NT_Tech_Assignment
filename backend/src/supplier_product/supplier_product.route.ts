import express from "express";
import { validate } from "../../middlewares/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  createSupplierProductSchema,
  updateSupplierProductSchema,
} from "./supplier_product.validator";
import { SupplierProductController } from "./supplier_product.controller";

const router = express.Router();

router
  .post(
    "/create",
    authMiddleware,
    validate(createSupplierProductSchema),
    asyncHandler(SupplierProductController.create),
  )
  .put(
    "/update/:id",
    authMiddleware,
    validate(updateSupplierProductSchema),
    asyncHandler(SupplierProductController.update),
  )
  .delete(
    "/delete/:id",
    authMiddleware,
    asyncHandler(SupplierProductController.remove),
  )
  .get(
    "/product/:productID",
    authMiddleware,
    asyncHandler(SupplierProductController.listByProduct),
  )
  .get(
    "/supplier/:supplierID",
    authMiddleware,
    asyncHandler(SupplierProductController.listBySupplier),
  );

export default router;
