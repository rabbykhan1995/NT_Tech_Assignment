import express from "express";
import rateLimit from "express-rate-limit";

import { validate } from "../../middlewares/validation.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { OwnerController } from "./owner.controller";
import { ownerLoginSchema } from "./owner.validator";

const router = express.Router();

// Basic brute-force protection for the single login endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

router.post(
  "/login",
  loginLimiter,
  validate(ownerLoginSchema),
  asyncHandler(OwnerController.login),
);

router.get("/me", authMiddleware, asyncHandler(OwnerController.me));

router.get("/logout", authMiddleware, asyncHandler(OwnerController.logout));

export default router;
