import express from "express";
import { validate } from "../../middlewares/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createProductSchema,
  updateProductSchema,
} from "./product.validator";
import { ProductController } from "./product.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router
  .post(
    "/create",
    authMiddleware,
    validate(createProductSchema),
    asyncHandler(ProductController.create),
  )
  .put(
    "/update/:id",
    authMiddleware,
    validate(updateProductSchema),
    asyncHandler(ProductController.update),
  )
  .get("/list", authMiddleware,  asyncHandler(ProductController.list))
  .get("/productByID/:id", authMiddleware,  asyncHandler(ProductController.productByID))


export default router;