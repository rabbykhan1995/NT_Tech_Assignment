import z from "zod";
import {
  createSupplierProductSchema,
  updateSupplierProductSchema,
} from "./supplier_product.validator";
import { supplierProductTable } from "./supplier_product.table";

export type SupplierProduct = typeof supplierProductTable.$inferSelect;

export type SupplierProductPayload = typeof supplierProductTable.$inferInsert;

export type CreateSupplierProductInput = z.infer<typeof createSupplierProductSchema>;

export type UpdateSupplierProductInput = z.infer<typeof updateSupplierProductSchema>;
