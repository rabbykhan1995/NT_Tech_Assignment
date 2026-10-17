import express from "express";
import { validate } from "../../middlewares/validation.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createContactSchema,
  updateContactSchema,
} from "./contact.validator";
import { ContactController } from "./contact.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = express.Router();

router
  .post(
    "/create",
    authMiddleware,
    validate(createContactSchema),
    asyncHandler(ContactController.create),
  )
  .put(
    "/update/:id",
    authMiddleware, 
    validate(updateContactSchema),
    asyncHandler(ContactController.update),
  )
  // .delete('/delete/:id', authMiddleware, checkSubscription,
  //   asyncHandler(ContactController.delete))
  .get("/list", authMiddleware, asyncHandler(ContactController.list))

  .get('/contactByID/:id',authMiddleware, asyncHandler(ContactController.getContactByID) )


export default router;
