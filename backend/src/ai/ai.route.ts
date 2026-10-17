import express from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { AiController } from "./ai.controller";
import { aiAnalyzeSchema } from "./ai.validator";

const router = express.Router();

router.post(
  "/analyze",
  authMiddleware,
  validate(aiAnalyzeSchema),
  asyncHandler(AiController.analyze),
);

export default router;
