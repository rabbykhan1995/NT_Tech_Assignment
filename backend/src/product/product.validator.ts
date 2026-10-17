import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),

  stock: z.coerce.number().min(0, "Stock cannot be negative").default(0),

  alertQty: z.coerce.number().min(0, "Alert quantity cannot be negative").default(0),

  purchasePrice: z.coerce.number().min(0, "Purchase price cannot be negative").default(0),

  salePrice: z.coerce.number().min(0, "Sale price cannot be negative").default(0),

  discountPrice: z.coerce.number().min(0, "Discount price cannot be negative").optional(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),

  stock: z.coerce.number().min(0, "Stock cannot be negative").optional(),

  alertQty: z.coerce.number().min(0, "Alert quantity cannot be negative").optional(),

  purchasePrice: z.coerce.number().min(0, "Purchase price cannot be negative").optional(),

  salePrice: z.coerce.number().min(0, "Sale price cannot be negative").optional(),

  discountPrice: z.coerce.number().min(0, "Discount price cannot be negative").nullable().optional(),
});
