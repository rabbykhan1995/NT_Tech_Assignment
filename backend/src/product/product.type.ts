import z from "zod";
import { createProductSchema, updateProductSchema } from "./product.validator";
import {  productTable } from "./product.table";

export type Product = typeof productTable.$inferSelect;

export type ProductPayload = typeof productTable.$inferInsert;

export type CreateProductInput = z.infer<typeof createProductSchema>;

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

