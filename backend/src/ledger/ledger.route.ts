import express from "express";

import { asyncHandler } from "../../utils/asyncHandler";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { LedgerController } from "./ledger.controller";

const router = express.Router();

router
  .get(
    "/list",
    authMiddleware,
    asyncHandler(LedgerController.list),
  )



export default router;