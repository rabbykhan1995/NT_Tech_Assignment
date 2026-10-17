import { z } from "zod";

export const createSupplierProductSchema = z.object({
  supplierID: z
    .number({ message: "Supplier is required" })
    .int()
    .min(1, { message: "Supplier is required" }),

  productID: z
    .number({ message: "Product is required" })
    .int()
    .min(1, { message: "Product is required" }),

  purchasePrice: z
    .number({ message: "Purchase price must be a number" })
    .min(0, { message: "Purchase price cannot be negative" })
    .default(0),

  leadTimeDays: z
    .number({ message: "Lead time must be a number" })
    .int()
    .min(0, { message: "Lead time cannot be negative" })
    .default(0),

  minOrderQty: z
    .number({ message: "Minimum order quantity must be a number" })
    .min(0, { message: "Minimum order quantity cannot be negative" })
    .default(1),

  supplierSKU: z.string().trim().max(120).optional().nullable(),

  isPreferred: z.boolean().optional().default(false),
});

export const updateSupplierProductSchema = createSupplierProductSchema
  .omit({ supplierID: true, productID: true })
  .partial();
