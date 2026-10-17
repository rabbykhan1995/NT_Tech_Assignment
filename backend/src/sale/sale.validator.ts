import { z } from "zod";

export const saleProductSchema = z.object({
  productID: z
    .number()
    .min(1, { message: "Product is required" }),
  soldQty: z
    .number({ message: "Quantity must be a number" })
    .min(1, { message: "Quantity must be at least 1" }),
  salePrice: z
    .number({ message: "Sale price must be a number" })
    .min(1, { message: "Sale price must be greater than 0" }),

})

export const fifoSaleProductSchema = z.object({
  productID: z
    .number()
    .min(1, "Product is required"),
  soldQty: z
    .number()
    .min(1, "Quantity must be at least 1"),
  salePrice: z
    .number()
    .min(0.01, "Sale price must be greater than 0"),
});

export const saleSchema = z.object({

  customerID: z
    .number()
    .optional().nullable(),

  note: z.string().optional().nullable(),

  costName: z.string().optional().nullable(),

  totalProductPrice: z
    .number({ message: "Total product price must be a number" })
    .min(0, { message: "Total product price cannot be negative" })
    .default(0),

  otherCost: z
    .number({ message: "Other cost must be a number" })
    .min(0, { message: "Other cost cannot be negative" })
    .default(0),

  discount: z
    .number({ message: "Discount must be a number" })
    .min(0, { message: "Discount cannot be negative" })
    .default(0),

  totalAmount: z
    .number({ message: "Total amount must be a number" })
    .min(0, { message: "Total amount cannot be negative" })
    .default(0),

  paid: z
    .number({ message: "Paid amount must be a number" })
    .min(0, { message: "Paid amount cannot be negative" })
    .default(0),

  saleDate: z
    .coerce
    .date({ message: "Purchase date must be a valid date" }),
})

export const createSaleSchema = z.object({
  products: z
    .array(saleProductSchema)
    .min(1, { message: "At least one product is required" }),
  sale: saleSchema
});

export const updateSaleSchema = z.object({
  invoiceNo: z.string().trim().optional(),
  note: z.string().optional().nullable(),
  costName: z.string().optional().nullable(),
  paid: z.number("Must be a number").min(0).optional(),
  discount: z.number("Must be a number").min(0).optional(),
  otherCost: z.number("Must be a number").min(0).optional(),
});
